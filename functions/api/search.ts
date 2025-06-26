interface SearchResult {
  title: string
  slug: string
  description: string
  content?: string
  url: string
  tags: string[]
  author: string
  pubDate: string
  relevance: number
}

interface SearchResponse {
  query: string
  results: SearchResult[]
  totalResults: number
  processingTime: number
  suggestions?: string[]
}

// Simple search scoring algorithm
function calculateRelevance(
  query: string,
  post: Record<string, unknown>
): number {
  const queryLower = query.toLowerCase()
  const title = String(post.title || '').toLowerCase()
  const description = String(post.description || '').toLowerCase()
  const content = String(post.content || '').toLowerCase()
  const tags = Array.isArray(post.tags) ? post.tags.join(' ').toLowerCase() : ''

  let score = 0

  // Title matches are heavily weighted
  if (title.includes(queryLower)) score += 10

  // Description matches
  if (description.includes(queryLower)) score += 5

  // Tag matches
  if (tags.includes(queryLower)) score += 8

  // Content matches (less weight due to potential noise)
  const contentMatches = (content.match(new RegExp(queryLower, 'g')) || [])
    .length
  score += Math.min(contentMatches * 0.5, 5)

  // Exact phrase bonus
  if (title.includes(queryLower) || description.includes(queryLower)) {
    score += 3
  }

  return Math.min(score / 20, 1) // Normalize to 0-1
}

// Mock blog posts data - in a real implementation, this would come from your CMS/database
const mockBlogPosts = [
  {
    title: 'The Hidden Costs of Technical Debt',
    slug: 'the-hidden-costs-of-technical-debt',
    description:
      "Technical debt isn't just messy code. It's a compound interest loan against your engineering velocity that most teams drastically underestimate.",
    content:
      'I\'ve watched engineering teams slow to a crawl, not because they hired bad developers or chose wrong technologies, but because they treated technical debt like a problem for "future us" to solve...',
    tags: ['technical-debt', 'engineering', 'velocity', 'management'],
    author: 'Jonathan Haas',
    pubDate: '2025-06-19',
  },
  {
    title: 'The New Series A Reality: Why It Feels Harder (Because It Is)',
    slug: 'new-series-a-reality',
    description:
      "If you're feeling like the startup funding landscape has shifted under your feet, you're not imagining it. Here's a breakdown of why raising a Series A today is tougher.",
    content:
      "If you're feeling like the ground is shifting under you when it comes to raising a Series A—you're right. It has shifted. And it's not shifting back anytime soon...",
    tags: [
      'startup-funding',
      'founder-advice',
      'venture-capital',
      'early-stage',
      'growth-strategy',
    ],
    author: 'Jonathan Haas',
    pubDate: '2025-05-12',
  },
  {
    title:
      'The Illusion of Traction: When Technical Founders Mistake Interest for Product-Market Fit',
    slug: 'technical-founder-pmf',
    description:
      "Examining why technical founders often confuse early signals with genuine product-market fit, and how to recognize when you're building something people truly need",
    content:
      "I've spent over a decade building products, working at startups, and watching technical founders (including myself) repeatedly fall into the same traps...",
    tags: ['entrepreneurship', 'product-development', 'startups'],
    author: 'Jonathan Haas',
    pubDate: '2025-04-08',
  },
  {
    title: "The Three Types of Startup Advice (And Why They're All Wrong)",
    slug: 'startup-advice',
    description:
      'Breaking down why most startup advice falls flat, and what to do about it',
    content:
      "The most dangerous thing about startup advice isn't that it's wrong—it's that it's partially right...",
    tags: [
      'leadership',
      'personal-growth',
      'product-development',
      'startups',
      'strategy',
    ],
    author: 'Jonathan Haas',
    pubDate: '2024-11-25',
  },
  {
    title: 'The Unit Economics That Actually Matter',
    slug: 'the-unit-economics-that-actually-matter',
    description:
      "Most SaaS founders track LTV/CAC wrong. Here's what really drives sustainable growth and the metrics that matter.",
    content:
      "I've watched hundreds of SaaS founders obsess over their LTV:CAC ratio, only to burn through runway because they're measuring the wrong things...",
    tags: ['saas', 'metrics', 'unit-economics', 'growth'],
    author: 'Jonathan Haas',
    pubDate: '2025-06-19',
  },
]

export async function onRequest(
  context: EventContext<Env, string, Record<string, unknown>>
): Promise<Response> {
  const { request } = context
  const baseUrl = 'https://haasonsaas.com'
  const startTime = Date.now()

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
    'Access-Control-Max-Age': '86400',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim()
  const format = url.searchParams.get('format') || 'json'
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
  const includeContent = url.searchParams.get('content') === 'true'

  if (!query) {
    return new Response(
      JSON.stringify({ error: 'Query parameter "q" is required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Search and rank results
  const results: SearchResult[] = mockBlogPosts
    .map((post) => ({
      ...post,
      relevance: calculateRelevance(query, post),
      url: `${baseUrl}/posts/${post.slug}`,
    }))
    .filter((post) => post.relevance > 0.1) // Only include relevant results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map((post) => ({
      title: post.title,
      slug: post.slug,
      description: post.description,
      ...(includeContent ? { content: post.content } : {}),
      url: post.url,
      tags: post.tags,
      author: post.author,
      pubDate: post.pubDate,
      relevance: Math.round(post.relevance * 100) / 100,
    }))

  const processingTime = Date.now() - startTime

  const response: SearchResponse = {
    query,
    results,
    totalResults: results.length,
    processingTime,
    ...(results.length === 0
      ? {
          suggestions: [
            'Try broader search terms',
            'Check spelling',
            'Search for: startup, technical debt, product market fit, unit economics',
          ],
        }
      : {}),
  }

  if (format === 'markdown') {
    const markdown = [
      `# Search Results for "${query}"`,
      `Found ${results.length} results (${processingTime}ms)`,
      '',
      ...results.map((result) =>
        [
          `## [${result.title}](${result.url})`,
          `**Relevance:** ${(result.relevance * 100).toFixed(0)}%`,
          `**Tags:** ${result.tags.join(', ')}`,
          `**Published:** ${result.pubDate}`,
          '',
          result.description,
          '',
          '---',
          '',
        ].join('\n')
      ),
    ].join('\n')

    return new Response(markdown, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/markdown',
        'X-Agent-Friendly': 'true',
      },
    })
  }

  return new Response(JSON.stringify(response, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Agent-Friendly': 'true',
    },
  })
}
