import { BlogPost, BlogPostFrontmatter } from '@/types/blog';

interface RawFrontmatter {
  postSlug?: string;
  author?: string;
  pubDate?: string;
  title?: string;
  description?: string;
  featured?: boolean;
  draft?: boolean;
  tags?: string[] | string;
  image?: {
    url?: string;
    alt?: string;
  };
}

/**
 * Load blog posts from markdown files in the /src/posts directory
 */
export const readFilePosts = (): BlogPost[] => {
  const posts: BlogPost[] = [];
  const seenSlugs = new Set<string>();
  let totalFiles = 0;
  let skippedFiles = 0;
  
  try {
    // Use import.meta.glob to get all markdown files
    const markdownFiles: Record<string, { default: { frontmatter: RawFrontmatter, content: string } }> = 
      import.meta.glob('../../posts/*.md', { eager: true }) as Record<string, { default: { frontmatter: RawFrontmatter, content: string } }>;
    
    totalFiles = Object.keys(markdownFiles).length;
    console.log(`Found ${totalFiles} markdown files`);
    
    Object.entries(markdownFiles).forEach(([filePath, moduleContent]) => {
      try {
        // Extract frontmatter and content from the module
        const { frontmatter, content } = moduleContent.default;
        
        // Extract slug from filename or frontmatter
        let fileSlug = '';
        
        if (frontmatter && frontmatter.postSlug) {
          fileSlug = frontmatter.postSlug as string;
        } else {
          // Extract the slug from filename if not specified in frontmatter
          fileSlug = filePath.split('/').pop()?.replace('.md', '') || '';
        }
        
        // Skip if we've already seen this slug
        if (seenSlugs.has(fileSlug)) {
          console.warn(`Skipping duplicate slug: ${fileSlug}`);
          skippedFiles++;
          return;
        }
        seenSlugs.add(fileSlug);
        
        // Set default values for any missing frontmatter fields
        const defaultFrontmatter: BlogPostFrontmatter = {
          author: "Jonathan Haas",
          pubDate: new Date().toISOString().split('T')[0],
          title: fileSlug.replace(/-/g, ' '),
          description: "No description provided",
          featured: false,
          draft: false,
          tags: [],
          image: {
            url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643',
            alt: 'Default blog post image'
          }
        };
        
        // Process tags to ensure they're in array format
        let tags: string[] = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
        if (typeof frontmatter.tags === 'string') {
          tags = frontmatter.tags.split(',').map(tag => tag.trim());
        }
        
        // Process image to ensure it has the correct format
        let image = { url: '', alt: '' };
        
        // Check if image exists in frontmatter
        if (frontmatter.image) {
          // Handle different image formats
          if (typeof frontmatter.image === 'string') {
            // If image is just a string, assume it's the URL
            image = { url: frontmatter.image as string, alt: 'Blog post image' };
          } else if (typeof frontmatter.image === 'object') {
            // If image is an object, extract url and alt properties
            const imageObj = frontmatter.image as Record<string, unknown>;
            
            // Extract url property
            if (imageObj.url && typeof imageObj.url === 'string') {
              image.url = imageObj.url;
            }
            
            // Extract alt property
            if (imageObj.alt && typeof imageObj.alt === 'string') {
              image.alt = imageObj.alt;
            }
          }
        }
        
        // Ensure image has valid values or use defaults
        if (!image.url) {
          image.url = defaultFrontmatter.image!.url;
        }
        
        if (!image.alt) {
          image.alt = defaultFrontmatter.image!.alt;
        }
        

        // Merge frontmatter with defaults, ensuring all required properties are present
        const processedFrontmatter: BlogPostFrontmatter = {
          ...defaultFrontmatter,
          author: frontmatter.author || defaultFrontmatter.author,
          pubDate: frontmatter.pubDate || defaultFrontmatter.pubDate,
          title: frontmatter.title || defaultFrontmatter.title,
          description: frontmatter.description || defaultFrontmatter.description,
          featured: frontmatter.featured ?? defaultFrontmatter.featured,
          tags,
          draft: frontmatter.draft === true,
          image: {
            url: frontmatter.image?.url || defaultFrontmatter.image.url,
            alt: frontmatter.image?.alt || defaultFrontmatter.image.alt
          }
        };
        
        posts.push({
          slug: fileSlug,
          frontmatter: processedFrontmatter,
          content: content || ''
        });
        
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        skippedFiles++;
      }
    });
    
    console.log(`Successfully loaded ${posts.length} posts (${skippedFiles} skipped)`);
    return posts;
    
  } catch (error) {
    console.error('Error loading markdown files:', error);
    return [];
  }
};
