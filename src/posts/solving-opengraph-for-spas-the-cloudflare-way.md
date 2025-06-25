---
author: 'Jonathan Haas'
pubDate: '2025-06-20'
title: 'Solving OpenGraph for SPAs: The Cloudflare Way'
description: "How to fix social media previews for React SPAs using Cloudflare's edge functions - no SSR required"
featured: false
draft: false
tags:
  [
    'cloudflare',
    'react',
    'spa',
    'opengraph',
    'edge-computing',
    'developer-experience',
  ]
---

I just spent hours trying to get OpenGraph images working for my React SPA blog. If you've ever shared a React app link on Twitter only to see a blank preview, you know the pain.

Here's the thing: social media crawlers don't execute JavaScript. They grab your HTML, scan for meta tags, and bounce. Your beautiful React app that dynamically sets meta tags? The crawler never sees it.

## The Problem Nobody Warns You About

When you build a single-page application, you're making a tradeoff. You get:

- Lightning-fast client-side navigation
- Rich interactivity
- Simplified deployment (just static files!)

But you lose:

- SEO visibility (mostly)
- Social media previews
- Some accessibility features

The OpenGraph problem hits you right when you're ready to share your work with the world. You tweet your latest blog post, and... nothing. No image. Maybe not even a title.

## The Solutions That Don't Work

I tried several approaches before finding the right one:

### Attempt 1: React Helmet

```javascript
<Helmet>
  <meta property="og:image" content={imageUrl} />
</Helmet>
```

Nope. Crawlers don't run JavaScript, remember?

**Attempt 2: Separate Static Pages**
I actually built a system that generated `/og/[slug].html` pages for each blog post. It worked, but sharing `haasonsaas.com/og/my-post.html` instead of `haasonsaas.com/blog/my-post`? Nobody's going to remember that.

**Attempt 3: Cloudflare Pages Functions (Wrong Way)**
I tried intercepting routes and serving completely different HTML to crawlers. This broke my site because I didn't understand how routing worked.

## The Solution: HTMLRewriter at the Edge

After researching how others solve this, I discovered Cloudflare's HTMLRewriter. It's exactly what we need: modify HTML on the fly at the edge.

Here's the complete solution:

```typescript
// functions/_middleware.ts
import type { PagesFunction } from '@cloudflare/workers-types'

export const onRequest: PagesFunction = async (context) => {
  const { request, next, env } = context
  const response = await next()

  // Only process HTML responses
  if (!response.headers.get('content-type')?.includes('text/html')) {
    return response
  }

  // Detect social media bots
  const userAgent = request.headers.get('user-agent') || ''
  const isBot = /facebookexternalhit|Twitterbot|LinkedInBot/i.test(userAgent)

  if (!isBot) {
    return response
  }

  // Check if this is a blog post
  const url = new URL(request.url)
  const blogMatch = url.pathname.match(/^\/blog\/([^/]+)\/?$/)

  if (!blogMatch) {
    return response
  }

  const slug = blogMatch[1]
  // Fetch your metadata (from KV, JSON, API, etc.)
  const metadata = await getPostMetadata(slug)

  if (!metadata) {
    return response
  }

  // Inject meta tags using HTMLRewriter
  return new HTMLRewriter()
    .on('head', {
      element(element) {
        element.prepend(
          `
    <meta property="og:title" content="${metadata.title}" />
    <meta property="og:description" content="${metadata.description}" />
    <meta property="og:image" content="${metadata.image}" />
    <meta property="og:url" content="${request.url}" />
    <meta name="twitter:card" content="summary_large_image" />
        `,
          { html: true }
        )
      },
    })
    .transform(response)
}
```

## Why This Works

1. **Edge Computing**: The function runs at Cloudflare's edge, close to users
2. **Selective Processing**: Only runs for social media bots, not regular users
3. **No Architecture Changes**: Your React app stays exactly the same
4. **Automatic**: Works with your normal URLs - no special sharing links

## The Critical Details

**Bot Detection**: The regex needs to catch all the crawlers:

```javascript
;/bot|crawler|spider|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slack|Discord|telegram/i
```

**Routing Configuration**: Your `_routes.json` needs to include HTML routes but exclude assets:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/assets/*", "*.js", "*.css", "*.webp", "*.png"]
}
```

**Image URL Generation**: Make sure your image URLs are absolute and match what's actually deployed.

## The Result

Now when someone shares my blog posts, they see beautiful preview cards with images, titles, and descriptions. The solution runs at the edge with minimal latency, and I didn't have to change my React app at all.

## Lessons Learned

1. **Research First**: I wasted hours on complex solutions when the standard approach was simpler
2. **Understand Your Platform**: Cloudflare Pages has powerful features - use them
3. **Don't Fight the Framework**: SPAs have tradeoffs. Accept them and work around them
4. **Edge Functions Are Powerful**: This is just one example of what you can do at the edge

If you're struggling with OpenGraph on your SPA, don't overcomplicate it. Use your platform's edge computing features to inject what crawlers need while keeping your app fast for real users.

The web platform keeps evolving. What seems like a fundamental limitation today might have an elegant solution tomorrow. Sometimes you just need to know where to look.
