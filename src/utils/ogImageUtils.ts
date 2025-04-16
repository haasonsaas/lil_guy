/**
 * Utility functions for handling OpenGraph images
 */

const BASE_URL = 'https://haasonsaas.com';

/**
 * Generate a dynamic image URL based on a title
 * This uses our dynamic image generator service
 */
export const generateOgImageUrl = (title: string): string => {
  // Clean the title for use in filename
  const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Return path to dynamically generated image
  return `${BASE_URL}/generated/1200x630-${cleanTitle}.png`;
}

/**
 * Generate a thumbnail image URL for blog cards
 */
export const generateThumbnailUrl = (title: string): string => {
  // Clean the title for use in filename
  const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Return path to dynamically generated image
  return `${BASE_URL}/generated/800x384-${cleanTitle}.png`;
}

/**
 * Generate a featured image URL for blog posts
 */
export const generateFeaturedImageUrl = (title: string): string => {
  // Clean the title for use in filename
  const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Return path to dynamically generated image
  return `${BASE_URL}/generated/1200x400-${cleanTitle}.png`;
} 