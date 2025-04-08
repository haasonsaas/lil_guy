/**
 * Utility functions for handling blog post images
 */

interface BlogFrontmatter {
  title?: string;
  image?: {
    url: string;
    alt?: string;
  };
}

const BASE_URL = 'https://haasonsaas.com';

/**
 * Generate a dynamic image URL based on a blog post title
 * This uses our local placeholder image generator
 */
export const generateDynamicImageUrl = (title: string, width: number = 1200, height: number = 630): string => {
  // Clean the title for use in filename
  const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Return absolute path to our local placeholder image
  return `${BASE_URL}/placeholders/${width}x${height}-${cleanTitle}.png`;
}

/**
 * Generate OpenGraph image URL for social sharing
 */
export const generateOgImageUrl = (title: string): string => {
  return generateDynamicImageUrl(title, 1200, 630);
}

/**
 * Generate thumbnail image URL for blog cards
 */
export const generateThumbnailUrl = (title: string): string => {
  return generateDynamicImageUrl(title, 800, 450);
}

/**
 * Get image data with fallbacks for blog posts
 */
export const getImageData = (frontmatter: BlogFrontmatter): { url: string; alt: string } => {
  const title = frontmatter.title || 'Blog Post';
  
  // Check if the image is the fallback unsplash image
  const isDefaultUnsplashImage = frontmatter.image && 
                               frontmatter.image.url && 
                               frontmatter.image.url.includes('unsplash.com/photo-1499750310107-5fef28a66643');
  
  // If we have a real image (not the fallback unsplash one) use it, otherwise generate
  if (frontmatter.image && frontmatter.image.url && !isDefaultUnsplashImage) {
    // Ensure the URL is absolute
    const imageUrl = frontmatter.image.url.startsWith('http') 
      ? frontmatter.image.url 
      : `${BASE_URL}${frontmatter.image.url.startsWith('/') ? '' : '/'}${frontmatter.image.url}`;
    
    console.log('Using frontmatter image:', imageUrl);
    return {
      url: imageUrl,
      alt: frontmatter.image.alt || title
    };
  }
  
  // Otherwise generate a dynamic image
  console.log('Generating dynamic image for:', title);
  return {
    url: generateDynamicImageUrl(title),
    alt: title
  };
}
