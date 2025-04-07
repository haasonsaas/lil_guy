import { BlogPost } from '@/types/blog';
import { readFilePosts } from './fileLoader';
import { generateDynamicImageUrl } from './imageUtils';

// Cache for loaded posts
let allPosts: BlogPost[] | null = null;

/**
 * Get all blog posts (only from markdown files)
 */
export const getAllPosts = (): BlogPost[] => {
  if (!allPosts) {
    const filePosts = readFilePosts();
    console.log("File posts loaded:", filePosts.length);
    
    // Make sure each post has valid image information
    filePosts.forEach(post => {
      // Force dynamic image generation for all posts except those with explicit frontmatter images
      const hasExplicitImage = post.frontmatter.image && 
                               post.frontmatter.image.url && 
                               !post.frontmatter.image.url.includes('unsplash.com/photo-1499750310107-5fef28a66643');
      
      if (!hasExplicitImage) {
        console.log(`Generating dynamic image for: ${post.frontmatter.title}`);
        post.frontmatter.image = {
          url: generateDynamicImageUrl(post.frontmatter.title || post.slug),
          alt: post.frontmatter.title || 'Blog post image'
        };
      } else {
        console.log(`Using frontmatter image for: ${post.frontmatter.title}`);
      }
    });
    
    allPosts = filePosts;
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
