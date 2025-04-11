// This file exports all blog utilities from the organized modules
// It serves as the main entry point to maintain backward compatibility

// Re-export everything from the new modules
export { getAllPosts, getPostBySlug, getFeaturedPosts, getAllTags, getPostsByTag } from './blog/postUtils';
export { formatDate } from './blog/dateUtils';

/**
 * Calculate reading time in minutes based on word count
 * @param content The content to calculate reading time for
 * @returns The estimated reading time in minutes
 */
export const calculateReadingTime = (content: string): number => {
  // Average reading speed in words per minute
  const WORDS_PER_MINUTE = 200;
  
  // Remove markdown syntax and count words
  const text = content
    .replace(/[#*`~>]/g, '') // Remove markdown syntax
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
  
  const wordCount = text.split(' ').length;
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
};
