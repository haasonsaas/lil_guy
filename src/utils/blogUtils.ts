// This file exports all blog utilities from the organized modules
// It serves as the main entry point to maintain backward compatibility

// Re-export everything from the new modules
export {
  getAllPosts,
  getAllPostsMetadata,
  getPostBySlug,
  getFeaturedPosts,
  getAllTags,
  getPostsByTag,
  getRelatedPosts,
} from './blog/postUtils'

// Re-export fast metadata API for listings
export {
  getAllPostsMetadata as getAllPostsMetadataFast,
  getFeaturedPostsMetadata,
  getAllTagsFromMetadata,
} from './blog/metadataApi'
export { formatDate } from './blog/dateUtils'

/**
 * Calculate reading time in minutes based on word count
 * @param content The content to calculate reading time for
 * @returns An object containing the estimated reading time in minutes and the word count
 */
export const calculateReadingTime = (content: string): { minutes: number; wordCount: number } => {
  // Average reading speed in words per minute
  const WORDS_PER_MINUTE = 200

  // Clean up the content while preserving meaningful text
  const text = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks with triple backticks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/^\s*[-*]\s.*$/gm, '') // Remove list items
    .replace(/^\s*\d+\.\s.*$/gm, '') // Remove numbered list items
    .replace(/^\s*#{1,6}\s.*$/gm, '') // Remove headers
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // Keep alt text from links/images
    .replace(/[#*`~>|]/g, '') // Remove markdown syntax
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))

  return {
    minutes,
    wordCount,
  }
}

/**
 * Generate blog statistics
 * @returns An object containing various blog statistics
 */
export const getBlogStats = async () => {
  const { getAllPosts, getAllTags } = await import('./blog/postUtils')
  const posts = await getAllPosts()
  const tags = await getAllTags()

  // Filter out draft posts
  const publishedPosts = posts.filter((post) => !post.frontmatter.draft)

  // Calculate total word count and reading time across all posts
  const stats = publishedPosts.reduce(
    (acc, post) => {
      const { wordCount, minutes } = calculateReadingTime(post.content)
      return {
        totalWordCount: acc.totalWordCount + wordCount,
        totalReadingTime: acc.totalReadingTime + minutes,
      }
    },
    { totalWordCount: 0, totalReadingTime: 0 }
  )

  // Calculate average reading time (minimum 1 minute)
  const avgReadingTime = Math.max(1, Math.round(stats.totalReadingTime / publishedPosts.length))

  // Get unique tags count (case-insensitive)
  const uniqueTags = new Set(
    publishedPosts.flatMap((post) => post.frontmatter.tags.map((tag) => tag.toLowerCase()))
  )

  // Calculate total reading time in hours and minutes
  const totalHours = Math.floor(stats.totalReadingTime / 60)
  const totalMinutes = stats.totalReadingTime % 60
  const totalReadingTimeFormatted =
    totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`

  return {
    totalPosts: publishedPosts.length,
    totalWordCount: stats.totalWordCount,
    avgReadingTime,
    topTags: tags.slice(0, 3).map((t) => t.tag),
    totalReadingTime: stats.totalReadingTime,
    totalReadingTimeFormatted,
    totalTags: uniqueTags.size,
    featuredPosts: publishedPosts.filter((post) => post.frontmatter.featured).length,
    monthlyReaders: publishedPosts.length * 1000, // Estimate based on post count
  }
}
