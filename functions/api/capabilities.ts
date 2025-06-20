interface Capability {
  name: string;
  description: string;
  endpoint: string;
  method: string;
  parameters?: Record<string, {
    type: string;
    description: string;
    required: boolean;
    examples?: string[];
  }>;
  examples?: Array<{
    description: string;
    request: string;
    response: Record<string, unknown>;
  }>;
}

interface CapabilitiesResponse {
  site: {
    name: string;
    description: string;
    baseUrl: string;
    lastUpdated: string;
  };
  capabilities: Capability[];
  usage: {
    rateLimit: string;
    authentication: string;
    supportedFormats: string[];
  };
  examples: {
    quickStart: string;
    commonPatterns: string[];
  };
}

export async function onRequest(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const { request } = context;
  const baseUrl = 'https://haasonsaas.com';

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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const capabilities: Capability[] = [
    {
      name: 'Blog Content Access',
      description: 'Search and retrieve blog posts about startups, technical leadership, and product development',
      endpoint: `${baseUrl}/api/search`,
      method: 'GET',
      parameters: {
        q: {
          type: 'string',
          description: 'Search query - supports full-text search across titles, descriptions, and content',
          required: true,
          examples: ['technical debt', 'product market fit', 'startup funding']
        },
        format: {
          type: 'string',
          description: 'Response format - json (default) or markdown',
          required: false,
          examples: ['json', 'markdown']
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10, max: 50)',
          required: false,
          examples: ['5', '20']
        }
      },
      examples: [
        {
          description: 'Search for posts about technical debt',
          request: `${baseUrl}/api/search?q=technical+debt&limit=3`,
          response: {
            query: 'technical debt',
            results: [
              {
                title: 'The Hidden Costs of Technical Debt',
                slug: 'the-hidden-costs-of-technical-debt',
                description: 'Technical debt isn\'t just messy code...',
                url: `${baseUrl}/posts/the-hidden-costs-of-technical-debt`,
                tags: ['technical-debt', 'engineering', 'velocity'],
                relevance: 0.95
              }
            ],
            totalResults: 1
          }
        }
      ]
    },
    {
      name: 'Interactive Calculators',
      description: 'Access to startup and business calculators for unit economics, growth modeling, and strategic planning',
      endpoint: `${baseUrl}/calculators`,
      method: 'GET',
      examples: [
        {
          description: 'List available interactive tools',
          request: `${baseUrl}/calculators`,
          response: {
            calculators: [
              {
                name: 'SaaS Metrics Dashboard',
                description: 'Calculate LTV, CAC, churn, and other key SaaS metrics',
                url: `${baseUrl}/posts/the-unit-economics-that-actually-matter#saas-metrics-dashboard`
              },
              {
                name: 'Startup Runway Calculator',
                description: 'Model cash runway with growth scenarios and burn rates',
                url: `${baseUrl}/posts/new-series-a-reality#startup-runway-calculator`
              }
            ]
          }
        }
      ]
    },
    {
      name: 'Content Recommendations',
      description: 'Get personalized content recommendations based on topics or user interests',
      endpoint: `${baseUrl}/api/recommendations`,
      method: 'GET',
      parameters: {
        topic: {
          type: 'string',
          description: 'Topic area for recommendations',
          required: false,
          examples: ['startup-funding', 'technical-leadership', 'product-development']
        },
        role: {
          type: 'string',
          description: 'User role to tailor recommendations',
          required: false,
          examples: ['founder', 'engineer', 'product-manager', 'investor']
        },
        experience: {
          type: 'string',
          description: 'Experience level',
          required: false,
          examples: ['beginner', 'intermediate', 'advanced']
        }
      },
      examples: [
        {
          description: 'Get recommendations for technical founders',
          request: `${baseUrl}/api/recommendations?role=founder&topic=technical-leadership`,
          response: {
            recommendations: [
              {
                title: 'The Illusion of Traction: When Technical Founders Mistake Interest for Product-Market Fit',
                reason: 'Highly relevant for technical founders building products',
                priority: 'high'
              }
            ]
          }
        }
      ]
    },
    {
      name: 'Usage Analytics',
      description: 'Track API usage and get insights into agent activity (optional)',
      endpoint: `${baseUrl}/api/analytics`,
      method: 'GET, POST',
      parameters: {
        event: {
          type: 'string',
          description: 'Event type to track (for POST requests)',
          required: false,
          examples: ['api_access', 'search_query', 'content_retrieval']
        },
        endpoint: {
          type: 'string',
          description: 'Endpoint being accessed',
          required: false,
          examples: ['/api/search', '/api/recommendations']
        }
      },
      examples: [
        {
          description: 'Get usage statistics',
          request: `${baseUrl}/api/analytics`,
          response: {
            success: true,
            stats: {
              totalEvents: 1247,
              topEndpoints: [{ endpoint: '/api/search', count: 523 }],
              topAgents: [{ agent: 'Claude', count: 342 }]
            }
          }
        }
      ]
    },
    {
      name: 'Feedback System',
      description: 'Submit feedback, bug reports, and feature suggestions',
      endpoint: `${baseUrl}/api/feedback`,
      method: 'GET, POST',
      parameters: {
        type: {
          type: 'string',
          description: 'Type of feedback',
          required: true,
          examples: ['bug', 'suggestion', 'compliment', 'question']
        },
        category: {
          type: 'string',
          description: 'Feedback category',
          required: true,
          examples: ['api', 'documentation', 'performance', 'features']
        },
        message: {
          type: 'string',
          description: 'Detailed feedback message (10-2000 characters)',
          required: true,
          examples: ['The search API could use date filtering']
        }
      },
      examples: [
        {
          description: 'Submit feature suggestion',
          request: `POST ${baseUrl}/api/feedback`,
          response: {
            success: true,
            message: 'Feedback submitted successfully',
            feedbackId: 'fb_1234567890_abc123',
            suggestions: ['Include specific use cases', 'Consider backward compatibility']
          }
        }
      ]
    }
  ];

  const response: CapabilitiesResponse = {
    site: {
      name: 'Haas on SaaS',
      description: 'Startup advice, technical leadership insights, and interactive business tools',
      baseUrl,
      lastUpdated: new Date().toISOString()
    },
    capabilities,
    usage: {
      rateLimit: '1000 requests per hour per IP',
      authentication: 'None required for read operations',
      supportedFormats: ['application/json', 'text/markdown']
    },
    examples: {
      quickStart: `curl "${baseUrl}/api/search?q=product+market+fit&limit=5"`,
      commonPatterns: [
        'Search for relevant content by topic',
        'Get recommendations based on user role',
        'Access interactive calculators and tools',
        'Navigate site structure programmatically'
      ]
    }
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'X-Agent-Friendly': 'true'
    }
  });
}