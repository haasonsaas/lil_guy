interface Env {
  // Environment variables can be added here if needed
  [key: string]: unknown
}

interface FeedbackSubmission {
  type: 'bug' | 'suggestion' | 'compliment' | 'question'
  category: 'api' | 'documentation' | 'performance' | 'features' | 'other'
  message: string
  endpoint?: string
  userAgent?: string
  contact?: string
  timestamp: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

interface FeedbackResponse {
  success: boolean
  message: string
  feedbackId?: string
  suggestions?: string[]
}

// Simple in-memory feedback storage (in production, you'd use KV or a database)
let feedbackData: Array<FeedbackSubmission & { id: string }> = []

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 3 // 3 feedback submissions per minute per IP

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

function generateFeedbackId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function validateFeedback(feedback: Record<string, unknown>): {
  valid: boolean
  error?: string
} {
  if (
    !feedback.type ||
    !['bug', 'suggestion', 'compliment', 'question'].includes(
      feedback.type as string
    )
  ) {
    return {
      valid: false,
      error:
        'Invalid or missing feedback type. Must be: bug, suggestion, compliment, or question',
    }
  }

  if (
    !feedback.category ||
    !['api', 'documentation', 'performance', 'features', 'other'].includes(
      feedback.category as string
    )
  ) {
    return {
      valid: false,
      error:
        'Invalid or missing category. Must be: api, documentation, performance, features, or other',
    }
  }

  if (
    !feedback.message ||
    typeof feedback.message !== 'string' ||
    feedback.message.trim().length < 10
  ) {
    return {
      valid: false,
      error: 'Message must be at least 10 characters long',
    }
  }

  if (feedback.message.length > 2000) {
    return { valid: false, error: 'Message must be less than 2000 characters' }
  }

  if (
    feedback.severity &&
    !['low', 'medium', 'high', 'critical'].includes(feedback.severity as string)
  ) {
    return {
      valid: false,
      error: 'Invalid severity. Must be: low, medium, high, or critical',
    }
  }

  return { valid: true }
}

function generateSuggestions(type: string, category: string): string[] {
  const suggestions: Record<string, Record<string, string[]>> = {
    bug: {
      api: [
        'Please include the exact endpoint URL and request parameters',
        'Include the error response if any',
        'Mention expected vs actual behavior',
      ],
      documentation: [
        'Please specify which section needs clarification',
        'Include what you were trying to accomplish',
        'Suggest specific improvements if possible',
      ],
      performance: [
        'Include response times if possible',
        'Mention which endpoint is slow',
        'Describe the performance issue in detail',
      ],
    },
    suggestion: {
      api: [
        'Describe the new feature or improvement',
        'Explain the use case this would solve',
        'Consider backward compatibility',
      ],
      features: [
        'Explain how this would improve the agent experience',
        'Describe the specific functionality needed',
        'Include examples if possible',
      ],
    },
  }

  return (
    suggestions[type]?.[category] || [
      'Thank you for your feedback!',
      'We review all submissions carefully',
      'Include as much detail as possible to help us improve',
    ]
  )
}

export async function onRequest(
  context: EventContext<Env, string, Record<string, unknown>>
): Promise<Response> {
  const { request } = context
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
          'Rate limit exceeded. Please wait before submitting more feedback.',
      }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (request.method === 'GET') {
    // Return feedback guidelines and schema
    const guidelines = {
      success: true,
      message: 'Feedback endpoint information',
      schema: {
        type: 'One of: bug, suggestion, compliment, question',
        category: 'One of: api, documentation, performance, features, other',
        message: 'Your feedback message (10-2000 characters)',
        endpoint: 'Optional: Which endpoint this relates to',
        contact: 'Optional: How to reach you for follow-up',
        severity: 'Optional: low, medium, high, critical (for bugs)',
      },
      examples: [
        {
          type: 'bug',
          category: 'api',
          message:
            'The search endpoint returns inconsistent results when using special characters',
          endpoint: '/api/search',
          severity: 'medium',
        },
        {
          type: 'suggestion',
          category: 'features',
          message:
            'Would love to see filtering by publication date in the search API',
          contact: 'agent@example.com',
        },
      ],
      guidelines: [
        'Be specific and detailed in your feedback',
        'Include steps to reproduce for bugs',
        'Suggest concrete improvements when possible',
        'All feedback is reviewed and appreciated',
      ],
    }

    return new Response(JSON.stringify(guidelines, null, 2), {
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
      const validation = validateFeedback(body)

      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            success: false,
            message: validation.error,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const userAgent = request.headers.get('User-Agent') || 'Unknown'
      const feedbackId = generateFeedbackId()

      const feedback: FeedbackSubmission & { id: string } = {
        id: feedbackId,
        type: body.type,
        category: body.category,
        message: body.message.trim(),
        endpoint: body.endpoint,
        userAgent,
        contact: body.contact,
        timestamp: new Date().toISOString(),
        severity: body.severity || (body.type === 'bug' ? 'medium' : undefined),
      }

      feedbackData.push(feedback)

      // Keep only the last 100 feedback items to prevent memory issues
      if (feedbackData.length > 100) {
        feedbackData = feedbackData.slice(-100)
      }

      const suggestions = generateSuggestions(body.type, body.category)

      const response: FeedbackResponse = {
        success: true,
        message:
          'Feedback submitted successfully. Thank you for helping improve our AI-agent experience!',
        feedbackId,
        suggestions,
      }

      return new Response(JSON.stringify(response, null, 2), {
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
