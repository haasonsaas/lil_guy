import { BlogPost, BlogPostFrontmatter } from '@/types/blog';

/**
 * Load blog posts from markdown files in the /src/posts directory
 */
export const readFilePosts = (): BlogPost[] => {
  const posts: BlogPost[] = [];
  const seenSlugs = new Set<string>();
  
  try {
    // Use import.meta.glob to get all markdown files
    const markdownFiles: Record<string, { default: { frontmatter: Record<string, unknown>, content: string } }> = 
      import.meta.glob('../../posts/*.md', { eager: true }) as Record<string, { default: { frontmatter: Record<string, unknown>, content: string } }>;
    
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
          return;
        }
        seenSlugs.add(fileSlug);
        
        // Set default values for any missing frontmatter fields
        const defaultFrontmatter: Partial<BlogPostFrontmatter> = {
          author: "Unknown",
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
        let tags = frontmatter.tags || [];
        if (typeof tags === 'string') {
          tags = tags.split(',').map(tag => tag.trim());
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
        
        // Merge the parsed frontmatter with default values
        const postFrontmatter = {
          ...defaultFrontmatter,
          ...frontmatter,
          tags: tags,
          image: {
            url: image.url,
            alt: image.alt
          }
        } as BlogPostFrontmatter;
        
        // Create the BlogPost object
        const post: BlogPost = {
          slug: fileSlug,
          frontmatter: postFrontmatter,
          content: content || ''
        };
        
        // Add to posts array
        posts.push(post);
      } catch (err) {
        console.error(`Error processing markdown file ${filePath}:`, err);
      }
    });
  } catch (err) {
    console.error("Error loading markdown files:", err);
  }
  
  return posts;
};
