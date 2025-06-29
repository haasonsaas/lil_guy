export interface BlogPost {
  title: string
  slug: string
  description: string
  author: string
  pubDate: string
  tags: string[]
  content?: string // Optional, for full content search
  url: string
}

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
}

interface BlogMetadataEntry {
  title: string
  description: string
  author: string
  pubDate: string
  tags: string[]
}

let cachedBlogMetadata: Record<string, BlogMetadataEntry> | null = null

async function fetchBlogMetadata(
  env: Env
): Promise<Record<string, BlogMetadataEntry>> {
  if (cachedBlogMetadata) {
    return cachedBlogMetadata
  }
  try {
    const response = await env.ASSETS.fetch(
      new Request('http://localhost/blog-metadata.json')
    )
    if (!response.ok) {
      throw new Error(
        `Failed to fetch blog-metadata.json: ${response.statusText}`
      )
    }
    cachedBlogMetadata = await response.json()
    return cachedBlogMetadata
  } catch (error: unknown) {
    console.error('Error fetching blog metadata:', error)
    throw error
  }
}

export async function getAllBlogPosts(env: Env): Promise<BlogPost[]> {
  try {
    const blogMetadata = await fetchBlogMetadata(env)
    return Object.entries(blogMetadata).map(
      ([slug, data]: [string, BlogMetadataEntry]) => ({
        slug,
        title: data.title,
        description: data.description,
        author: data.author,
        pubDate: data.pubDate,
        tags: Array.isArray(data.tags) ? data.tags : [],
        url: `https://haasonsaas.com/posts/${slug}`,
      })
    )
  } catch (error: unknown) {
    console.error('Error in getAllBlogPosts:', error)
    return []
  }
}

export async function getBlogPostBySlug(
  slug: string,
  env: Env
): Promise<BlogPost | undefined> {
  try {
    const blogMetadata = await fetchBlogMetadata(env)
    const data = blogMetadata[slug]
    if (!data) {
      return undefined
    }
    return {
      slug,
      title: data.title,
      description: data.description,
      author: data.author,
      pubDate: data.pubDate,
      tags: Array.isArray(data.tags) ? data.tags : [],
      url: `https://haasonsaas.com/posts/${slug}`,
    }
  } catch (error: unknown) {
    console.error(`Error in getBlogPostBySlug for slug ${slug}:`, error)
    return undefined
  }
}
