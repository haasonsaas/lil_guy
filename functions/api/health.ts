interface Env {
  // Environment variables can be added here if needed
  [key: string]: unknown;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'operational' | 'degraded' | 'down';
    search: 'operational' | 'degraded' | 'down';
    analytics: 'operational' | 'degraded' | 'down';
    cdn: 'operational' | 'degraded' | 'down';
  };
  performance: {
    responseTimeMs: number;
    memoryUsage?: string;
  };
  endpoints: {
    name: string;
    url: string;
    status: 'operational' | 'degraded' | 'down';
  }[];
  message: string;
}

const startTime = Date.now();

async function checkEndpointHealth(baseUrl: string, endpoint: string): Promise<'operational' | 'degraded' | 'down'> {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      return response.status < 300 ? 'operational' : 'degraded';
    }
    return 'degraded';
  } catch (error) {
    return 'down';
  }
}

async function performHealthCheck(baseUrl: string): Promise<HealthCheckResponse> {
  const checkStart = Date.now();
  
  // Check critical endpoints
  const endpointChecks = await Promise.allSettled([
    checkEndpointHealth(baseUrl, '/api/search?q=test'),
    checkEndpointHealth(baseUrl, '/api/capabilities'),
    checkEndpointHealth(baseUrl, '/api/recommendations?role=founder'),
    checkEndpointHealth(baseUrl, '/api/analytics?days=1')
  ]);

  const endpoints = [
    {
      name: 'Search API',
      url: `${baseUrl}/api/search`,
      status: endpointChecks[0].status === 'fulfilled' ? endpointChecks[0].value : 'down'
    },
    {
      name: 'Capabilities API', 
      url: `${baseUrl}/api/capabilities`,
      status: endpointChecks[1].status === 'fulfilled' ? endpointChecks[1].value : 'down'
    },
    {
      name: 'Recommendations API',
      url: `${baseUrl}/api/recommendations`, 
      status: endpointChecks[2].status === 'fulfilled' ? endpointChecks[2].value : 'down'
    },
    {
      name: 'Analytics API',
      url: `${baseUrl}/api/analytics`,
      status: endpointChecks[3].status === 'fulfilled' ? endpointChecks[3].value : 'down'
    }
  ] as const;

  // Calculate overall service health
  const operationalCount = endpoints.filter(e => e.status === 'operational').length;
  const totalCount = endpoints.length;
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (operationalCount === totalCount) {
    overallStatus = 'healthy';
  } else if (operationalCount >= totalCount * 0.5) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'unhealthy';
  }

  const responseTime = Date.now() - checkStart;
  const uptime = Date.now() - startTime;

  let message: string;
  if (overallStatus === 'healthy') {
    message = 'All systems operational. AI agents can access all endpoints normally.';
  } else if (overallStatus === 'degraded') {
    message = 'Some services experiencing issues. Core functionality may be limited.';
  } else {
    message = 'Multiple systems down. Service may be unavailable for AI agents.';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime,
    services: {
      database: 'operational', // File-based, always operational
      search: endpoints.find(e => e.name === 'Search API')?.status || 'down',
      analytics: endpoints.find(e => e.name === 'Analytics API')?.status || 'down',
      cdn: 'operational' // Cloudflare CDN
    },
    performance: {
      responseTimeMs: responseTime,
      memoryUsage: 'N/A (serverless)'
    },
    endpoints,
    message
  };
}

export async function onRequest(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const { request } = context;
  const startTime = Date.now();

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
    'Access-Control-Max-Age': '86400',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({
      success: false,
      message: 'Method not allowed. Use GET to check health status.'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    const healthCheck = await performHealthCheck(baseUrl);
    
    // Determine HTTP status based on health
    let httpStatus: number;
    switch (healthCheck.status) {
      case 'healthy':
        httpStatus = 200;
        break;
      case 'degraded':
        httpStatus = 200; // Still return 200 but with degraded status
        break;
      case 'unhealthy':
        httpStatus = 503; // Service Unavailable
        break;
    }

    return new Response(JSON.stringify(healthCheck, null, 2), {
      status: httpStatus,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Agent-Friendly': 'true',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });

  } catch (error) {
    const errorResponse = {
      status: 'unhealthy' as const,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: 0,
      services: {
        database: 'down' as const,
        search: 'down' as const,
        analytics: 'down' as const,
        cdn: 'down' as const
      },
      performance: {
        responseTimeMs: Date.now() - startTime
      },
      endpoints: [],
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };

    return new Response(JSON.stringify(errorResponse, null, 2), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}