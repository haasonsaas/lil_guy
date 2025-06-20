// Middleware to inject OpenGraph meta tags for blog posts
// This ensures social media crawlers see the correct meta tags

interface RequestContext {
  request: Request;
  next: () => Promise<Response>;
  env: unknown;
}

export async function onRequest(context: RequestContext) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  
  // Only process blog post pages
  if (!url.pathname.startsWith('/blog/') || url.pathname === '/blog/') {
    return next();
  }

  // Get the original response
  const response = await next();
  
  // Only process HTML responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }

  // Extract slug from URL
  const slug = url.pathname.split('/blog/')[1].replace(/\/$/, '');
  
  try {
    // Fetch the blog metadata
    const metadataResponse = await fetch(`${url.origin}/blog-metadata.json`);
    if (!metadataResponse.ok) {
      console.error('Failed to fetch blog metadata');
      return response;
    }
    
    const allMetadata = await metadataResponse.json();
    const metadata = allMetadata[slug];
    
    if (!metadata) {
      console.error(`No metadata found for slug: ${slug}`);
      return response;
    }
    
    // Generate the image URL based on the slug
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const imageUrl = `https://haasonsaas.com/generated/1200x630-${cleanSlug}.webp`;
    
    // Read the HTML
    const html = await response.text();
    
    // Create comprehensive meta tags
    const metaTags = `
    <!-- OpenGraph Meta Tags (Server-Side Injected) -->
    <meta property="og:title" content="${metadata.title}" />
    <meta property="og:description" content="${metadata.description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/webp" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url.href}" />
    <meta property="og:site_name" content="Haas on SaaS" />
    <meta property="article:author" content="${metadata.author}" />
    <meta property="article:published_time" content="${metadata.pubDate}" />
    ${metadata.tags.map(tag => `<meta property="article:tag" content="${tag}" />`).join('\n    ')}
    
    <!-- Twitter Card Meta Tags (Server-Side Injected) -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${metadata.title}" />
    <meta name="twitter:description" content="${metadata.description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:image:alt" content="${metadata.title}" />
    <meta name="twitter:site" content="@haasonsaas" />
    <meta name="twitter:creator" content="@haasonsaas" />
    
    <!-- Additional SEO Tags -->
    <meta name="description" content="${metadata.description}" />
    <meta name="author" content="${metadata.author}" />
  `;
    
    // Replace the existing title tag and inject our meta tags
    let modifiedHtml = html.replace(
      /<title>.*?<\/title>/,
      `<title>${metadata.title} | Haas on SaaS</title>`
    );
    
    // Inject the meta tags right after the title
    modifiedHtml = modifiedHtml.replace(
      '</title>',
      `</title>\n${metaTags}`
    );
    
    // Also update any existing meta description tag
    modifiedHtml = modifiedHtml.replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${metadata.description}" />`
    );
    
    return new Response(modifiedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    console.error('Error in OpenGraph middleware:', error);
    return response;
  }
}