import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context
  const slug = params.slug as string

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
      return new Response(
        JSON.stringify({
          error: 'Metadata not found',
          slug,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    const allMetadata = (await metadataResponse.json()) as Record<
      string,
      unknown
    >
    const metadata = allMetadata[slug]

    if (!metadata) {
      return new Response(
        JSON.stringify({
          error: 'Post not found',
          slug,
          availableSlugs: Object.keys(allMetadata).slice(0, 10),
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Try to fetch the raw markdown content
    let markdownContent = null
    let wordCount = 0
    let readingTime = 0

    try {
      const markdownRequest = new Request(
        new URL(`/posts/${slug}.md`, request.url)
      )
      const markdownResponse = await env.ASSETS.fetch(markdownRequest)

      if (markdownResponse.ok) {
        const fullContent = await markdownResponse.text()
        // Extract content after frontmatter
        const contentMatch = fullContent.match(/---[\s\S]*?---\s*([\s\S]*)/)
        if (contentMatch) {
          markdownContent = contentMatch[1].trim()
          // Calculate word count (rough estimate)
          wordCount = markdownContent.split(/\s+/).length
          // Reading time at 200 WPM
          readingTime = Math.ceil(wordCount / 200)
        }
      }
    } catch (error) {
      // Content not available, just return metadata
    }

    const response = {
      slug,
      metadata: {
        title: metadata.title,
        description: metadata.description,
        author: metadata.author || 'Jonathan Haas',
        pubDate: metadata.pubDate,
        tags: metadata.tags || [],
        featured: metadata.featured || false,
      },
      content: {
        markdown: markdownContent,
        wordCount,
        readingTimeMinutes: readingTime,
        available: markdownContent !== null,
      },
      urls: {
        web: `https://haasonsaas.com/blog/${slug}`,
        api: `https://haasonsaas.com/api/posts/${slug}`,
        image: `https://haasonsaas.com/generated/1200x630-${metadata.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.webp`,
      },
      structured_data: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: metadata.title,
        description: metadata.description,
        url: `https://haasonsaas.com/blog/${slug}`,
        datePublished: metadata.pubDate,
        author: {
          '@type': 'Person',
          name: metadata.author || 'Jonathan Haas',
          url: 'https://haasonsaas.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Haas on SaaS',
          url: 'https://haasonsaas.com',
        },
        keywords: metadata.tags?.join(', '),
        ...(wordCount > 0 && {
          wordCount: wordCount,
          timeRequired: `PT${readingTime}M`,
        }),
      },
      meta: {
        generated: new Date().toISOString(),
        apiVersion: '1.0',
      },
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1 hour
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error('Error in post API:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to fetch post',
        slug,
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
