// This function serves blog posts with pre-rendered meta tags for social media crawlers
import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

interface BlogMetadata {
  title: string;
  description: string;
  author?: string;
  pubDate?: string;
  tags?: string[];
}

// Function to generate the HTML with meta tags
function generateHtmlWithMetaTags(slug: string, metadata: BlogMetadata): string {
  const title = metadata.title || 'Untitled Post';
  const description = metadata.description || '';
  const author = metadata.author || 'Jonathan Haas';
  const pubDate = metadata.pubDate || new Date().toISOString();
  
  // Generate image URL matching the exact pattern from blogImageGenerator.ts
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const imageUrl = `https://haasonsaas.com/generated/1200x630-${cleanSlug}.webp`;
  const url = `https://haasonsaas.com/blog/${slug}`;
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Primary Meta Tags -->
    <title>${title} | Haas on SaaS</title>
    <meta name="title" content="${title} | Haas on SaaS" />
    <meta name="description" content="${description}" />
    <meta name="author" content="${author}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/webp" />
    <meta property="og:site_name" content="Haas on SaaS" />
    <meta property="article:author" content="${author}" />
    <meta property="article:published_time" content="${pubDate}" />
    ${metadata.tags?.map((tag: string) => `<meta property="article:tag" content="${tag}" />`).join('\n    ')}
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:site" content="@haasonsaas" />
    <meta name="twitter:creator" content="@haasonsaas" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon-180x180.png" />
    
    <!-- RSS/Atom Feeds -->
    <link rel="alternate" type="application/rss+xml" title="Haas on SaaS RSS Feed" href="/rss.xml" />
    <link rel="alternate" type="application/atom+xml" title="Haas on SaaS Atom Feed" href="/atom.xml" />
    
    <!-- Cloudflare Web Analytics -->
    <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "fde2b6b1d84348ce989e7121013d09ba"}'></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { params, request, env } = context;
  const slug = params.slug as string;
  
  // Check if this is a crawler by looking at the User-Agent
  const userAgent = request.headers.get('User-Agent') || '';
  const isCrawler = /bot|crawler|spider|facebook|twitter|telegram|whatsapp|linkedin|slack|discord/i.test(userAgent);
  
  // If not a crawler, just serve the normal SPA
  if (!isCrawler) {
    return env.ASSETS.fetch(request);
  }
  
  try {
    // Fetch the blog metadata
    const metadataResponse = await fetch(`https://haasonsaas.com/blog-metadata.json`);
    if (!metadataResponse.ok) {
      // If metadata fetch fails, serve the normal SPA
      return env.ASSETS.fetch(request);
    }
    
    const allMetadata = await metadataResponse.json();
    const metadata = allMetadata[slug];
    
    if (!metadata) {
      // If no metadata found for this slug, serve the normal SPA
      return env.ASSETS.fetch(request);
    }
    
    // Generate HTML with meta tags
    const html = generateHtmlWithMetaTags(slug, metadata);
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error in blog post function:', error);
    // On any error, fall back to serving the normal SPA
    return env.ASSETS.fetch(request);
  }
};