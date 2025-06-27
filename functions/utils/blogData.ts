import blogMetadata from '../../public/blog-metadata.json'

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

export function getAllBlogPosts(): BlogPost[] {
  return Object.entries(blogMetadata).map(([slug, data]) => ({
    slug,
    title: data.title,
    description: data.description,
    author: data.author,
    pubDate: data.pubDate,
    tags: Array.isArray(data.tags) ? data.tags : [],
    url: `https://haasonsaas.com/posts/${slug}`,
  }))
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
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
}
