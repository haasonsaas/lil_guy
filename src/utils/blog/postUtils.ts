import { BlogPost } from '@/types/blog';
import { readFilePosts } from './fileLoader';

// Cache for loaded posts
let allPosts: BlogPost[] | null = null;

/**
 * Get all blog posts (only from markdown files)
 */
export const getAllPosts = (): BlogPost[] => {
  if (!allPosts) {
    console.log('Cache miss - loading posts from files');
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
    console.log('Sorting posts by date');
    allPosts = filePosts.sort((a, b) => {
      const dateA = new Date(a.frontmatter.pubDate);
      const dateB = new Date(b.frontmatter.pubDate);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Log unique slugs to check for duplicates
    const slugs = new Set(allPosts.map(post => post.slug));
    console.log('Unique slugs:', slugs.size);
    console.log('Total posts after sorting:', allPosts.length);
    
    if (slugs.size !== allPosts.length) {
      console.warn('WARNING: Duplicate slugs detected!');
      const duplicateSlugs = allPosts.map(post => post.slug)
        .filter((slug, index, self) => self.indexOf(slug) !== index);
      console.warn('Duplicate slugs:', duplicateSlugs);
    }
  } else {
    console.log('Cache hit - using cached posts');
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

/**
 * Get related posts based on shared tags
 * @param currentPost The current blog post
 * @param limit Maximum number of related posts to return
 * @returns Array of related blog posts
 */
export const getRelatedPosts = (currentPost: BlogPost, limit: number = 3): BlogPost[] => {
  const allPosts = getAllPosts();
  const currentTags = new Set(currentPost.frontmatter.tags.map(tag => tag.toLowerCase()));
  
  // Calculate similarity score for each post
  const postsWithScores = allPosts
    .filter(post => post.slug !== currentPost.slug) // Exclude current post
    .map(post => {
      const postTags = new Set(post.frontmatter.tags.map(tag => tag.toLowerCase()));
      const sharedTags = [...currentTags].filter(tag => postTags.has(tag));
      const similarityScore = sharedTags.length / (currentTags.size + postTags.size - sharedTags.length);
      
      return {
        post,
        score: similarityScore
      };
    })
    .sort((a, b) => b.score - a.score) // Sort by similarity score
    .slice(0, limit) // Take top N posts
    .map(item => item.post);
  
  return postsWithScores;
};
