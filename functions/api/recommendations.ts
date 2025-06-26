interface Recommendation {
  title: string
  slug: string
  description: string
  url: string
  tags: string[]
  priority: 'high' | 'medium' | 'low'
  reason: string
  relevanceScore: number
}

interface RecommendationsResponse {
  role?: string
  topic?: string
  experience?: string
  recommendations: Recommendation[]
  totalRecommendations: number
  reasoning: string
}

const blogPosts = [
  {
    title: 'The Hidden Costs of Technical Debt',
    slug: 'the-hidden-costs-of-technical-debt',
    description:
      "Technical debt isn't just messy code. It's a compound interest loan against your engineering velocity that most teams drastically underestimate.",
    tags: ['technical-debt', 'engineering', 'velocity', 'management'],
    topics: ['technical-leadership', 'engineering'],
    roles: ['engineer', 'founder', 'cto'],
    experience: ['intermediate', 'advanced'],
  },
  {
    title: 'The New Series A Reality: Why It Feels Harder (Because It Is)',
    slug: 'new-series-a-reality',
    description:
      "If you're feeling like the startup funding landscape has shifted under your feet, you're not imagining it.",
    tags: [
      'startup-funding',
      'founder-advice',
      'venture-capital',
      'early-stage',
      'growth-strategy',
    ],
    topics: ['startup-funding', 'growth-strategy'],
    roles: ['founder', 'ceo'],
    experience: ['intermediate', 'advanced'],
  },
  {
    title:
      'The Illusion of Traction: When Technical Founders Mistake Interest for Product-Market Fit',
    slug: 'technical-founder-pmf',
    description:
      'Examining why technical founders often confuse early signals with genuine product-market fit.',
    tags: ['entrepreneurship', 'product-development', 'startups'],
    topics: ['product-development', 'startup-validation'],
    roles: ['founder', 'product-manager'],
    experience: ['beginner', 'intermediate'],
  },
  {
    title: "The Three Types of Startup Advice (And Why They're All Wrong)",
    slug: 'startup-advice',
    description:
      'Breaking down why most startup advice falls flat, and what to do about it',
    tags: [
      'leadership',
      'personal-growth',
      'product-development',
      'startups',
      'strategy',
    ],
    topics: ['leadership', 'startup-strategy'],
    roles: ['founder', 'ceo', 'manager'],
    experience: ['intermediate', 'advanced'],
  },
  {
    title: 'The Unit Economics That Actually Matter',
    slug: 'the-unit-economics-that-actually-matter',
    description:
      "Most SaaS founders track LTV/CAC wrong. Here's what really drives sustainable growth.",
    tags: ['saas', 'metrics', 'unit-economics', 'growth'],
    topics: ['unit-economics', 'saas-metrics'],
    roles: ['founder', 'product-manager', 'growth'],
    experience: ['intermediate', 'advanced'],
  },
  {
    title:
      'The Founder Pay Gap: Why VCs Undercompensate the CEOs Who Built the Company',
    slug: 'founder-pay-gap',
    description:
      'After year four, founder CEOs are paid like caretakers—while hired CEOs are paid like kings.',
    tags: ['startup', 'founder', 'culture', 'transparency'],
    topics: ['founder-compensation', 'startup-culture'],
    roles: ['founder', 'ceo'],
    experience: ['advanced'],
  },
]

function calculateRecommendationScore(
  post: (typeof blogPosts)[0],
  role?: string,
  topic?: string,
  experience?: string
): { score: number; reason: string; priority: 'high' | 'medium' | 'low' } {
  let score = 0
  const reasons: string[] = []

  // Role matching
  if (role && post.roles.includes(role)) {
    score += 5
    reasons.push(`highly relevant for ${role}s`)
  }

  // Topic matching
  if (
    topic &&
    post.topics.some((t) => t.includes(topic) || topic.includes(t))
  ) {
    score += 4
    reasons.push(`covers ${topic} in depth`)
  }

  // Experience level matching
  if (experience && post.experience.includes(experience)) {
    score += 2
    reasons.push(`appropriate for ${experience} level`)
  }

  // Fallback scoring for general relevance
  if (!role && !topic && !experience) {
    score += 3
    reasons.push('essential reading for startup professionals')
  }

  // Determine priority based on score
  let priority: 'high' | 'medium' | 'low' = 'low'
  if (score >= 7) priority = 'high'
  else if (score >= 4) priority = 'medium'

  return {
    score,
    reason: reasons.join(', ') || 'covers important startup concepts',
    priority,
  }
}

export async function onRequest(
  context: EventContext<Env, string, Record<string, unknown>>
): Promise<Response> {
  const { request } = context
  const baseUrl = 'https://haasonsaas.com'

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
  const role = url.searchParams.get('role')
  const topic = url.searchParams.get('topic')
  const experience = url.searchParams.get('experience')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '5'), 10)

  // Calculate recommendations
  const scoredPosts = blogPosts.map((post) => {
    const { score, reason, priority } = calculateRecommendationScore(
      post,
      role || undefined,
      topic || undefined,
      experience || undefined
    )
    return {
      ...post,
      score,
      reason,
      priority,
      url: `${baseUrl}/posts/${post.slug}`,
    }
  })

  // Sort by score and take top recommendations
  const recommendations: Recommendation[] = scoredPosts
    .filter((post) => post.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((post) => ({
      title: post.title,
      slug: post.slug,
      description: post.description,
      url: post.url,
      tags: post.tags,
      priority: post.priority,
      reason: post.reason,
      relevanceScore: Math.round((post.score / 10) * 100) / 100,
    }))

  // Generate reasoning explanation
  let reasoning = 'Recommendations based on '
  const criteria = []
  if (role) criteria.push(`role: ${role}`)
  if (topic) criteria.push(`topic: ${topic}`)
  if (experience) criteria.push(`experience: ${experience}`)

  if (criteria.length === 0) {
    reasoning =
      'General recommendations for startup professionals covering essential topics across product development, technical leadership, and business strategy.'
  } else {
    reasoning +=
      criteria.join(', ') +
      '. Posts are ranked by relevance to your specific context and needs.'
  }

  const response: RecommendationsResponse = {
    ...(role ? { role } : {}),
    ...(topic ? { topic } : {}),
    ...(experience ? { experience } : {}),
    recommendations,
    totalRecommendations: recommendations.length,
    reasoning,
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
