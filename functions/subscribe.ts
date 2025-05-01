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
        headers: corsHeaders,
      });
    }

    try {
      // Parse the request body
      const data = await request.json() as RequestBody;
      const { email } = data;

      if (!email) {
        return new Response('Email is required', { 
          status: 400,
          headers: corsHeaders,
        });
      }

      console.log('Processing new subscriber:', email);

      // Check if subscriber already exists
      const existingSubscriber = await env.SUBSCRIBERS.get(email);
      if (existingSubscriber) {
        return new Response(JSON.stringify({ error: 'Email already subscribed' }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
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
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },
}; 