/**
 * Dynamic blog content loader
 * Implements route-based code splitting for blog posts
 */

import type { BlogPost } from '@/types/blog'

// Cache for loaded content with size limit
const contentCache = new Map<string, BlogPost>()
const CACHE_MAX_SIZE = 50 // Limit cache to prevent unbounded growth

/**
 * Dynamically load a blog post by slug
 * Uses readFilePosts to avoid runtime dynamic imports
 */
export async function loadBlogPost(slug: string): Promise<BlogPost | null> {
  // Check cache first
  if (contentCache.has(slug)) {
    return contentCache.get(slug)!
  }

  try {
    // Use readFilePosts to avoid dynamic imports that cause Cloudflare deployment issues
    const { readFilePosts } = await import('./fileLoader')
    const allPosts = await readFilePosts(false) // false = load full content
    const post = allPosts.find((p) => p.slug === slug)

    if (!post) {
      return null
    }

    // Cache the loaded post with LRU eviction
    if (contentCache.size >= CACHE_MAX_SIZE) {
      // Remove oldest entry (first item in Map maintains insertion order)
      const firstKey = contentCache.keys().next().value
      contentCache.delete(firstKey)
    }
    contentCache.set(slug, post)

    return post
  } catch (error) {
    console.warn(`Failed to load blog post: ${slug}`, error)
    return null
  }
}

/**
 * Preload a blog post for faster subsequent access
 */
export function preloadBlogPost(slug: string): void {
  // Only preload if not already cached
  if (!contentCache.has(slug)) {
    loadBlogPost(slug).catch(() => {
      // Ignore preload errors
    })
  }
}

/**
 * Load multiple blog posts in parallel
 */
export async function loadBlogPosts(slugs: string[]): Promise<(BlogPost | null)[]> {
  const loadPromises = slugs.map((slug) => loadBlogPost(slug))
  return Promise.all(loadPromises)
}

/**
 * Get all available blog post slugs
 * This still requires loading the full index, but only once
 */
let allSlugsCache: string[] | null = null

export async function getAllBlogSlugs(): Promise<string[]> {
  if (allSlugsCache) {
    return allSlugsCache
  }

  try {
    // Load the blog index
    const { getAllPostSlugs } = await import('./postUtils')
    allSlugsCache = getAllPostSlugs()
    return allSlugsCache
  } catch (error) {
    console.error('Failed to load blog index:', error)
    return []
  }
}

/**
 * Search for blog posts by query
 * Loads only matching posts
 */
export async function searchBlogPosts(query: string, limit = 10): Promise<BlogPost[]> {
  try {
    // Load search functionality
    const { searchPosts } = await import('./searchUtils')
    const results = await searchPosts(query, limit)
    return results
  } catch (error) {
    console.error('Failed to search blog posts:', error)
    return []
  }
}

/**
 * Get posts by tag
 * Loads only posts with the specified tag
 */
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  try {
    // Load tag functionality
    const { getPostsByTag: getTaggedPosts } = await import('./tagUtils')
    const results = await getTaggedPosts(tag)
    return results
  } catch (error) {
    console.error('Failed to load posts by tag:', error)
    return []
  }
}

/**
 * Clear the content cache
 * Useful for development or memory management
 */
export function clearContentCache(): void {
  contentCache.clear()
  allSlugsCache = null
}
