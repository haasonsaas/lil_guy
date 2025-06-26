interface Env {
  AGENT_ANALYTICS?: KVNamespace
}

interface AnalyticsEvent {
  event: string
  agent?: string
  endpoint?: string
  userAgent?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

interface AnalyticsResponse {
  success: boolean
  message: string
  stats?: {
    totalEvents: number
    topEndpoints: Array<{ endpoint: string; count: number }>
    topAgents: Array<{ agent: string; count: number }>
    timeRange: string
  }
}

// Simple in-memory analytics (in production, you'd use KV or a database)
let analyticsData: AnalyticsEvent[] = []

const MAX_EVENTS = 1000 // Keep last 1000 events
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 analytics events per minute per IP

const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const current = rateLimitMap.get(ip)

  if (!current || now - current.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return false
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return true
  }

  current.count++
  return false
}

function getClientIP(request: Request): string {
  // Try to get real IP from Cloudflare headers
  const cfConnectingIP = request.headers.get('CF-Connecting-IP')
  if (cfConnectingIP) return cfConnectingIP

  // Fallback to other headers
  const xForwardedFor = request.headers.get('X-Forwarded-For')
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim()

  const xRealIP = request.headers.get('X-Real-IP')
  if (xRealIP) return xRealIP

  return 'unknown'
}

function detectAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase()

  // AI/ML frameworks and tools
  if (ua.includes('openai')) return 'OpenAI'
  if (ua.includes('anthropic') || ua.includes('claude')) return 'Claude'
  if (ua.includes('python-requests')) return 'Python Requests'
  if (ua.includes('langchain')) return 'LangChain'
  if (ua.includes('llama')) return 'LLaMA'
  if (ua.includes('chatgpt')) return 'ChatGPT'

  // Development tools
  if (ua.includes('curl')) return 'cURL'
  if (ua.includes('wget')) return 'wget'
  if (ua.includes('postman')) return 'Postman'
  if (ua.includes('insomnia')) return 'Insomnia'

  // Programming languages
  if (ua.includes('python')) return 'Python'
  if (ua.includes('node')) return 'Node.js'
  if (ua.includes('go-http')) return 'Go'
  if (ua.includes('java')) return 'Java'

  // Default to browser name for human users
  if (ua.includes('chrome')) return 'Chrome Browser'
  if (ua.includes('firefox')) return 'Firefox Browser'
  if (ua.includes('safari')) return 'Safari Browser'

  return 'Unknown'
}

async function addEvent(event: AnalyticsEvent, kv?: KVNamespace) {
  // Add to in-memory storage (for immediate access)
  analyticsData.push(event)

  // Keep only the last MAX_EVENTS in memory
  if (analyticsData.length > MAX_EVENTS) {
    analyticsData = analyticsData.slice(-MAX_EVENTS)
  }

  // Persist to KV if available
  if (kv) {
    try {
      const eventKey = `event:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
      await kv.put(eventKey, JSON.stringify(event), {
        expirationTtl: 30 * 24 * 60 * 60, // 30 days
      })

      // Also maintain a rolling summary
      const today = new Date().toISOString().split('T')[0]
      const summaryKey = `summary:${today}`

      const existingSummary = await kv.get(summaryKey)
      const summary = existingSummary
        ? JSON.parse(existingSummary)
        : {
            date: today,
            totalEvents: 0,
            endpoints: {},
            agents: {},
            events: {},
          }

      summary.totalEvents++
      summary.events[event.event] = (summary.events[event.event] || 0) + 1
      if (event.endpoint)
        summary.endpoints[event.endpoint] =
          (summary.endpoints[event.endpoint] || 0) + 1
      if (event.agent)
        summary.agents[event.agent] = (summary.agents[event.agent] || 0) + 1

      await kv.put(summaryKey, JSON.stringify(summary), {
        expirationTtl: 30 * 24 * 60 * 60, // 30 days
      })
    } catch (error) {
      console.error('Failed to persist analytics event to KV:', error)
    }
  }
}

async function getStats(
  kv?: KVNamespace,
  days = 7
): Promise<AnalyticsResponse['stats']> {
  let stats = {
    totalEvents: 0,
    topEndpoints: [] as Array<{ endpoint: string; count: number }>,
    topAgents: [] as Array<{ agent: string; count: number }>,
    timeRange: 'No data',
  }

  // Try to get data from KV first
  if (kv) {
    try {
      const endpointCounts = new Map<string, number>()
      const agentCounts = new Map<string, number>()
      let totalEvents = 0
      const dates: string[] = []

      // Get summaries for the last N days
      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        dates.push(dateStr)

        const summaryKey = `summary:${dateStr}`
        const summary = await kv.get(summaryKey)

        if (summary) {
          const data = JSON.parse(summary)
          totalEvents += data.totalEvents || 0

          // Aggregate endpoints
          for (const [endpoint, count] of Object.entries(
            data.endpoints || {}
          )) {
            endpointCounts.set(
              endpoint,
              (endpointCounts.get(endpoint) || 0) + (count as number)
            )
          }

          // Aggregate agents
          for (const [agent, count] of Object.entries(data.agents || {})) {
            agentCounts.set(
              agent,
              (agentCounts.get(agent) || 0) + (count as number)
            )
          }
        }
      }

      if (totalEvents > 0) {
        stats = {
          totalEvents,
          topEndpoints: Array.from(endpointCounts.entries())
            .map(([endpoint, count]) => ({ endpoint, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
          topAgents: Array.from(agentCounts.entries())
            .map(([agent, count]) => ({ agent, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
          timeRange: `Last ${days} days (${dates[dates.length - 1]} to ${dates[0]})`,
        }
      }
    } catch (error) {
      console.error('Failed to get stats from KV:', error)
    }
  }

  // Fallback to in-memory data if KV is empty or unavailable
  if (stats.totalEvents === 0 && analyticsData.length > 0) {
    const endpointCounts = new Map<string, number>()
    const agentCounts = new Map<string, number>()

    for (const event of analyticsData) {
      if (event.endpoint) {
        endpointCounts.set(
          event.endpoint,
          (endpointCounts.get(event.endpoint) || 0) + 1
        )
      }
      if (event.agent) {
        agentCounts.set(event.agent, (agentCounts.get(event.agent) || 0) + 1)
      }
    }

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const topAgents = Array.from(agentCounts.entries())
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const oldestEvent = analyticsData[0]
    const newestEvent = analyticsData[analyticsData.length - 1]

    stats = {
      totalEvents: analyticsData.length,
      topEndpoints,
      topAgents,
      timeRange: `In-memory: ${oldestEvent.timestamp} to ${newestEvent.timestamp}`,
    }
  }

  return stats
}

export async function onRequest(
  context: EventContext<Env, string, Record<string, unknown>>
): Promise<Response> {
  const { request, env } = context
  const clientIP = getClientIP(request)

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
    'Access-Control-Max-Age': '86400',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // Rate limiting
  if (isRateLimited(clientIP)) {
    return new Response(
      JSON.stringify({
        success: false,
        message:
          'Rate limit exceeded. Please wait before sending more analytics events.',
      }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (request.method === 'GET') {
    // Parse query parameters
    const url = new URL(request.url)
    const days = Math.min(parseInt(url.searchParams.get('days') || '7'), 30) // Max 30 days

    // Return analytics stats
    const stats = await getStats(env.AGENT_ANALYTICS, days)
    const response: AnalyticsResponse = {
      success: true,
      message: 'Analytics data retrieved successfully',
      stats,
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Agent-Friendly': 'true',
      },
    })
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json()
      const userAgent = request.headers.get('User-Agent') || 'Unknown'
      const detectedAgent = detectAgent(userAgent)

      const event: AnalyticsEvent = {
        event: body.event || 'api_access',
        agent: body.agent || detectedAgent,
        endpoint: body.endpoint,
        userAgent,
        timestamp: new Date().toISOString(),
        metadata: body.metadata || {},
      }

      await addEvent(event, env.AGENT_ANALYTICS)

      const response: AnalyticsResponse = {
        success: true,
        message: 'Analytics event recorded successfully',
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Agent-Friendly': 'true',
        },
      })
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid JSON in request body',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  }

  return new Response(
    JSON.stringify({
      success: false,
      message: 'Method not allowed',
    }),
    {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}
