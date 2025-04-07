import { BlogPost, BlogPostFrontmatter } from '@/types/blog';

/**
 * Load blog posts from markdown files in the /src/posts directory
 */
export const readFilePosts = (): BlogPost[] => {
  const posts: BlogPost[] = [];
  
  try {
    // Use import.meta.glob to get all markdown files
    const markdownFiles: Record<string, { default: { frontmatter: Record<string, unknown>, content: string } }> = 
      import.meta.glob('/src/posts/*.md', { eager: true }) as Record<string, { default: { frontmatter: Record<string, unknown>, content: string } }>;
    
    // Log the found markdown files for debugging
    console.log('Found markdown files:', Object.keys(markdownFiles));

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
        
        console.log(`Processing post with slug: ${fileSlug}`);
        console.log(`Extracted frontmatter:`, frontmatter);
        
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
        let image: { url?: string; alt?: string } = {};
        
        // Handle different image formats
        if (typeof frontmatter.image === 'string') {
          // If image is just a string, assume it's the URL
          image = { url: frontmatter.image as string, alt: 'Blog post image' };
        } else if (frontmatter.image && typeof frontmatter.image === 'object') {
          // If image is an object, ensure it has url and alt properties
          const imageObj = frontmatter.image as Record<string, unknown>;
          image = {
            url: imageObj.url as string | undefined,
            alt: imageObj.alt as string | undefined
          };
          
          if (!image.url) {
            console.warn(`Post ${fileSlug} has an image object but no URL specified`);
          }
          if (!image.alt) {
            console.warn(`Post ${fileSlug} has an image object but no alt text specified`);
          }
        }
        
        // Merge the parsed frontmatter with default values
        const postFrontmatter = {
          ...defaultFrontmatter,
          ...frontmatter,
          tags: tags,
          image: {
            url: image.url || defaultFrontmatter.image?.url,
            alt: image.alt || defaultFrontmatter.image?.alt || 'Blog post image'
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
        console.log(`Successfully added post: ${post.frontmatter.title}`);
      } catch (err) {
        console.error(`Error processing markdown file ${filePath}:`, err);
      }
    });
    
    console.log(`Total file-based posts loaded: ${posts.length}`);
  } catch (err) {
    console.error("Error loading markdown files:", err);
  }
  
  return posts;
};
