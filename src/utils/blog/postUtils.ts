
import { BlogPost } from '@/types/blog';
import { readFilePosts } from './fileLoader';
import samplePosts from './samplePosts';

// Cache for loaded posts
let allPosts: BlogPost[] | null = null;

/**
 * Get all blog posts (combines sample posts and file-based posts)
 */
export const getAllPosts = (): BlogPost[] => {
  if (!allPosts) {
    const filePosts = readFilePosts();
    console.log("File posts loaded:", filePosts.length);
    allPosts = [...samplePosts, ...filePosts];
  }
  return allPosts;
};

/**
 * Get a specific post by slug
 */
export const getPostBySlug = (slug: string): BlogPost | undefined => {
  return getAllPosts().find(post => post.slug === slug);
};

/**
 * Get featured posts
 */
export const getFeaturedPosts = (): BlogPost[] => {
  return getAllPosts().filter(post => post.frontmatter.featured);
};

/**
 * Get all unique tags from all posts
 */
export const getAllTags = (): string[] => {
  const tags = new Set<string>();
  getAllPosts().forEach(post => {
    post.frontmatter.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags);
};

/**
 * Get posts by tag
 */
export const getPostsByTag = (tag: string): BlogPost[] => {
  return getAllPosts().filter(post => post.frontmatter.tags.includes(tag));
};
