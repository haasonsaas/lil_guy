/**
 * Utility functions for handling OpenGraph images
 */

import { generateDynamicImageUrl } from './blog/imageUtils'

/**
 * Generate a dynamic image URL based on a title
 * This uses our dynamic image generator service
 */
export const generateOgImageUrl = async (title: string): Promise<string> => {
  return generateDynamicImageUrl(title, 1200, 630)
}

/**
 * Generate a thumbnail image URL for blog cards
 */
export const generateThumbnailUrl = async (title: string): Promise<string> => {
  return generateDynamicImageUrl(title, 800, 384)
}

/**
 * Generate a featured image URL for blog posts
 */
export const generateFeaturedImageUrl = async (
  title: string
): Promise<string> => {
  return generateDynamicImageUrl(title, 1200, 400)
}
