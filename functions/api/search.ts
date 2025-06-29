import type { PagesFunction } from '@cloudflare/workers-types'
import { getAllBlogPosts, BlogPost } from '../utils/blogData'

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
}

interface SearchResult extends BlogPost {
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
function calculateRelevance(query: string, post: BlogPost): number {
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

  // Recency bonus: more recent posts get a higher score
  const pubDate = new Date(post.pubDate)
  const now = new Date()
  const daysDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24)

  if (daysDiff <= 30) {
    // Posts within 30 days get a significant boost
    score += 7
  } else if (daysDiff <= 90) {
    // Posts within 90 days get a moderate boost
    score += 4
  } else if (daysDiff <= 365) {
    // Posts within 1 year get a small boost
    score += 1
  }

  return Math.min(score / 20, 1) // Normalize to 0-1
}

export const onRequest: PagesFunction<Env> = async (
  context: EventContext<Env, string, Record<string, unknown>>
): Promise<Response> => {
  const { request } = context
  const baseUrl = new URL(request.url).origin
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

  const allBlogPosts = getAllBlogPosts()

  // Search and rank results
  const results: SearchResult[] = allBlogPosts
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
