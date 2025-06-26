import type {
  PagesFunction,
  ExecutionContext,
  KVNamespace,
} from '@cloudflare/workers-types'

interface Env {
  RESEND_API_KEY: string
  // Note: EMAIL_SCHEDULE KV will be created automatically when accessed
  EMAIL_SCHEDULE?: KVNamespace
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.haasonsaas.com',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (request.method === 'POST') {
      try {
        // Test Resend API
        const testResponse = await fetch('https://api.resend.com/audiences', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        let audienceStatus = 'Unknown'
        let audienceId = null

        if (testResponse.ok) {
          const audiences = await testResponse.json()
          const existingAudience = audiences.data?.find(
            (aud: { name: string; id: string }) =>
              aud.name === 'Haas on SaaS Subscribers'
          )

          if (existingAudience) {
            audienceStatus = 'Exists'
            audienceId = existingAudience.id
          } else {
            // Create audience
            const createResponse = await fetch(
              'https://api.resend.com/audiences',
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${env.RESEND_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: 'Haas on SaaS Subscribers',
                }),
              }
            )

            if (createResponse.ok) {
              const newAudience = await createResponse.json()
              audienceStatus = 'Created'
              audienceId = newAudience.id
            } else {
              audienceStatus = 'Failed to create'
            }
          }
        } else {
          audienceStatus = 'API Error'
        }

        // Test KV access (will auto-create if it doesn't exist)
        let kvStatus = 'Not Available'
        if (env.EMAIL_SCHEDULE) {
          try {
            await env.EMAIL_SCHEDULE.put('test', 'test', { expirationTtl: 60 })
            await env.EMAIL_SCHEDULE.delete('test')
            kvStatus = 'Working'
          } catch (error) {
            kvStatus = 'Error: ' + error
          }
        }

        const setupStatus = {
          resend_api: testResponse.ok ? 'Connected' : 'Failed',
          audience_status: audienceStatus,
          audience_id: audienceId,
          kv_status: kvStatus,
          automation_ready:
            testResponse.ok && audienceId && env.EMAIL_SCHEDULE ? true : false,
          timestamp: new Date().toISOString(),
        }

        return new Response(JSON.stringify(setupStatus, null, 2), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Setup failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        )
      }
    }

    // GET request returns setup instructions
    return new Response(
      `
<!DOCTYPE html>
<html>
<head>
    <title>Email Automation Setup</title>
    <style>
        body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; }
        .status { padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success { background: #d1fae5; border: 1px solid #34d399; }
        .error { background: #fee2e2; border: 1px solid #f87171; }
        .warning { background: #fef3c7; border: 1px solid #fbbf24; }
        button { background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; }
        pre { background: #f3f4f6; padding: 16px; border-radius: 6px; overflow-x: auto; }
        .loading { display: none; }
    </style>
</head>
<body>
    <h1>Email Automation Setup</h1>
    
    <div class="status warning">
        <strong>Manual Setup Required:</strong><br>
        You need to create an EMAIL_SCHEDULE KV namespace in Cloudflare and bind it to your Pages project.
    </div>
    
    <h2>Automatic Setup Check</h2>
    <button onclick="checkSetup()">Check/Setup Automation</button>
    
    <div class="loading" id="loading">Checking setup...</div>
    <div id="results"></div>
    
    <h2>Quick Setup Steps</h2>
    <ol>
        <li><strong>Create KV Namespace:</strong> Go to Cloudflare Dashboard → Workers & Pages → KV → Create namespace "EMAIL_SCHEDULE"</li>
        <li><strong>Bind to Pages:</strong> Pages → Your Project → Settings → Functions → Add KV binding: EMAIL_SCHEDULE</li>
        <li><strong>Test:</strong> Click "Check/Setup Automation" above</li>
    </ol>
    
    <h2>Test Welcome Series</h2>
    <div>
        <input type="email" id="testEmail" placeholder="Enter email to test" style="padding: 8px; margin-right: 10px;">
        <button onclick="testWelcome()">Send Test Welcome Series</button>
    </div>
    <div id="testResults"></div>

    <script>
        async function checkSetup() {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('results').innerHTML = '';
            
            try {
                const response = await fetch('/setup-automation', { method: 'POST' });
                const result = await response.json();
                
                const resultsDiv = document.getElementById('results');
                const statusClass = result.automation_ready ? 'success' : 'error';
                
                resultsDiv.innerHTML = '<div class="status ' + statusClass + '"><pre>' + JSON.stringify(result, null, 2) + '</pre></div>';
            } catch (error) {
                document.getElementById('results').innerHTML = '<div class="status error">Error: ' + error.message + '</div>';
            } finally {
                document.getElementById('loading').style.display = 'none';
            }
        }
        
        async function testWelcome() {
            const email = document.getElementById('testEmail').value;
            if (!email) {
                alert('Please enter an email address');
                return;
            }
            
            try {
                const response = await fetch('/resend-automation/trigger-welcome', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                const result = await response.json();
                const resultsDiv = document.getElementById('testResults');
                const statusClass = result.success ? 'success' : 'error';
                
                resultsDiv.innerHTML = '<div class="status ' + statusClass + '">' + 
                    (result.success ? 'Welcome series triggered!' : 'Error: ' + result.error) + '</div>';
            } catch (error) {
                document.getElementById('testResults').innerHTML = '<div class="status error">Error: ' + error.message + '</div>';
            }
        }
    </script>
</body>
</html>`,
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
        },
      }
    )
  },
}
