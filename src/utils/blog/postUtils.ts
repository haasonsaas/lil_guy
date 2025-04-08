import { BlogPost } from '@/types/blog';
import { readFilePosts } from './fileLoader';

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
        // Use our new placeholder image generator
        const cleanTitle = post.frontmatter.title || post.slug;
        const imagePath = `/placeholders/1200x630-${cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
        
        post.frontmatter.image = {
          url: imagePath,
          alt: cleanTitle || 'Blog post image'
        };
      } else {
        console.log(`Using frontmatter image for: ${post.frontmatter.title}`);
      }
    });
    
    // Sort posts by date in descending order (most recent first)
    allPosts = filePosts.sort((a, b) => {
      const dateA = new Date(a.frontmatter.pubDate);
      const dateB = new Date(b.frontmatter.pubDate);
      return dateB.getTime() - dateA.getTime();
    });
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
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  
  posts.forEach(post => {
    post.frontmatter.tags.forEach(tag => tagSet.add(tag.toLowerCase()));
  });
  
  return Array.from(tagSet);
};

/**
 * Get posts by tag
 */
export const getPostsByTag = (tag: string): BlogPost[] => {
  const normalizedTag = tag.toLowerCase();
  return getAllPosts().filter(post => 
    post.frontmatter.tags.some(t => t.toLowerCase() === normalizedTag)
  );
};
