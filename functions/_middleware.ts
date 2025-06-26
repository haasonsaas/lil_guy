import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
}

interface BlogMetadata {
  title: string
  description: string
  author?: string
  pubDate?: string
  tags?: string[]
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context

  // Get the response from the next handler (your SPA)
  const response = await next()

  // Only process HTML responses
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) {
    return response
  }

  // Check if this is a social media bot
  const userAgent = request.headers.get('user-agent') || ''
  const isBot =
    /bot|crawler|spider|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slack|Discord|telegram/i.test(
      userAgent
    )

  // If not a bot, return the original response
  if (!isBot) {
    return response
  }

  // Check if this is a blog post URL
  const url = new URL(request.url)
  const blogMatch = url.pathname.match(/^\/blog\/([^/]+)\/?$/)

  if (!blogMatch) {
    // Not a blog post, return original response
    return response
  }

  const slug = blogMatch[1]

  try {
    // Fetch the blog metadata
    const metadataRequest = new Request(
      new URL('/blog-metadata.json', request.url)
    )
    const metadataResponse = await env.ASSETS.fetch(metadataRequest)

    if (!metadataResponse.ok) {
      return response
    }

    const allMetadata = (await metadataResponse.json()) as Record<
      string,
      BlogMetadata
    >
    const metadata = allMetadata[slug]

    if (!metadata) {
      return response
    }

    // Generate the image URL matching your pattern
    const cleanTitle = metadata.title.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const imageUrl = `https://haasonsaas.com/generated/1200x630-${cleanTitle}.webp`
    const blogUrl = `https://haasonsaas.com/blog/${slug}`

    // Use HTMLRewriter to inject meta tags
    return new HTMLRewriter()
      .on('head', {
        element(element) {
          // Remove any existing OG tags to avoid duplicates
          element.prepend(
            `
    <!-- OpenGraph Meta Tags -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${blogUrl}" />
    <meta property="og:title" content="${metadata.title}" />
    <meta property="og:description" content="${metadata.description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/webp" />
    <meta property="og:site_name" content="Haas on SaaS" />
    <meta property="article:author" content="${metadata.author || 'Jonathan Haas'}" />
    <meta property="article:published_time" content="${metadata.pubDate}" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${blogUrl}" />
    <meta name="twitter:title" content="${metadata.title}" />
    <meta name="twitter:description" content="${metadata.description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:site" content="@haasonsaas" />
    <meta name="twitter:creator" content="@haasonsaas" />`,
            { html: true }
          )
        },
      })
      .transform(response)
  } catch (error) {
    console.error('Error in middleware:', error)
    // On any error, return the original response
    return response
  }
}
