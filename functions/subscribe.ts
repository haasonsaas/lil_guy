import type { PagesFunction, ExecutionContext, KVNamespace } from '@cloudflare/workers-types';

interface Env {
  // Add your environment variables here
  RESEND_API_KEY: string;
  SUBSCRIBERS: KVNamespace;
}

interface RequestBody {
  email: string;
}

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

      // Store subscriber in KV
      await env.SUBSCRIBERS.put(email, JSON.stringify({
        email,
        subscribedAt: new Date().toISOString(),
      }));

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