/**
 * Utility functions for handling blog post images
 */

/**
 * Generate a dynamic image URL based on a blog post title
 * This uses a simple text-based image generation service
 */
export const generateDynamicImageUrl = (title: string, width: number = 1200, height: number = 630): string => {
  // Clean and encode the title for use in URL
  const cleanTitle = encodeURIComponent(title.trim());
  
  // Create a dynamic background color based on the hash of the title
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  const lightness = 30 + (hash % 20); // Keep it relatively dark (30-50% lightness)
  
  // Build the image URL using a text-to-image service
  return `https://res.cloudinary.com/demo/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/l_text:Roboto_48_bold:${cleanTitle},co_white,c_fit,w_${width - 100}/fl_layer_apply,g_center/b_rgb:hsl(${hue},60,${lightness})/v1/placeholder`;
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
  
  // First try to use the provided image if it exists and has a URL
  if (frontmatter.image && frontmatter.image.url) {
    return {
      url: frontmatter.image.url,
      alt: frontmatter.image.alt || title
    };
  }
  
  // Otherwise generate a dynamic image
  return {
    url: generateDynamicImageUrl(title),
    alt: title
  };
}
