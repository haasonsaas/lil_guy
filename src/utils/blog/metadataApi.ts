import { BlogPost, BlogPostFrontmatter } from '@/types/blog'

interface BlogMetadataEntry {
  title: string
  description: string
  author: string
  pubDate: string
  tags: string[]
  readingTime: {
    minutes: number
    wordCount: number
  }
  featured: boolean
  draft: boolean
}

interface BlogMetadata {
  [slug: string]: BlogMetadataEntry
}

let metadataCache: BlogMetadata | null = null

/**
 * Load blog metadata from the pre-generated JSON file
 * This is much faster than loading all markdown files
 */
async function loadMetadata(): Promise<BlogMetadata> {
  if (metadataCache) {
    return metadataCache
  }

  try {
    const response = await fetch('/blog-metadata.json')
    if (!response.ok) {
      throw new Error(`Failed to load metadata: ${response.status}`)
    }
    metadataCache = await response.json()
    return metadataCache!
  } catch (error) {
    console.error('Failed to load blog metadata:', error)
    return {}
  }
}

/**
 * Get all blog posts metadata (lightweight version for listings)
 * @param includeDrafts - Whether to include draft posts (default: false)
 */
export async function getAllPostsMetadata(
  includeDrafts: boolean = false
): Promise<BlogPost[]> {
  const metadata = await loadMetadata()

  const posts: BlogPost[] = []

  Object.entries(metadata).forEach(([slug, data]) => {
    // Skip drafts unless explicitly included
    if (!includeDrafts && data.draft) {
      return
    }

    // Create a BlogPost-compatible object with empty content
    const frontmatter: BlogPostFrontmatter = {
      author: data.author,
      pubDate: data.pubDate,
      title: data.title,
      description: data.description,
      featured: data.featured,
      draft: data.draft,
      tags: data.tags,
      image: {
        url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643', // Default image
        alt: data.title,
      },
      readingTime: data.readingTime,
    }

    posts.push({
      slug,
      frontmatter,
      content: '', // Empty content for listings
    })
  })

  // Sort posts by date in descending order (most recent first)
  return posts.sort((a, b) => {
    const dateA = new Date(a.frontmatter.pubDate)
    const dateB = new Date(b.frontmatter.pubDate)
    return dateB.getTime() - dateA.getTime()
  })
}

/**
 * Get featured posts using metadata only
 */
export async function getFeaturedPostsMetadata(): Promise<BlogPost[]> {
  const allPosts = await getAllPostsMetadata()
  return allPosts.filter((post) => post.frontmatter.featured)
}

/**
 * Get all unique tags from metadata
 */
export async function getAllTagsFromMetadata(): Promise<
  Array<{ tag: string; count: number }>
> {
  const metadata = await loadMetadata()

  const tagCounts = new Map<string, number>()

  Object.values(metadata).forEach((data) => {
    if (!data.draft) {
      // Only count published posts
      data.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    }
  })

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Get posts by tag using metadata only
 * @param tag - The tag to filter by
 * @param includeDrafts - Whether to include draft posts (default: false)
 */
export async function getPostsByTagMetadata(
  tag: string,
  includeDrafts: boolean = false
): Promise<BlogPost[]> {
  const allPosts = await getAllPostsMetadata(includeDrafts)
  return allPosts.filter((post) =>
    post.frontmatter.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}

/**
 * Clear the metadata cache (useful for development)
 */
export function clearMetadataCache(): void {
  metadataCache = null
}
