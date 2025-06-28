/**
 * Cloudflare Function to collect Core Web Vitals metrics in batch
 * Useful for offline scenarios and bulk processing
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
  sent?: number
}

interface BatchRequest {
  metrics: MetricData[]
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
    const { metrics }: BatchRequest = await request.json()

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return new Response('No metrics provided', {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Rate limiting by IP (max 1000 metrics per hour in batch)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
    const rateLimitKey = `batch_rate_limit:${clientIP}:${Math.floor(Date.now() / 3600000)}`

    const currentCount = await env.METRICS_KV?.get(rateLimitKey)
    if (currentCount && parseInt(currentCount) > 1000) {
      return new Response('Batch rate limit exceeded', {
        status: 429,
        headers: corsHeaders,
      })
    }

    let processedCount = 0
    let errorCount = 0

    // Process each metric
    for (const metric of metrics.slice(0, 50)) {
      // Limit to 50 metrics per batch
      try {
        // Validate required fields
        if (!metric.metric || metric.value === undefined || !metric.url) {
          errorCount++
          continue
        }

        // Store the metric
        const metricKey = `metric:${metric.timestamp || Date.now()}:${Math.random().toString(36).substr(2, 9)}`
        const metricValue = {
          ...metric,
          clientIP,
          batchProcessed: true,
          received: Date.now(),
        }

        await env.METRICS_KV?.put(metricKey, JSON.stringify(metricValue), {
          expirationTtl: 30 * 24 * 60 * 60, // 30 days
        })

        // Update hourly aggregation
        const hourKey = `hourly:${metric.metric}:${Math.floor((metric.timestamp || Date.now()) / 3600000)}`
        const existingHourlyData = await env.METRICS_KV?.get(hourKey)

        let hourlyData = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          ratings: {} as Record<string, number>,
          batch: true,
        }

        if (existingHourlyData) {
          hourlyData = JSON.parse(existingHourlyData)
        }

        hourlyData.count += 1
        hourlyData.sum += metric.value
        hourlyData.min = Math.min(hourlyData.min, metric.value)
        hourlyData.max = Math.max(hourlyData.max, metric.value)
        hourlyData.ratings[metric.rating] =
          (hourlyData.ratings[metric.rating] || 0) + 1

        await env.METRICS_KV?.put(hourKey, JSON.stringify(hourlyData), {
          expirationTtl: 30 * 24 * 60 * 60, // 30 days
        })

        processedCount++
      } catch (error) {
        console.error('Error processing metric:', error)
        errorCount++
      }
    }

    // Update rate limit counter
    await env.METRICS_KV?.put(
      rateLimitKey,
      (parseInt(currentCount || '0') + processedCount).toString(),
      {
        expirationTtl: 3600, // 1 hour
      }
    )

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        errors: errorCount,
        total: metrics.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error processing batch metrics:', error)
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders,
    })
  }
}
