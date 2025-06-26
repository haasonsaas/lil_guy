import type {
  PagesFunction,
  ExecutionContext,
  KVNamespace,
} from '@cloudflare/workers-types'

interface Env {
  RESEND_API_KEY: string
  SUBSCRIBERS: KVNamespace
  EMAIL_SCHEDULE: KVNamespace
}

interface ScheduledEmail {
  id: string
  email: string
  type: 'welcome1' | 'welcome2' | 'welcome3'
  sendAt: string
  audienceId?: string
  contactId?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.haasonsaas.com',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

/**
 * Create or get Resend audience
 */
async function ensureAudience(env: Env): Promise<string> {
  try {
    // First, try to list existing audiences
    const listResponse = await fetch('https://api.resend.com/audiences', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (listResponse.ok) {
      const audiences = await listResponse.json()
      const existingAudience = audiences.data?.find(
        (aud: { name: string; id: string }) =>
          aud.name === 'Haas on SaaS Subscribers'
      )
      if (existingAudience) {
        return existingAudience.id
      }
    }

    // Create new audience if it doesn't exist
    const createResponse = await fetch('https://api.resend.com/audiences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Haas on SaaS Subscribers',
      }),
    })

    if (!createResponse.ok) {
      throw new Error(
        `Failed to create audience: ${await createResponse.text()}`
      )
    }

    const audienceData = await createResponse.json()
    console.log('Created Resend audience:', audienceData.id)
    return audienceData.id
  } catch (error) {
    console.error('Error managing Resend audience:', error)
    throw error
  }
}

/**
 * Add contact to Resend audience
 */
async function addToAudience(
  env: Env,
  email: string,
  audienceId: string
): Promise<string> {
  try {
    const response = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: '', // Could be enhanced with name collection
          last_name: '',
          unsubscribed: false,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      // Don't throw if contact already exists
      if (response.status === 409) {
        console.log(`Contact ${email} already exists in audience`)
        return ''
      }
      throw new Error(`Failed to add contact: ${errorText}`)
    }

    const contactData = await response.json()
    console.log(`Added ${email} to Resend audience:`, contactData.id)
    return contactData.id
  } catch (error) {
    console.error('Error adding contact to audience:', error)
    throw error
  }
}

/**
 * Send individual email using Resend
 */
async function sendWelcomeEmail(
  env: Env,
  email: string,
  type: 'welcome1' | 'welcome2' | 'welcome3'
): Promise<boolean> {
  try {
    const template = getEmailTemplate(type, { email })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Jonathan Haas <jonathan@haasonsaas.com>',
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        headers: {
          'List-Unsubscribe': `<https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(email)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        tags: [
          { name: 'campaign', value: 'welcome-series' },
          { name: 'email_type', value: type },
        ],
      }),
    })

    if (!response.ok) {
      console.error(
        `Failed to send ${type} to ${email}:`,
        await response.text()
      )
      return false
    }

    const result = await response.json()
    console.log(`Sent ${type} to ${email}:`, result.id)
    return true
  } catch (error) {
    console.error(`Error sending ${type} to ${email}:`, error)
    return false
  }
}

/**
 * Schedule email for later delivery
 */
async function scheduleEmail(
  env: Env,
  email: string,
  type: 'welcome1' | 'welcome2' | 'welcome3',
  delayHours: number
): Promise<void> {
  const sendAt = new Date(
    Date.now() + delayHours * 60 * 60 * 1000
  ).toISOString()
  const scheduledEmail: ScheduledEmail = {
    id: `${type}_${email}_${Date.now()}`,
    email,
    type,
    sendAt,
  }

  await env.EMAIL_SCHEDULE.put(
    scheduledEmail.id,
    JSON.stringify(scheduledEmail)
  )
  console.log(`Scheduled ${type} for ${email} at ${sendAt}`)
}

/**
 * Process scheduled emails
 */
async function processScheduledEmails(
  env: Env
): Promise<{ sent: number; failed: number }> {
  const now = new Date().toISOString()
  let sent = 0
  let failed = 0

  try {
    const list = await env.EMAIL_SCHEDULE.list()

    for (const key of list.keys) {
      try {
        const scheduledData = await env.EMAIL_SCHEDULE.get(key.name)
        if (!scheduledData) continue

        const scheduled: ScheduledEmail = JSON.parse(scheduledData)

        if (scheduled.sendAt <= now) {
          const success = await sendWelcomeEmail(
            env,
            scheduled.email,
            scheduled.type
          )

          if (success) {
            sent++
            // Update subscriber record
            await updateSubscriberEmailSent(
              env,
              scheduled.email,
              scheduled.type
            )
          } else {
            failed++
          }

          // Remove from schedule regardless of success/failure
          await env.EMAIL_SCHEDULE.delete(key.name)
        }
      } catch (error) {
        console.error(`Error processing scheduled email ${key.name}:`, error)
        failed++
        // Remove problematic scheduled email
        await env.EMAIL_SCHEDULE.delete(key.name)
      }
    }
  } catch (error) {
    console.error('Error processing scheduled emails:', error)
  }

  return { sent, failed }
}

/**
 * Update subscriber record when email is sent
 */
async function updateSubscriberEmailSent(
  env: Env,
  email: string,
  emailType: string
): Promise<void> {
  try {
    const subscriberData = await env.SUBSCRIBERS.get(email)
    if (subscriberData) {
      const subscriber = JSON.parse(subscriberData)

      if (!subscriber.emailsSent) {
        subscriber.emailsSent = {}
      }

      subscriber.emailsSent[emailType] = new Date().toISOString()

      // Mark welcome series as completed if this was the last email
      if (emailType === 'welcome3' && subscriber.preferences) {
        subscriber.preferences.welcomeSeriesCompleted = true
      }

      await env.SUBSCRIBERS.put(email, JSON.stringify(subscriber))
    }
  } catch (error) {
    console.error(`Error updating subscriber ${email}:`, error)
  }
}

/**
 * Trigger welcome series
 */
async function triggerWelcomeSeries(env: Env, email: string): Promise<void> {
  try {
    // Add to Resend audience
    const audienceId = await ensureAudience(env)
    await addToAudience(env, email, audienceId)

    // Send first email immediately
    await sendWelcomeEmail(env, email, 'welcome1')
    await updateSubscriberEmailSent(env, email, 'welcome1')

    // Schedule follow-up emails
    await scheduleEmail(env, email, 'welcome2', 24)
    await scheduleEmail(env, email, 'welcome3', 72)

    console.log(`Welcome series triggered for ${email}`)
  } catch (error) {
    console.error(`Error triggering welcome series for ${email}:`, error)
    throw error
  }
}

/**
 * Simple email templates (same as before)
 */
function getEmailTemplate(
  type: 'welcome1' | 'welcome2' | 'welcome3',
  data: { email: string }
) {
  switch (type) {
    case 'welcome1':
      return {
        subject: 'Welcome to Haas on SaaS! 👋',
        html: getWelcome1HTML(data.email),
        text: getWelcome1Text(data.email),
      }
    case 'welcome2':
      return {
        subject: 'My favorite posts to get you started',
        html: getWelcome2HTML(data.email),
        text: getWelcome2Text(data.email),
      }
    case 'welcome3':
      return {
        subject: 'The reality of building in 2025',
        html: getWelcome3HTML(data.email),
        text: getWelcome3Text(data.email),
      }
    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}

function getWelcome1HTML(email: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Haas on SaaS</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { margin-bottom: 30px; }
    .cta { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px; color: #666; font-size: 14px; }
  </style>
</head>
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
</html>`
}

function getWelcome1Text(email: string): string {
  return `Welcome to Haas on SaaS! 👋

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
Website: https://haasonsaas.com`
}

function getWelcome2HTML(email: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .post-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .post-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .post-link { color: #2563eb; text-decoration: none; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>My favorite posts to get you started</h1>
  
  <p>Hi again,</p>
  
  <p>Yesterday I introduced myself. Today, I want to share three posts that capture what I write about:</p>
  
  <div class="post-card">
    <div class="post-title"><a href="https://haasonsaas.com/blog/technical-founder-pmf" class="post-link">Technical Founder PMF</a></div>
    <p>Why technical founders struggle with product-market fit, and how to bridge the gap.</p>
    <small>5 min read • Product Strategy</small>
  </div>
  
  <div class="post-card">
    <div class="post-title"><a href="https://haasonsaas.com/blog/the-startup-bargain" class="post-link">The Startup Bargain</a></div>
    <p>The unspoken deal every startup makes: sacrifice everything for a chance at something extraordinary.</p>
    <small>7 min read • Founder Psychology</small>
  </div>
  
  <div class="post-card">
    <div class="post-title"><a href="https://haasonsaas.com/blog/full-stack-ai" class="post-link">Full-Stack AI</a></div>
    <p>Building AI products isn't just about the model. It's about the entire stack.</p>
    <small>8 min read • AI Development</small>
  </div>
  
  <p>Tomorrow, I'll share my take on what's actually happening in tech right now.</p>
  
  <p>Talk soon,<br>Jonathan</p>
  
  <div class="footer">
    <p><a href="https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a> | <a href="https://haasonsaas.com">haasonsaas.com</a></p>
  </div>
</body>
</html>`
}

function getWelcome2Text(email: string): string {
  return `My favorite posts to get you started

Hi again,

Yesterday I introduced myself. Today, three posts that capture what I write about:

Technical Founder PMF
https://haasonsaas.com/blog/technical-founder-pmf
Why technical founders struggle with product-market fit, and how to bridge the gap.

The Startup Bargain  
https://haasonsaas.com/blog/the-startup-bargain
The unspoken deal every startup makes: sacrifice everything for a chance at something extraordinary.

Full-Stack AI
https://haasonsaas.com/blog/full-stack-ai
Building AI products isn't just about the model. It's about the entire stack.

Tomorrow, I'll share my take on what's actually happening in tech right now.

Talk soon,
Jonathan

---
Unsubscribe: https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(email)}`
}

function getWelcome3HTML(email: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .highlight { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>The reality of building in 2025</h1>
  
  <p>Final email in this welcome series.</p>
  
  <p>I want to share my take on where we are right now — because I think it's one of the most interesting times to be building software.</p>
  
  <div class="highlight">
    <p><strong>The AI Revolution is Real, But Not How You Think</strong></p>
    <p>Everyone's talking about AI replacing developers. The reality? AI is becoming plumbing. The companies that win will use AI to solve real problems, not build AI for AI's sake.</p>
  </div>
  
  <p>Here's what I'm seeing after 10 years in enterprise software:</p>
  
  <ul>
    <li><strong>Technical complexity is increasing</strong> — Modern SaaS stacks are more sophisticated than ever</li>
    <li><strong>User expectations are rising</strong> — B2B software that feels like consumer apps isn't optional</li>
    <li><strong>Market dynamics are shifting</strong> — Vertical SaaS is eating horizontal tools</li>
  </ul>
  
  <p>That's exactly what I write about every week. Not the hype, but the messy reality of building things people actually want.</p>
  
  <p>Thanks for subscribing. You'll hear from me every Tuesday with tactical insights and real stories from the trenches.</p>
  
  <p>Let's build something great,<br>Jonathan</p>
  
  <p><em>P.S. Feel free to reply — I read and respond to everything.</em></p>
  
  <div class="footer">
    <p><a href="https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a> | <a href="https://haasonsaas.com">haasonsaas.com</a></p>
  </div>
</body>
</html>`
}

function getWelcome3Text(email: string): string {
  return `The reality of building in 2025

Final email in this welcome series.

I want to share my take on where we are right now — one of the most interesting times to be building software.

The AI Revolution is Real, But Not How You Think
Everyone's talking about AI replacing developers. The reality? AI is becoming plumbing. The companies that win will use AI to solve real problems, not build AI for AI's sake.

Here's what I'm seeing after 10 years in enterprise software:
• Technical complexity is increasing — Modern SaaS stacks are more sophisticated than ever
• User expectations are rising — B2B software that feels like consumer apps isn't optional  
• Market dynamics are shifting — Vertical SaaS is eating horizontal tools

That's exactly what I write about every week. Not the hype, but the messy reality of building things people actually want.

Thanks for subscribing. You'll hear from me every Tuesday with tactical insights and real stories from the trenches.

Let's build something great,
Jonathan

P.S. Feel free to reply — I read and respond to everything.

---
Unsubscribe: https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(email)}`
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      // Process scheduled emails
      if (url.pathname === '/process-scheduled' && request.method === 'POST') {
        const result = await processScheduledEmails(env)
        return new Response(JSON.stringify(result), {
          headers: responseHeaders,
        })
      }

      // Trigger welcome series
      if (url.pathname === '/trigger-welcome' && request.method === 'POST') {
        const { email } = (await request.json()) as { email: string }
        if (!email) {
          return new Response(JSON.stringify({ error: 'Email required' }), {
            status: 400,
            headers: responseHeaders,
          })
        }

        await triggerWelcomeSeries(env, email)
        return new Response(JSON.stringify({ success: true }), {
          headers: responseHeaders,
        })
      }

      return new Response('Not found', {
        status: 404,
        headers: responseHeaders,
      })
    } catch (error) {
      console.error('Resend automation error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: responseHeaders,
      })
    }
  },

  // Cron trigger for processing scheduled emails
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Processing scheduled emails...')
    const result = await processScheduledEmails(env)
    console.log(
      `Scheduled emails processed: ${result.sent} sent, ${result.failed} failed`
    )
  },
}
