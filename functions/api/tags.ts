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
    
    // Count tags
    const tagCounts = new Map<string, number>();
    const tagPosts = new Map<string, Array<{ slug: string; title: string; pubDate: string }>>();
    
    Object.entries(allMetadata).forEach(([slug, metadata]) => {
      const tags = metadata.tags || [];
      tags.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        
        if (!tagPosts.has(tag)) {
          tagPosts.set(tag, []);
        }
        tagPosts.get(tag)!.push({
          slug,
          title: metadata.title,
          pubDate: metadata.pubDate
        });
      });
    });
    
    // Parse query parameters
    const url = new URL(request.url);
    const includesPosts = url.searchParams.get('posts') === 'true';
    const sortBy = url.searchParams.get('sort') || 'count'; // 'count' or 'name'
    const minCount = parseInt(url.searchParams.get('minCount') || '1');
    
    // Convert to array and sort
    const tags = Array.from(tagCounts.entries())
      .filter(([, count]) => count >= minCount)
      .map(([tag, count]) => ({
        tag,
        count,
        slug: tag.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        url: `https://haasonsaas.com/tags/${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        searchUrl: `https://haasonsaas.com/api/search?tags=${encodeURIComponent(tag)}`,
        ...(includesPosts && {
          posts: tagPosts.get(tag)!
            .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
            .slice(0, 5) // Limit to 5 most recent posts per tag
        })
      }));
    
    // Sort tags
    if (sortBy === 'count') {
      tags.sort((a, b) => b.count - a.count);
    } else {
      tags.sort((a, b) => a.tag.localeCompare(b.tag));
    }
    
    const response = {
      tags,
      meta: {
        totalTags: tags.length,
        totalPosts: Object.keys(allMetadata).length,
        sortedBy: sortBy,
        minCount,
        includesPosts,
        generated: new Date().toISOString(),
        apiVersion: '1.0',
        categories: {
          technical: tags.filter(t => ['engineering', 'product', 'technical', 'ai', 'cloudflare', 'react'].includes(t.tag)),
          business: tags.filter(t => ['strategy', 'leadership', 'startup', 'saas', 'growth'].includes(t.tag)),
          personal: tags.filter(t => ['personal-growth', 'culture', 'productivity'].includes(t.tag))
        }
      }
    };
    
    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1 hour
        ...corsHeaders,
      },
    });
    
  } catch (error) {
    console.error('Error in tags API:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Failed to fetch tags'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};