import type { PagesFunction, ExecutionContext, KVNamespace } from '@cloudflare/workers-types';

interface Env {
  RESEND_API_KEY: string;
  SUBSCRIBERS: KVNamespace;
  EMAIL_QUEUE: KVNamespace;
}

interface Subscriber {
  email: string;
  subscribedAt: string;
  preferences?: {
    welcomeSeriesCompleted?: boolean;
    unsubscribed?: boolean;
    tags?: string[];
  };
  emailsSent?: {
    welcome1?: string;
    welcome2?: string;
    welcome3?: string;
  };
}

interface QueuedEmail {
  id: string;
  email: string;
  type: 'welcome1' | 'welcome2' | 'welcome3' | 'weekly_digest' | 'new_post';
  scheduledFor: string;
  templateData: Record<string, unknown>;
  retries: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.haasonsaas.com',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

const responseHeaders = {
  ...corsHeaders,
  ...securityHeaders,
  'Content-Type': 'application/json',
};

/**
 * Send email using Resend API
 */
async function sendEmail(env: Env, email: QueuedEmail): Promise<boolean> {
  try {
    const template = getEmailTemplate(email.type, email.templateData);
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Jonathan Haas <jonathan@haasonsaas.com>',
        to: email.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        headers: {
          'List-Unsubscribe': `<https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(email.email)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error(`Failed to send ${email.type} to ${email.email}:`, resendData);
      return false;
    }

    console.log(`Successfully sent ${email.type} to ${email.email}:`, resendData.id);
    return true;
  } catch (error) {
    console.error(`Error sending ${email.type} to ${email.email}:`, error);
    return false;
  }
}

/**
 * Get email template based on type
 */
function getEmailTemplate(type: string, data: Record<string, unknown>) {
  switch (type) {
    case 'welcome1':
      return {
        subject: 'Welcome to Haas on SaaS! 👋',
        html: getWelcome1HTML(data),
        text: getWelcome1Text(data)
      };
    case 'welcome2':
      return {
        subject: 'My favorite posts to get you started',
        html: getWelcome2HTML(data),
        text: getWelcome2Text(data)
      };
    case 'welcome3':
      return {
        subject: 'The reality of building in 2025',
        html: getWelcome3HTML(data),
        text: getWelcome3Text(data)
      };
    default:
      throw new Error(`Unknown email template: ${type}`);
  }
}

/**
 * Welcome Email 1 - Introduction
 */
function getWelcome1HTML(data: Record<string, unknown>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Haas on SaaS</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .content { margin-bottom: 30px; }
    .cta { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px; color: #666; font-size: 14px; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Haas on SaaS! 👋</h1>
  </div>
  
  <div class="content">
    <p>Hey there,</p>
    
    <p>Thanks for subscribing! I'm Jonathan, and I write about the reality of building and scaling SaaS companies — the stuff they don't teach you in the startup playbooks.</p>
    
    <p>After a decade building enterprise software (from security tools to vertical SaaS), I've learned that success comes down to three things:</p>
    
    <ul>
      <li><strong>Technical vision</strong> that actually solves real problems</li>
      <li><strong>Market reality</strong> that cuts through the hype</li>
      <li><strong>Execution discipline</strong> that bridges the gap between them</li>
    </ul>
    
    <p>Every Tuesday, I send one tactical insight that helps founders and builders navigate this complexity. No fluff, all signal.</p>
    
    <a href="https://haasonsaas.com/blog" class="cta">Browse Recent Posts</a>
    
    <div class="signature">
      <p>Over the next few days, I'll share some of my favorite posts to get you started. But for now, here's what you can expect:</p>
      
      <ul>
        <li>Real stories from the trenches of SaaS building</li>
        <li>Tactical advice on AI, product strategy, and team dynamics</li>
        <li>Honest takes on what actually works (and what doesn't)</li>
      </ul>
      
      <p>Looking forward to having you along for the ride.</p>
      
      <p>Best,<br>Jonathan</p>
    </div>
  </div>
  
  <div class="footer">
    <p>You're receiving this because you subscribed to Haas on SaaS.</p>
    <p><a href="https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(data.email || '')}">Unsubscribe</a> | <a href="https://haasonsaas.com">haasonsaas.com</a></p>
  </div>
</body>
</html>`;
}

function getWelcome1Text(data: Record<string, unknown>): string {
  return `Welcome to Haas on SaaS! 👋

Hey there,

Thanks for subscribing! I'm Jonathan, and I write about the reality of building and scaling SaaS companies — the stuff they don't teach you in the startup playbooks.

After a decade building enterprise software (from security tools to vertical SaaS), I've learned that success comes down to three things:

• Technical vision that actually solves real problems
• Market reality that cuts through the hype  
• Execution discipline that bridges the gap between them

Every Tuesday, I send one tactical insight that helps founders and builders navigate this complexity. No fluff, all signal.

Read recent posts: https://haasonsaas.com/blog

Over the next few days, I'll share some of my favorite posts to get you started. But for now, here's what you can expect:

• Real stories from the trenches of SaaS building
• Tactical advice on AI, product strategy, and team dynamics
• Honest takes on what actually works (and what doesn't)

Looking forward to having you along for the ride.

Best,
Jonathan

---
You're receiving this because you subscribed to Haas on SaaS.
Unsubscribe: https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(data.email || '')}
Website: https://haasonsaas.com`;
}

/**
 * Welcome Email 2 - Best Posts
 */
function getWelcome2HTML(data: Record<string, unknown>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My favorite posts to get you started</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .post-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .post-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .post-link { color: #2563eb; text-decoration: none; }
    .post-description { color: #6b7280; margin-bottom: 12px; }
    .post-meta { font-size: 14px; color: #9ca3af; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>My favorite posts to get you started</h1>
  
  <p>Hi again,</p>
  
  <p>Yesterday I introduced myself and what Haas on SaaS is about. Today, I want to share three posts that capture the essence of what I write about — real insights from building and scaling SaaS.</p>
  
  <div class="post-card">
    <div class="post-title">
      <a href="https://haasonsaas.com/blog/technical-founder-pmf" class="post-link">Technical Founder PMF</a>
    </div>
    <div class="post-description">
      Why technical founders often struggle with product-market fit, and how to bridge the gap between what you can build and what the market actually wants.
    </div>
    <div class="post-meta">5 min read • Product Strategy</div>
  </div>
  
  <div class="post-card">
    <div class="post-title">
      <a href="https://haasonsaas.com/blog/the-startup-bargain" class="post-link">The Startup Bargain</a>
    </div>
    <div class="post-description">
      The unspoken deal every startup makes: sacrifice everything for a chance at something extraordinary. Here's how to make sure it's worth it.
    </div>
    <div class="post-meta">7 min read • Founder Psychology</div>
  </div>
  
  <div class="post-card">
    <div class="post-title">
      <a href="https://haasonsaas.com/blog/full-stack-ai" class="post-link">Full-Stack AI</a>
    </div>
    <div class="post-description">
      Building AI products isn't just about the model. It's about the entire stack that makes AI useful in the real world — from data to deployment to user experience.
    </div>
    <div class="post-meta">8 min read • AI Development</div>
  </div>
  
  <p>These three posts represent different angles of what I cover: the psychology of building, product strategy insights, and technical reality checks.</p>
  
  <p>Tomorrow, I'll share my take on what's actually happening in tech right now — beyond the hype cycles and conference talks.</p>
  
  <p>Talk soon,<br>Jonathan</p>
  
  <div class="footer">
    <p>You're receiving this because you subscribed to Haas on SaaS.</p>
    <p><a href="https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(data.email || '')}">Unsubscribe</a> | <a href="https://haasonsaas.com">haasonsaas.com</a></p>
  </div>
</body>
</html>`;
}

function getWelcome2Text(data: Record<string, unknown>): string {
  return `My favorite posts to get you started

Hi again,

Yesterday I introduced myself and what Haas on SaaS is about. Today, I want to share three posts that capture the essence of what I write about — real insights from building and scaling SaaS.

Technical Founder PMF
https://haasonsaas.com/blog/technical-founder-pmf
Why technical founders often struggle with product-market fit, and how to bridge the gap between what you can build and what the market actually wants.
5 min read • Product Strategy

The Startup Bargain  
https://haasonsaas.com/blog/the-startup-bargain
The unspoken deal every startup makes: sacrifice everything for a chance at something extraordinary. Here's how to make sure it's worth it.
7 min read • Founder Psychology

Full-Stack AI
https://haasonsaas.com/blog/full-stack-ai
Building AI products isn't just about the model. It's about the entire stack that makes AI useful in the real world — from data to deployment to user experience.
8 min read • AI Development

These three posts represent different angles of what I cover: the psychology of building, product strategy insights, and technical reality checks.

Tomorrow, I'll share my take on what's actually happening in tech right now — beyond the hype cycles and conference talks.

Talk soon,
Jonathan

---
You're receiving this because you subscribed to Haas on SaaS.
Unsubscribe: https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(data.email || '')}
Website: https://haasonsaas.com`;
}

/**
 * Welcome Email 3 - Current Perspective
 */
function getWelcome3HTML(data: Record<string, unknown>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The reality of building in 2025</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .highlight { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .cta { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
    .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>The reality of building in 2025</h1>
  
  <p>Final email in this welcome series (don't worry, I'll be back with regular content soon).</p>
  
  <p>I want to share my take on where we are right now — because I think it's one of the most interesting times to be building software.</p>
  
  <div class="highlight">
    <p><strong>The AI Revolution is Real, But Not How You Think</strong></p>
    <p>Everyone's talking about AI replacing developers or creating magical user experiences. The reality? AI is becoming plumbing. The companies that win will be those that use AI to solve real problems, not those that build AI for AI's sake.</p>
  </div>
  
  <p>Here's what I'm seeing after 10 years in enterprise software:</p>
  
  <ul>
    <li><strong>Technical complexity is increasing</strong> — Modern SaaS stacks are more sophisticated than ever</li>
    <li><strong>User expectations are rising</strong> — B2B software that feels like consumer apps isn't optional anymore</li>
    <li><strong>Market dynamics are shifting</strong> — Vertical SaaS is eating horizontal tools, AI is commoditizing features</li>
  </ul>
  
  <p>But here's the opportunity: while everyone else is chasing the latest framework or AI trend, there's massive value in understanding what actually matters:</p>
  
  <ul>
    <li>Building for specific, painful problems</li>
    <li>Creating sustainable competitive advantages</li>
    <li>Balancing technical innovation with business reality</li>
  </ul>
  
  <div class="highlight">
    <p><strong>That's exactly what I write about every week.</strong></p>
    <p>Not the hype, not the hot takes, but the messy, complex reality of building things that people actually want to use and pay for.</p>
  </div>
  
  <p>Thanks for subscribing, and welcome to the community. You'll hear from me every Tuesday with tactical insights, honest perspectives, and real stories from the trenches.</p>
  
  <a href="https://haasonsaas.com/blog" class="cta">Explore All Posts</a>
  
  <p>Let's build something great,<br>Jonathan</p>
  
  <p><em>P.S. Feel free to reply to any of my emails — I read and respond to everything. What's your biggest challenge in building/scaling right now?</em></p>
  
  <div class="footer">
    <p>You're receiving this because you subscribed to Haas on SaaS.</p>
    <p><a href="https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(data.email || '')}">Unsubscribe</a> | <a href="https://haasonsaas.com">haasonsaas.com</a></p>
  </div>
</body>
</html>`;
}

function getWelcome3Text(data: Record<string, unknown>): string {
  return `The reality of building in 2025

Final email in this welcome series (don't worry, I'll be back with regular content soon).

I want to share my take on where we are right now — because I think it's one of the most interesting times to be building software.

The AI Revolution is Real, But Not How You Think

Everyone's talking about AI replacing developers or creating magical user experiences. The reality? AI is becoming plumbing. The companies that win will be those that use AI to solve real problems, not those that build AI for AI's sake.

Here's what I'm seeing after 10 years in enterprise software:

• Technical complexity is increasing — Modern SaaS stacks are more sophisticated than ever
• User expectations are rising — B2B software that feels like consumer apps isn't optional anymore  
• Market dynamics are shifting — Vertical SaaS is eating horizontal tools, AI is commoditizing features

But here's the opportunity: while everyone else is chasing the latest framework or AI trend, there's massive value in understanding what actually matters:

• Building for specific, painful problems
• Creating sustainable competitive advantages
• Balancing technical innovation with business reality

That's exactly what I write about every week.

Not the hype, not the hot takes, but the messy, complex reality of building things that people actually want to use and pay for.

Thanks for subscribing, and welcome to the community. You'll hear from me every Tuesday with tactical insights, honest perspectives, and real stories from the trenches.

Explore all posts: https://haasonsaas.com/blog

Let's build something great,
Jonathan

P.S. Feel free to reply to any of my emails — I read and respond to everything. What's your biggest challenge in building/scaling right now?

---
You're receiving this because you subscribed to Haas on SaaS.
Unsubscribe: https://haasonsaas.com/unsubscribe?email=${encodeURIComponent(data.email || '')}
Website: https://haasonsaas.com`;
}

/**
 * Queue an email to be sent
 */
async function queueEmail(env: Env, email: string, type: QueuedEmail['type'], delayHours: number = 0, templateData: Record<string, unknown> = {}): Promise<void> {
  const queuedEmail: QueuedEmail = {
    id: `${type}_${email}_${Date.now()}`,
    email,
    type,
    scheduledFor: new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString(),
    templateData: { email, ...templateData },
    retries: 0,
  };

  await env.EMAIL_QUEUE.put(queuedEmail.id, JSON.stringify(queuedEmail));
  console.log(`Queued ${type} email for ${email}, scheduled for ${queuedEmail.scheduledFor}`);
}

/**
 * Process queued emails (to be called by cron or manually)
 */
async function processEmailQueue(env: Env): Promise<{ processed: number; failed: number }> {
  const now = new Date().toISOString();
  let processed = 0;
  let failed = 0;

  // Get all queued emails (note: this is simplified - in production you'd paginate)
  const list = await env.EMAIL_QUEUE.list();
  
  for (const key of list.keys) {
    try {
      const queuedEmailData = await env.EMAIL_QUEUE.get(key.name);
      if (!queuedEmailData) continue;

      const queuedEmail: QueuedEmail = JSON.parse(queuedEmailData);
      
      // Check if it's time to send
      if (queuedEmail.scheduledFor <= now) {
        const success = await sendEmail(env, queuedEmail);
        
        if (success) {
          // Update subscriber record
          await updateSubscriberEmailSent(env, queuedEmail.email, queuedEmail.type);
          
          // Remove from queue
          await env.EMAIL_QUEUE.delete(key.name);
          processed++;
        } else {
          // Retry logic
          queuedEmail.retries++;
          if (queuedEmail.retries < 3) {
            // Retry in 1 hour
            queuedEmail.scheduledFor = new Date(Date.now() + 60 * 60 * 1000).toISOString();
            await env.EMAIL_QUEUE.put(key.name, JSON.stringify(queuedEmail));
          } else {
            // Max retries reached, remove from queue
            await env.EMAIL_QUEUE.delete(key.name);
            failed++;
          }
        }
      }
    } catch (error) {
      console.error(`Error processing queued email ${key.name}:`, error);
      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Update subscriber record when email is sent
 */
async function updateSubscriberEmailSent(env: Env, email: string, emailType: string): Promise<void> {
  try {
    const subscriberData = await env.SUBSCRIBERS.get(email);
    if (subscriberData) {
      const subscriber: Subscriber = JSON.parse(subscriberData);
      
      if (!subscriber.emailsSent) {
        subscriber.emailsSent = {};
      }
      
      subscriber.emailsSent[emailType as keyof Subscriber['emailsSent']] = new Date().toISOString();
      
      // Mark welcome series as completed if this was the last welcome email
      if (emailType === 'welcome3' && subscriber.preferences) {
        subscriber.preferences.welcomeSeriesCompleted = true;
      }
      
      await env.SUBSCRIBERS.put(email, JSON.stringify(subscriber));
    }
  } catch (error) {
    console.error(`Error updating subscriber ${email}:`, error);
  }
}

/**
 * Trigger welcome series for new subscriber
 */
async function triggerWelcomeSeries(env: Env, email: string): Promise<void> {
  // Queue welcome emails with delays
  await queueEmail(env, email, 'welcome1', 0); // Immediately
  await queueEmail(env, email, 'welcome2', 24); // 1 day later
  await queueEmail(env, email, 'welcome3', 72); // 3 days later
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Process email queue (can be called manually or by cron)
      if (url.pathname === '/process-queue' && request.method === 'POST') {
        const result = await processEmailQueue(env);
        return new Response(JSON.stringify(result), { headers: responseHeaders });
      }

      // Trigger welcome series for a specific email
      if (url.pathname === '/trigger-welcome' && request.method === 'POST') {
        const { email } = await request.json() as { email: string };
        if (!email) {
          return new Response(JSON.stringify({ error: 'Email required' }), {
            status: 400,
            headers: responseHeaders,
          });
        }

        await triggerWelcomeSeries(env, email);
        return new Response(JSON.stringify({ success: true }), { headers: responseHeaders });
      }

      return new Response('Not found', { status: 404, headers: responseHeaders });
    } catch (error) {
      console.error('Email automation error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: responseHeaders,
      });
    }
  },

  // Cron trigger for processing email queue
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Processing email queue via cron...');
    const result = await processEmailQueue(env);
    console.log(`Email queue processed: ${result.processed} sent, ${result.failed} failed`);
  },
};