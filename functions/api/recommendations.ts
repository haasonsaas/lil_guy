import type { PagesFunction } from '@cloudflare/workers-types'
import { getAllBlogPosts, BlogPost } from '../utils/blogData'

interface Recommendation extends BlogPost {
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

function calculateRecommendationScore(
  post: BlogPost,
  role?: string,
  topic?: string,
  experience?: string
): { score: number; reason: string; priority: 'high' | 'medium' | 'low' } {
  let score = 0
  const reasons: string[] = []

  // Role matching
  if (role && post.tags.includes(role)) {
    // Assuming roles are part of tags for now
    score += 5
    reasons.push(`highly relevant for ${role}s`)
  }

  // Topic matching (assuming topics are part of tags for now)
  if (topic && post.tags.some((t) => t.includes(topic) || topic.includes(t))) {
    score += 4
    reasons.push(`covers ${topic} in depth`)
  }

  // Experience level matching (assuming experience is part of tags for now)
  if (experience && post.tags.includes(experience)) {
    score += 2
    reasons.push(`appropriate for ${experience} level`)
  }

  // Fallback scoring for general relevance
  if (!role && !topic && !experience) {
    score += 3
    reasons.push('essential reading for startup professionals')
  }

  // Recency bonus: more recent posts get a higher score
  const pubDate = new Date(post.pubDate)
  const now = new Date()
  const daysDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24)

  if (daysDiff <= 30) {
    // Posts within 30 days get a significant boost
    score += 3
  } else if (daysDiff <= 90) {
    // Posts within 90 days get a moderate boost
    score += 1
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
  const allBlogPosts = getAllBlogPosts()

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
  const scoredPosts = allBlogPosts.map((post) => {
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
      url: `${new URL(request.url).origin}/posts/${post.slug}`,
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
