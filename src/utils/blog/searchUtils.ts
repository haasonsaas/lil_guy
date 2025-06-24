/**
 * Blog search utilities
 * Lazy-loaded for code splitting
 */

import type { BlogPost } from '@/types/blog';
import { getAllPosts } from './postUtils';

/**
 * Search blog posts by query
 */
export async function searchPosts(query: string, limit = 10): Promise<BlogPost[]> {
  const allPosts = getAllPosts();
  const lowercaseQuery = query.toLowerCase();
  
  // Score posts based on relevance
  const scoredPosts = allPosts.map(post => {
    let score = 0;
    
    // Title match (highest weight)
    if (post.title.toLowerCase().includes(lowercaseQuery)) {
      score += 100;
    }
    
    // Description match
    if (post.description.toLowerCase().includes(lowercaseQuery)) {
      score += 50;
    }
    
    // Tag match
    if (post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))) {
      score += 30;
    }
    
    // Content match (lower weight, but still relevant)
    if (post.content.toLowerCase().includes(lowercaseQuery)) {
      score += 10;
    }
    
    return { post, score };
  });
  
  // Filter and sort by score
  return scoredPosts
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}