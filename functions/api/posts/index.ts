import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  // CORS headers for API access
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    // Fetch the blog metadata
    const metadataRequest = new Request(
      new URL('/blog-metadata.json', request.url)
    )
    const metadataResponse = await env.ASSETS.fetch(metadataRequest)

    if (!metadataResponse.ok) {
      return new Response('Metadata not found', {
        status: 404,
        headers: corsHeaders,
      })
    }

    const allMetadata = (await metadataResponse.json()) as Record<
      string,
      unknown
    >

    // Parse query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const tag = url.searchParams.get('tag')
    const author = url.searchParams.get('author')

    // Convert to array and filter
    let posts = Object.entries(allMetadata).map(([slug, metadata]) => ({
      slug,
      ...metadata,
      url: `https://haasonsaas.com/blog/${slug}`,
      apiUrl: `https://haasonsaas.com/api/posts/${slug}`,
    }))

    // Filter by tag
    if (tag) {
      posts = posts.filter(
        (post) =>
          post.tags &&
          post.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase())
      )
    }

    // Filter by author
    if (author) {
      posts = posts.filter(
        (post) =>
          post.author &&
          post.author.toLowerCase().includes(author.toLowerCase())
      )
    }

    // Sort by publication date (newest first)
    posts.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    )

    // Apply pagination
    const total = posts.length
    const paginatedPosts = posts.slice(offset, offset + limit)

    const response = {
      posts: paginatedPosts,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
        nextOffset: offset + limit < total ? offset + limit : null,
      },
      meta: {
        generated: new Date().toISOString(),
        apiVersion: '1.0',
        endpoints: {
          search: '/api/search',
          tags: '/api/tags',
          individual: '/api/posts/{slug}',
        },
      },
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error('Error in posts API:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to fetch posts',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
}
