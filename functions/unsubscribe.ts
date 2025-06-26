import type {
  PagesFunction,
  ExecutionContext,
  KVNamespace,
} from '@cloudflare/workers-types'

interface Env {
  SUBSCRIBERS: KVNamespace
}

interface Subscriber {
  email: string
  subscribedAt: string
  preferences?: {
    welcomeSeriesCompleted?: boolean
    unsubscribed?: boolean
    tags?: string[]
  }
  emailsSent?: Record<string, string>
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

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      if (request.method === 'POST') {
        // Handle unsubscribe request
        const { email } = (await request.json()) as { email: string }

        if (!email) {
          return new Response(JSON.stringify({ error: 'Email is required' }), {
            status: 400,
            headers: responseHeaders,
          })
        }

        // Get subscriber data
        const subscriberData = await env.SUBSCRIBERS.get(email)
        if (!subscriberData) {
          return new Response(JSON.stringify({ error: 'Email not found' }), {
            status: 404,
            headers: responseHeaders,
          })
        }

        // Update subscriber preferences to mark as unsubscribed
        const subscriber: Subscriber = JSON.parse(subscriberData)
        if (!subscriber.preferences) {
          subscriber.preferences = {}
        }
        subscriber.preferences.unsubscribed = true

        // Store updated subscriber data
        await env.SUBSCRIBERS.put(email, JSON.stringify(subscriber))

        return new Response(JSON.stringify({ success: true }), {
          headers: responseHeaders,
        })
      }

      if (request.method === 'GET') {
        // Handle unsubscribe confirmation page
        const email = url.searchParams.get('email')

        if (!email) {
          return new Response(
            getUnsubscribePageHTML(null, 'Email parameter is required'),
            {
              headers: {
                ...corsHeaders,
                ...securityHeaders,
                'Content-Type': 'text/html',
              },
            }
          )
        }

        // Check if email exists in subscribers
        const subscriberData = await env.SUBSCRIBERS.get(email)
        const isSubscribed = subscriberData
          ? !JSON.parse(subscriberData).preferences?.unsubscribed
          : false

        return new Response(getUnsubscribePageHTML(email, null, isSubscribed), {
          headers: {
            ...corsHeaders,
            ...securityHeaders,
            'Content-Type': 'text/html',
          },
        })
      }

      return new Response('Method not allowed', {
        status: 405,
        headers: responseHeaders,
      })
    } catch (error) {
      console.error('Unsubscribe error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: responseHeaders,
      })
    }
  },
}

function getUnsubscribePageHTML(
  email: string | null,
  error: string | null,
  isSubscribed: boolean = false
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe - Haas on SaaS</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f9fafb;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        h1 {
            color: #1f2937;
            text-align: center;
            margin-bottom: 30px;
        }
        .email-display {
            background: #f3f4f6;
            padding: 12px 16px;
            border-radius: 6px;
            font-family: monospace;
            margin: 20px 0;
            word-break: break-all;
        }
        .button {
            background: #dc2626;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            margin: 20px 0;
        }
        .button:hover {
            background: #b91c1c;
        }
        .button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }
        .success {
            background: #d1fae5;
            color: #065f46;
            padding: 16px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
        }
        .error {
            background: #fee2e2;
            color: #991b1b;
            padding: 16px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .back-link {
            text-align: center;
            margin-top: 30px;
        }
        .back-link a {
            color: #2563eb;
            text-decoration: none;
        }
        .already-unsubscribed {
            background: #fef3c7;
            color: #92400e;
            padding: 16px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Unsubscribe from Haas on SaaS</h1>
        
        ${error ? `<div class="error">${error}</div>` : ''}
        
        ${
          email
            ? `
            <p>We're sorry to see you go! If you're sure you want to unsubscribe from Haas on SaaS emails, please confirm below:</p>
            
            <div class="email-display">${email}</div>
            
            ${
              !isSubscribed
                ? `
                <div class="already-unsubscribed">
                    This email address is already unsubscribed or was never subscribed.
                </div>
            `
                : `
                <button class="button" onclick="unsubscribe()" id="unsubscribeBtn">
                    Unsubscribe from all emails
                </button>
                
                <div id="result"></div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                    <strong>Feedback:</strong> If you have a moment, I'd love to know why you're unsubscribing. 
                    Feel free to reply to any of my emails with your thoughts — I read everything.
                </p>
            `
            }
        `
            : `
            <p>To unsubscribe, please use the unsubscribe link from one of our emails, or contact us directly.</p>
        `
        }
        
        <div class="back-link">
            <a href="https://haasonsaas.com">← Back to Haas on SaaS</a>
        </div>
    </div>

    <script>
        async function unsubscribe() {
            const button = document.getElementById('unsubscribeBtn');
            const result = document.getElementById('result');
            
            button.disabled = true;
            button.textContent = 'Unsubscribing...';
            
            try {
                const response = await fetch('/unsubscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: '${email}' }),
                });
                
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = '<div class="success">You have been successfully unsubscribed. You will no longer receive emails from Haas on SaaS.</div>';
                    button.style.display = 'none';
                } else {
                    result.innerHTML = '<div class="error">Error: ' + (data.error || 'Failed to unsubscribe') + '</div>';
                    button.disabled = false;
                    button.textContent = 'Unsubscribe from all emails';
                }
            } catch (error) {
                result.innerHTML = '<div class="error">Error: Failed to unsubscribe. Please try again.</div>';
                button.disabled = false;
                button.textContent = 'Unsubscribe from all emails';
            }
        }
    </script>
</body>
</html>`
}
