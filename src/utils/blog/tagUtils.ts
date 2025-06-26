/**
 * Blog tag utilities
 * Lazy-loaded for code splitting
 */

import type { BlogPost } from '@/types/blog'
import { getAllPosts } from './postUtils'

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): BlogPost[] {
  const allPosts = getAllPosts()

  return allPosts.filter((post) =>
    post.tags.some((postTag) => postTag.toLowerCase() === tag.toLowerCase())
  )
}

/**
 * Get all available tags with post counts
 */
export function getAllTags(): Array<{ tag: string; count: number }> {
  const allPosts = getAllPosts()
  const tagCounts = new Map<string, number>()

  allPosts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Get related tags for a given tag
 */
export function getRelatedTags(targetTag: string, limit = 5): string[] {
  const allPosts = getAllPosts()
  const relatedTagCounts = new Map<string, number>()

  // Find posts with the target tag
  const postsWithTag = allPosts.filter((post) =>
    post.tags.some((tag) => tag.toLowerCase() === targetTag.toLowerCase())
  )

  // Count occurrences of other tags in those posts
  postsWithTag.forEach((post) => {
    post.tags.forEach((tag) => {
      if (tag.toLowerCase() !== targetTag.toLowerCase()) {
        relatedTagCounts.set(tag, (relatedTagCounts.get(tag) || 0) + 1)
      }
    })
  })

  return Array.from(relatedTagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}
