interface AnalyticsEvent {
  event: string;
  agent?: string;
  endpoint?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface AnalyticsResponse {
  success: boolean;
  message: string;
  stats?: {
    totalEvents: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    topAgents: Array<{ agent: string; count: number }>;
    timeRange: string;
  };
}

// Simple in-memory analytics (in production, you'd use KV or a database)
let analyticsData: AnalyticsEvent[] = [];

const MAX_EVENTS = 1000; // Keep last 1000 events
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 analytics events per minute per IP

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const current = rateLimitMap.get(ip);
  
  if (!current || now - current.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  
  if (current.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  current.count++;
  return false;
}

function getClientIP(request: Request): string {
  // Try to get real IP from Cloudflare headers
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) return cfConnectingIP;
  
  // Fallback to other headers
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  
  const xRealIP = request.headers.get('X-Real-IP');
  if (xRealIP) return xRealIP;
  
  return 'unknown';
}

function detectAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  // AI/ML frameworks and tools
  if (ua.includes('openai')) return 'OpenAI';
  if (ua.includes('anthropic') || ua.includes('claude')) return 'Claude';
  if (ua.includes('python-requests')) return 'Python Requests';
  if (ua.includes('langchain')) return 'LangChain';
  if (ua.includes('llama')) return 'LLaMA';
  if (ua.includes('chatgpt')) return 'ChatGPT';
  
  // Development tools
  if (ua.includes('curl')) return 'cURL';
  if (ua.includes('wget')) return 'wget';
  if (ua.includes('postman')) return 'Postman';
  if (ua.includes('insomnia')) return 'Insomnia';
  
  // Programming languages
  if (ua.includes('python')) return 'Python';
  if (ua.includes('node')) return 'Node.js';
  if (ua.includes('go-http')) return 'Go';
  if (ua.includes('java')) return 'Java';
  
  // Default to browser name for human users
  if (ua.includes('chrome')) return 'Chrome Browser';
  if (ua.includes('firefox')) return 'Firefox Browser';
  if (ua.includes('safari')) return 'Safari Browser';
  
  return 'Unknown';
}

function addEvent(event: AnalyticsEvent) {
  analyticsData.push(event);
  
  // Keep only the last MAX_EVENTS
  if (analyticsData.length > MAX_EVENTS) {
    analyticsData = analyticsData.slice(-MAX_EVENTS);
  }
}

function getStats(): AnalyticsResponse['stats'] {
  if (analyticsData.length === 0) {
    return {
      totalEvents: 0,
      topEndpoints: [],
      topAgents: [],
      timeRange: 'No data'
    };
  }

  // Count endpoints
  const endpointCounts = new Map<string, number>();
  const agentCounts = new Map<string, number>();
  
  for (const event of analyticsData) {
    if (event.endpoint) {
      endpointCounts.set(event.endpoint, (endpointCounts.get(event.endpoint) || 0) + 1);
    }
    if (event.agent) {
      agentCounts.set(event.agent, (agentCounts.get(event.agent) || 0) + 1);
    }
  }

  const topEndpoints = Array.from(endpointCounts.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topAgents = Array.from(agentCounts.entries())
    .map(([agent, count]) => ({ agent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const oldestEvent = analyticsData[0];
  const newestEvent = analyticsData[analyticsData.length - 1];
  
  return {
    totalEvents: analyticsData.length,
    topEndpoints,
    topAgents,
    timeRange: `${oldestEvent.timestamp} to ${newestEvent.timestamp}`
  };
}

export async function onRequest(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const { request } = context;
  const clientIP = getClientIP(request);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
    'Access-Control-Max-Age': '86400',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting
  if (isRateLimited(clientIP)) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Rate limit exceeded. Please wait before sending more analytics events.' 
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'GET') {
    // Return analytics stats
    const stats = getStats();
    const response: AnalyticsResponse = {
      success: true,
      message: 'Analytics data retrieved successfully',
      stats
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Agent-Friendly': 'true'
      }
    });
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const userAgent = request.headers.get('User-Agent') || 'Unknown';
      const detectedAgent = detectAgent(userAgent);

      const event: AnalyticsEvent = {
        event: body.event || 'api_access',
        agent: body.agent || detectedAgent,
        endpoint: body.endpoint,
        userAgent,
        timestamp: new Date().toISOString(),
        metadata: body.metadata || {}
      };

      addEvent(event);

      const response: AnalyticsResponse = {
        success: true,
        message: 'Analytics event recorded successfully'
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Agent-Friendly': 'true'
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ 
    success: false, 
    message: 'Method not allowed' 
  }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}