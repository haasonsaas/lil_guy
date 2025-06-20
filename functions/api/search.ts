import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  // CORS headers for API access
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const tags = url.searchParams.get('tags')?.split(',').map(t => t.trim()) || [];
    
    if (!query && tags.length === 0) {
      return new Response(JSON.stringify({
        error: 'Missing search parameters',
        message: 'Provide either "q" (query) or "tags" parameter',
        examples: [
          '/api/search?q=react',
          '/api/search?tags=cloudflare,react',
          '/api/search?q=opengraph&tags=cloudflare&limit=10'
        ]
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Fetch the blog metadata
    const metadataRequest = new Request(new URL('/blog-metadata.json', request.url));
    const metadataResponse = await env.ASSETS.fetch(metadataRequest);
    
    if (!metadataResponse.ok) {
      return new Response('Metadata not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }
    
    const allMetadata = await metadataResponse.json() as Record<string, unknown>;
    
    // Convert to searchable array
    let posts = Object.entries(allMetadata).map(([slug, metadata]) => ({
      slug,
      title: metadata.title || '',
      description: metadata.description || '',
      author: metadata.author || 'Jonathan Haas',
      pubDate: metadata.pubDate,
      tags: metadata.tags || [],
      url: `https://haasonsaas.com/blog/${slug}`,
      apiUrl: `https://haasonsaas.com/api/posts/${slug}`,
    }));

    // Filter by tags first
    if (tags.length > 0) {
      posts = posts.filter(post => 
        tags.some(searchTag => 
          post.tags.some((postTag: string) => 
            postTag.toLowerCase().includes(searchTag.toLowerCase())
          )
        )
      );
    }

    // Search by query if provided
    if (query) {
      const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
      
      posts = posts
        .map(post => {
          let score = 0;
          const titleLower = post.title.toLowerCase();
          const descLower = post.description.toLowerCase();
          const tagsLower = post.tags.map((t: string) => t.toLowerCase()).join(' ');
          
          searchTerms.forEach(term => {
            // Title matches get highest weight
            if (titleLower.includes(term)) score += 3;
            // Description matches get medium weight
            if (descLower.includes(term)) score += 2;
            // Tag matches get lower weight
            if (tagsLower.includes(term)) score += 1;
          });
          
          return { ...post, relevanceScore: score };
        })
        .filter(post => post.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else {
      // If no query, sort by date
      posts = posts
        .map(post => ({ ...post, relevanceScore: 1 }))
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    }

    // Apply limit
    const results = posts.slice(0, limit);
    
    const response = {
      query: {
        text: query || null,
        tags: tags.length > 0 ? tags : null,
        limit
      },
      results: results.map(({ relevanceScore, ...post }) => ({
        ...post,
        ...(query && { relevanceScore })
      })),
      meta: {
        totalResults: posts.length,
        returned: results.length,
        generated: new Date().toISOString(),
        apiVersion: '1.0',
      }
    };
    
    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes
        ...corsHeaders,
      },
    });
    
  } catch (error) {
    console.error('Error in search API:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Failed to perform search'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};