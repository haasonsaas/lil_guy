/**
 * Utility functions for handling blog post images
 */

interface BlogFrontmatter {
  title?: string
  image?: {
    url: string
    alt?: string
  }
}

const BASE_URL = 'https://haasonsaas.com'

/**
 * Generate a dynamic image URL based on a blog post title
 * This uses our dynamic image generator service
 */
export const generateDynamicImageUrl = (
  title: string,
  width: number = 1200,
  height: number = 400
): string => {
  // Clean the title for use in filename
  const cleanTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')

  // Return path to dynamically generated image
  return `/generated/${width}x${height}-${cleanTitle}.webp`
}

/**
 * Generate OpenGraph image URL for social sharing
 */
export const generateOgImageUrl = (title: string): string => {
  // OpenGraph images should maintain 1.91:1 aspect ratio (1200x630)
  return generateDynamicImageUrl(title, 1200, 630)
}

/**
 * Generate thumbnail image URL for blog cards
 */
export const generateThumbnailUrl = (title: string): string => {
  // For regular blog cards, the image container is h-48 (192px) and w-full
  // Using 800x384 to maintain a 2.083:1 aspect ratio at a good resolution
  return generateDynamicImageUrl(title, 800, 384)
}

/**
 * Get image data with fallbacks for blog posts
 */
export const getImageData = (
  frontmatter: BlogFrontmatter
): { url: string; alt: string } => {
  const title = frontmatter.title || 'Blog Post'

  // Check if the image is the fallback unsplash image
  const imageUrl = frontmatter.image?.url
  const isDefaultUnsplashImage =
    typeof imageUrl === 'string' &&
    imageUrl.includes('unsplash.com/photo-1499750310107-5fef28a66643')

  // If we have a custom image (not the default unsplash one) use it, otherwise generate
  if (typeof imageUrl === 'string' && !isDefaultUnsplashImage) {
    // Use the URL as-is if it's absolute, otherwise prepend a slash
    const finalUrl = imageUrl.startsWith('http')
      ? imageUrl
      : imageUrl.startsWith('/')
        ? imageUrl
        : `/${imageUrl}`

    return {
      url: finalUrl,
      alt: frontmatter.image?.alt || title,
    }
  }

  // Otherwise generate a dynamic image
  return {
    url: generateDynamicImageUrl(title),
    alt: title,
  }
}
