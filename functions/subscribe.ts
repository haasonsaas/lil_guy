import type { PagesFunction, ExecutionContext, KVNamespace } from '@cloudflare/workers-types';

interface Env {
  // Add your environment variables here
  RESEND_API_KEY: string;
  SUBSCRIBERS: KVNamespace;
  RATE_LIMIT: KVNamespace;
}

interface RequestBody {
  email: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 60; // 1 hour in seconds
const MAX_REQUESTS_PER_WINDOW = 5; // Maximum 5 requests per hour

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.haasonsaas.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

async function checkRateLimit(env: Env, ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  
  try {
    // Get the current rate limit data
    const data = await env.RATE_LIMIT.get(key);
    let count = 0;
    let windowStart = now;
    
    if (data) {
      try {
        const { count: storedCount, windowStart: storedWindowStart } = JSON.parse(data);
        // If we're still in the same window, use the stored count
        if (now - storedWindowStart < RATE_LIMIT_WINDOW) {
          count = storedCount;
          windowStart = storedWindowStart;
        }
      } catch (e) {
        console.error('Error parsing rate limit data:', e);
        // If there's an error parsing, start fresh
        count = 0;
        windowStart = now;
      }
    }
    
    // Increment the count
    count++;
    
    // Store the updated count
    await env.RATE_LIMIT.put(key, JSON.stringify({
      count,
      windowStart,
    }), {
      expirationTtl: RATE_LIMIT_WINDOW,
    });
    
    console.log(`Rate limit check for IP ${ip}: count=${count}, windowStart=${windowStart}, allowed=${count <= MAX_REQUESTS_PER_WINDOW}`);
    
    return {
      allowed: count <= MAX_REQUESTS_PER_WINDOW,
      remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - count),
    };
  } catch (error) {
    console.error('Error in rate limit check:', error);
    // If there's an error with rate limiting, allow the request
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: responseHeaders,
      });
    }

    try {
      // Get client IP for rate limiting
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      console.log(`Request from IP: ${ip}`);
      
      // Check rate limit
      const rateLimit = await checkRateLimit(env, ip);
      if (!rateLimit.allowed) {
        console.log(`Rate limit exceeded for IP ${ip}`);
        return new Response(JSON.stringify({ 
          error: 'Too many subscription attempts. Please try again later.',
          retryAfter: RATE_LIMIT_WINDOW,
        }), {
          status: 429,
          headers: {
            ...responseHeaders,
            'Retry-After': RATE_LIMIT_WINDOW.toString(),
          },
        });
      }

      // Parse the request body
      const data = await request.json() as RequestBody;
      const { email } = data;

      if (!email) {
        return new Response('Email is required', { 
          status: 400,
          headers: responseHeaders,
        });
      }

      console.log('Processing new subscriber:', email);

      // Check if subscriber already exists
      const existingSubscriber = await env.SUBSCRIBERS.get(email);
      if (existingSubscriber) {
        return new Response(JSON.stringify({ error: 'Email already subscribed' }), {
          status: 400,
          headers: responseHeaders,
        });
      }

      // Store subscriber in KV with preferences structure
      const subscriberData = {
        email,
        subscribedAt: new Date().toISOString(),
        preferences: {
          welcomeSeriesCompleted: false,
          unsubscribed: false,
          tags: []
        },
        emailsSent: {}
      };

      await env.SUBSCRIBERS.put(email, JSON.stringify(subscriberData));
      console.log('Subscriber stored in KV:', email);

      // Send email using Resend
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@haasonsaas.com',
          to: 'jonathan@haas.holdings',
          subject: 'New Subscriber Alert',
          text: `New subscriber: ${email}`,
        }),
      });

      const resendData = await resendResponse.json();

      if (!resendResponse.ok) {
        console.error('Resend API error:', resendData);
        throw new Error(`Failed to send email: ${JSON.stringify(resendData)}`);
      }

      console.log('Email sent successfully:', resendData);

      // Trigger welcome series automation
      try {
        const automationResponse = await fetch('https://haas-blog.haasholdings.workers.dev/email-automation/trigger-welcome', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (!automationResponse.ok) {
          console.error('Failed to trigger welcome series:', await automationResponse.text());
        } else {
          console.log('Welcome series triggered for:', email);
        }
      } catch (error) {
        console.error('Error triggering welcome series:', error);
        // Don't fail the subscription if automation fails
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: responseHeaders,
      });
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
        status: 500,
        headers: responseHeaders,
      });
    }
  },
}; 