
// This file exports all blog utilities from the organized modules
// It serves as the main entry point to maintain backward compatibility

// Re-export everything from the new modules
export { getAllPosts, getPostBySlug, getFeaturedPosts, getAllTags, getPostsByTag } from './blog/postUtils';
export { formatDate } from './blog/dateUtils';
