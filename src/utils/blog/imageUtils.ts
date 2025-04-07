
/**
 * Utility functions for handling blog post images
 */

/**
 * Generate a dynamic image URL based on a blog post title
 * This uses a simple placeholder image service with text overlay
 */
export const generateDynamicImageUrl = (title: string, width: number = 1200, height: number = 630): string => {
  // Clean and encode the title for use in URL
  const cleanTitle = encodeURIComponent(title.trim());
  
  // Create a dynamic background color based on the hash of the title
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  
  // Build a more reliable placeholder image URL
  // Using placid.app format which is more reliable than Cloudinary for text overlays
  const timestamp = new Date().getTime();
  return `https://placehold.co/${width}x${height}/${hue}35/ffffff?text=${cleanTitle}&font=playfair-display&_t=${timestamp}`;
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
export const getImageData = (frontmatter: any): { url: string; alt: string } => {
  const title = frontmatter.title || 'Blog Post';
  
  // Check if the image is the fallback unsplash image
  const isDefaultUnsplashImage = frontmatter.image && 
                               frontmatter.image.url && 
                               frontmatter.image.url.includes('unsplash.com/photo-1499750310107-5fef28a66643');
  
  // If we have a real image (not the fallback unsplash one) use it, otherwise generate
  if (frontmatter.image && frontmatter.image.url && !isDefaultUnsplashImage) {
    console.log('Using frontmatter image:', frontmatter.image.url);
    return {
      url: frontmatter.image.url,
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
