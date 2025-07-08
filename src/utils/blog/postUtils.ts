import { BlogPost } from '@/types/blog'
import { readFilePosts } from './fileLoader'
import { generateOgImageUrl } from '../ogImageUtils'

/**
 * Get all blog posts (only from markdown files)
 * @param includeDrafts - Whether to include draft posts (default: false)
 * @param metadataOnly - Whether to load only metadata for performance (default: false)
 */
export const getAllPosts = async (
  includeDrafts: boolean = false,
  metadataOnly: boolean = false
): Promise<BlogPost[]> => {
  const filePosts = readFilePosts(metadataOnly)

  // Filter out drafts unless explicitly included
  const posts = includeDrafts
    ? filePosts
    : filePosts.filter((post) => !post.frontmatter.draft)

  // Make sure each post has valid image information
  for (const post of posts) {
    const hasExplicitImage =
      post.frontmatter.image &&
      post.frontmatter.image.url &&
      !post.frontmatter.image.url.includes(
        'unsplash.com/photo-1499750310107-5fef28a66643'
      )

    if (!hasExplicitImage) {
      const cleanTitle = post.frontmatter.title || post.slug
      const imagePath = await getPostImage(cleanTitle)

      post.frontmatter.image = {
        url: imagePath,
        alt: cleanTitle || 'Blog post image',
      }
    }
  }

  // Sort posts by date in descending order (most recent first)
  const sortedPosts = posts.sort((a, b) => {
    const dateA = new Date(a.frontmatter.pubDate)
    const dateB = new Date(b.frontmatter.pubDate)
    return dateB.getTime() - dateA.getTime()
  })

  // Log unique slugs to check for duplicates
  const slugs = new Set(sortedPosts.map((post) => post.slug))

  if (slugs.size !== sortedPosts.length) {
    console.warn('WARNING: Duplicate slugs detected!')
    const duplicateSlugs = sortedPosts
      .map((post) => post.slug)
      .filter((slug, index, self) => self.indexOf(slug) !== index)
    console.warn('Duplicate slugs:', duplicateSlugs)
  }

  return sortedPosts
}

/**
 * Get all blog posts with metadata only (for performance in listing pages)
 * @param includeDrafts - Whether to include draft posts (default: false)
 */
export const getAllPostsMetadata = async (
  includeDrafts: boolean = false
): Promise<BlogPost[]> => {
  return getAllPosts(includeDrafts, true) // metadataOnly = true
}

/**
 * Get a specific post by slug
 * @param slug - The post slug
 * @param includeDrafts - Whether to include draft posts (default: false)
 */
export const getPostBySlug = async (
  slug: string,
  includeDrafts: boolean = false
): Promise<BlogPost | undefined> => {
  const posts = await getAllPosts(includeDrafts)
  return posts.find((post) => post.slug === slug)
}

/**
 * Get featured posts
 */
export const getFeaturedPosts = async (): Promise<BlogPost[]> => {
  const posts = await getAllPosts()
  // Return posts marked as featured, or fall back to first 3 if none are featured
  const featuredPosts = posts.filter((post) => post.frontmatter.featured)
  return featuredPosts.length > 0 ? featuredPosts : posts.slice(0, 3)
}

/**
 * Get all unique tags from all posts, sorted by frequency of occurrence
 */
export const getAllTags = async (): Promise<
  { tag: string; count: number }[]
> => {
  const posts = await getAllPosts()
  const tagCounts = new Map<string, number>()

  posts.forEach((post) => {
    post.frontmatter.tags.forEach((tag) => {
      const normalizedTag = tag.toLowerCase()
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1)
    })
  })

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }))
}

/**
 * Get posts by tag
 */
export const getPostsByTag = async (tag: string): Promise<BlogPost[]> => {
  const posts = await getAllPosts()
  const normalizedTag = tag.toLowerCase()
  return posts.filter((post) =>
    post.frontmatter.tags.some((t) => t.toLowerCase() === normalizedTag)
  )
}

/**
 * Get related posts based on shared tags
 * @param currentPost The current blog post
 * @param limit Maximum number of related posts to return
 * @returns Array of related blog posts
 */
export const getRelatedPosts = async (
  currentPost: BlogPost,
  limit: number = 3
): Promise<BlogPost[]> => {
  const posts = await getAllPosts()
  const currentTags = new Set(
    currentPost.frontmatter.tags.map((tag) => tag.toLowerCase())
  )

  const postsWithScores = posts
    .filter((post) => post.slug !== currentPost.slug)
    .map((post) => {
      const postTags = new Set(
        post.frontmatter.tags.map((tag) => tag.toLowerCase())
      )
      const sharedTags = [...currentTags].filter((tag) => postTags.has(tag))
      const similarityScore =
        sharedTags.length /
        (currentTags.size + postTags.size - sharedTags.length)

      return {
        post,
        score: similarityScore,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post)

  return postsWithScores
}

const getPostImage = async (title: string) => {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return generateOgImageUrl(cleanTitle)
}
