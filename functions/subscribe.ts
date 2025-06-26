import type {
  PagesFunction,
  ExecutionContext,
  KVNamespace,
} from '@cloudflare/workers-types'

interface Env {
  // Add your environment variables here
  RESEND_API_KEY: string
  SUBSCRIBERS: KVNamespace
  RATE_LIMIT: KVNamespace
}

interface RequestBody {
  email: string
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 60 // 1 hour in seconds
const MAX_REQUESTS_PER_WINDOW = 5 // Maximum 5 requests per hour

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.haasonsaas.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
}

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

const responseHeaders = {
  ...corsHeaders,
  ...securityHeaders,
  'Content-Type': 'application/json',
}

async function checkRateLimit(
  env: Env,
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:${ip}`
  const now = Math.floor(Date.now() / 1000)

  try {
    // Get the current rate limit data
    const data = await env.RATE_LIMIT.get(key)
    let count = 0
    let windowStart = now

    if (data) {
      try {
        const { count: storedCount, windowStart: storedWindowStart } =
          JSON.parse(data)
        // If we're still in the same window, use the stored count
        if (now - storedWindowStart < RATE_LIMIT_WINDOW) {
          count = storedCount
          windowStart = storedWindowStart
        }
      } catch (e) {
        console.error('Error parsing rate limit data:', e)
        // If there's an error parsing, start fresh
        count = 0
        windowStart = now
      }
    }

    // Increment the count
    count++

    // Store the updated count
    await env.RATE_LIMIT.put(
      key,
      JSON.stringify({
        count,
        windowStart,
      }),
      {
        expirationTtl: RATE_LIMIT_WINDOW,
      }
    )

    console.log(
      `Rate limit check for IP ${ip}: count=${count}, windowStart=${windowStart}, allowed=${count <= MAX_REQUESTS_PER_WINDOW}`
    )

    return {
      allowed: count <= MAX_REQUESTS_PER_WINDOW,
      remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - count),
    }
  } catch (error) {
    console.error('Error in rate limit check:', error)
    // If there's an error with rate limiting, allow the request
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW }
  }
}

export async function onRequestPost(context: {
  request: Request
  env: Env
  params: Record<string, string>
  waitUntil: (promise: Promise<unknown>) => void
}): Promise<Response> {
  const { request, env } = context

  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
    console.log(`Request from IP: ${ip}`)

    // Check rate limit
    const rateLimit = await checkRateLimit(env, ip)
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for IP ${ip}`)
      return new Response(
        JSON.stringify({
          error: 'Too many subscription attempts. Please try again later.',
          retryAfter: RATE_LIMIT_WINDOW,
        }),
        {
          status: 429,
          headers: {
            ...responseHeaders,
            'Retry-After': RATE_LIMIT_WINDOW.toString(),
          },
        }
      )
    }

    // Parse the request body
    const data = (await request.json()) as RequestBody
    const { email } = data

    if (!email) {
      return new Response('Email is required', {
        status: 400,
        headers: responseHeaders,
      })
    }

    console.log('Processing new subscriber:', email)

    // Check if subscriber already exists
    const existingSubscriber = await env.SUBSCRIBERS.get(email)
    if (existingSubscriber) {
      return new Response(
        JSON.stringify({ error: 'Email already subscribed' }),
        {
          status: 400,
          headers: responseHeaders,
        }
      )
    }

    // Store subscriber in KV with preferences structure
    const subscriberData = {
      email,
      subscribedAt: new Date().toISOString(),
      preferences: {
        welcomeSeriesCompleted: false,
        unsubscribed: false,
        tags: [],
      },
      emailsSent: {},
    }

    await env.SUBSCRIBERS.put(email, JSON.stringify(subscriberData))
    console.log('Subscriber stored in KV:', email)

    // Send email using Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@haasonsaas.com',
        to: 'jonathan@haas.holdings',
        subject: 'New Subscriber Alert',
        text: `New subscriber: ${email}`,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)
      throw new Error(`Failed to send email: ${JSON.stringify(resendData)}`)
    }

    console.log('Email sent successfully:', resendData)

    // Send immediate welcome email using Resend
    try {
      const welcomeResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'jonathan@haasonsaas.com',
          to: email,
          subject: 'Welcome to Haas on SaaS! 👋',
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.content{margin-bottom:30px}.cta{background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:20px 0}.footer{border-top:1px solid #eee;padding-top:20px;margin-top:40px;color:#666;font-size:14px}</style></head>
<body>
<h1>Welcome to Haas on SaaS! 👋</h1>
<div class="content">
<p>Hey there,</p>
<p>Thanks for subscribing! I'm Jonathan, and I write about the reality of building and scaling SaaS companies — the stuff they don't teach you in the startup playbooks.</p>
<p>After a decade building enterprise software, I've learned that success comes down to three things:</p>
<ul>
<li><strong>Technical vision</strong> that actually solves real problems</li>
<li><strong>Market reality</strong> that cuts through the hype</li>
<li><strong>Execution discipline</strong> that bridges the gap between them</li>
</ul>
<p>Every Tuesday, I send one tactical insight that helps founders and builders navigate this complexity. No fluff, all signal.</p>
<a href="https://haasonsaas.com/blog" class="cta">Browse Recent Posts</a>
<p>Over the next few days, I'll share some of my favorite posts to get you started.</p>
<p>Looking forward to having you along for the ride.</p>
<p>Best,<br>Jonathan</p>
</div>
<div class="footer">
<p>You're receiving this because you subscribed to Haas on SaaS.</p>
<p><a href="https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a> | <a href="https://haasonsaas.com">haasonsaas.com</a></p>
</div>
</body>
</html>`,
          text: `Welcome to Haas on SaaS! 👋

Hey there,

Thanks for subscribing! I'm Jonathan, and I write about the reality of building and scaling SaaS companies.

After a decade building enterprise software, I've learned that success comes down to three things:
• Technical vision that actually solves real problems
• Market reality that cuts through the hype  
• Execution discipline that bridges the gap between them

Every Tuesday, I send one tactical insight. No fluff, all signal.

Browse recent posts: https://haasonsaas.com/blog

Over the next few days, I'll share some of my favorite posts to get you started.

Looking forward to having you along for the ride.

Best,
Jonathan

---
Unsubscribe: https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(email)}
Website: https://haasonsaas.com`,
          headers: {
            'List-Unsubscribe': `<https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(email)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
          tags: [
            { name: 'campaign', value: 'welcome-series' },
            { name: 'email_type', value: 'welcome1' },
          ],
        }),
      })

      if (welcomeResponse.ok) {
        const welcomeData = await welcomeResponse.json()
        console.log(
          'Welcome email sent immediately to:',
          email,
          'ID:',
          welcomeData.id
        )
      } else {
        const errorText = await welcomeResponse.text()
        console.error('Failed to send welcome email:', errorText)
        console.error('Welcome response status:', welcomeResponse.status)
      }
    } catch (error) {
      console.error('Error sending welcome email:', error)
      // Don't fail the subscription if welcome email fails
    }

    // Try to trigger full automation series (will work once KV is set up)
    try {
      const automationResponse = await fetch(
        'https://haas-blog.haasholdings.workers.dev/resend-automation/trigger-welcome',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      )

      if (automationResponse.ok) {
        console.log('Full welcome series triggered for:', email)
      }
    } catch (error) {
      console.log(
        'Full automation not available yet, welcome email sent directly'
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: responseHeaders,
      }
    )
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: corsHeaders,
  })
}
