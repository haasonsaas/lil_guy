/**
 * Cloudflare Function to collect Core Web Vitals metrics
 * Stores metrics in KV for later analysis
 */

interface MetricData {
  type: string
  metric: string
  value: number
  rating: string
  url: string
  timestamp: number
  userAgent: string
  connection: string
}

interface Env {
  METRICS_KV: KVNamespace
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const data: MetricData = await request.json()

    // Validate required fields
    if (!data.metric || !data.value || !data.url) {
      return new Response('Missing required fields', {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Rate limiting by IP (max 100 metrics per hour)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
    const rateLimitKey = `rate_limit:${clientIP}:${Math.floor(Date.now() / 3600000)}`

    const currentCount = await env.METRICS_KV.get(rateLimitKey)
    if (currentCount && parseInt(currentCount) > 100) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: corsHeaders,
      })
    }

    // Store the metric with timestamp-based key for easy querying
    const metricKey = `metric:${data.timestamp}:${Math.random().toString(36).substr(2, 9)}`
    const metricValue = {
      ...data,
      clientIP,
      timestamp: data.timestamp || Date.now(),
      received: Date.now(),
    }

    await env.METRICS_KV.put(metricKey, JSON.stringify(metricValue), {
      // Keep metrics for 30 days
      expirationTtl: 30 * 24 * 60 * 60,
    })

    // Update rate limit counter
    await env.METRICS_KV.put(
      rateLimitKey,
      (parseInt(currentCount || '0') + 1).toString(),
      {
        expirationTtl: 3600, // 1 hour
      }
    )

    // Also store aggregated hourly data for easier analysis
    const hourKey = `hourly:${data.metric}:${Math.floor(data.timestamp / 3600000)}`
    const existingHourlyData = await env.METRICS_KV.get(hourKey)

    let hourlyData: {
      count: number
      sum: number
      min: number
      max: number
      ratings: Record<string, number>
      lastUpdated?: number
    } = { count: 0, sum: 0, min: Infinity, max: -Infinity, ratings: {} }
    if (existingHourlyData) {
      hourlyData = JSON.parse(existingHourlyData)
    }

    hourlyData.count += 1
    hourlyData.sum += data.value
    hourlyData.min = Math.min(hourlyData.min, data.value)
    hourlyData.max = Math.max(hourlyData.max, data.value)
    hourlyData.ratings[data.rating] = (hourlyData.ratings[data.rating] || 0) + 1
    hourlyData.lastUpdated = Date.now()

    await env.METRICS_KV.put(hourKey, JSON.stringify(hourlyData), {
      expirationTtl: 30 * 24 * 60 * 60, // 30 days
    })

    return new Response('OK', {
      status: 200,
      headers: corsHeaders,
    })
  } catch (error) {
    console.error('Error processing metrics:', error)
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders,
    })
  }
}
