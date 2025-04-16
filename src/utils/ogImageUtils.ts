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