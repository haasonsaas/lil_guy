import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import matter from 'gray-matter';
import type { BlogPost, BlogPostFrontmatter } from '../src/types/blog';

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
  series?: {
    name?: string;
    part?: number;
    description?: string;
  };
}

/**
 * Server-side compatible blog post loader for RSS generation
 */
export const loadPostsFromDisk = (): BlogPost[] => {
  const posts: BlogPost[] = [];
  const postsDirectory = join(process.cwd(), 'src', 'posts');
  
  try {
    const files = readdirSync(postsDirectory);
    const markdownFiles = files.filter(file => extname(file) === '.md');
    
    console.log(`Found ${markdownFiles.length} markdown files`);
    
    for (const file of markdownFiles) {
      try {
        const filePath = join(postsDirectory, file);
        const fileContent = readFileSync(filePath, 'utf-8');
        const { data: frontmatter, content } = matter(fileContent);
        
        // Extract slug from filename
        const slug = file.replace('.md', '');
        
        // Process tags to ensure they're in array format
        let tags: string[] = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
        if (typeof frontmatter.tags === 'string') {
          tags = frontmatter.tags.split(',').map((tag: string) => tag.trim());
        }
        
        // Process image to ensure it has the correct format
        let image = { url: '', alt: '' };
        if (frontmatter.image) {
          if (typeof frontmatter.image === 'string') {
            image = { url: frontmatter.image as string, alt: 'Blog post image' };
          } else if (typeof frontmatter.image === 'object') {
            const imageObj = frontmatter.image as Record<string, unknown>;
            if (imageObj.url && typeof imageObj.url === 'string') {
              image.url = imageObj.url;
            }
            if (imageObj.alt && typeof imageObj.alt === 'string') {
              image.alt = imageObj.alt;
            }
          }
        }
        
        // Default image if none provided
        if (!image.url) {
          image.url = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643';
          image.alt = 'Default blog post image';
        }
        
        // Process series if it exists
        let series: { name: string; part: number; description?: string } | undefined;
        if (frontmatter.series && frontmatter.series.name && frontmatter.series.part) {
          series = {
            name: frontmatter.series.name,
            part: frontmatter.series.part,
            description: frontmatter.series.description
          };
        }
        
        // Set defaults
        const processedFrontmatter: BlogPostFrontmatter = {
          author: frontmatter.author || "Jonathan Haas",
          pubDate: frontmatter.pubDate || new Date().toISOString().split('T')[0],
          title: frontmatter.title || slug.replace(/-/g, ' '),
          description: frontmatter.description || "No description provided",
          featured: frontmatter.featured ?? false,
          draft: frontmatter.draft === true,
          tags,
          image,
          series
        };
        
        posts.push({
          slug,
          frontmatter: processedFrontmatter,
          content: content || ''
        });
        
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
    
    // Sort posts by date in descending order (most recent first)
    posts.sort((a, b) => {
      const dateA = new Date(a.frontmatter.pubDate);
      const dateB = new Date(b.frontmatter.pubDate);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`Successfully loaded ${posts.length} posts`);
    return posts;
    
  } catch (error) {
    console.error('Error loading markdown files:', error);
    return [];
  }
};