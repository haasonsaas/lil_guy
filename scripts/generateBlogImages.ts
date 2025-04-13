import { generateBlogImages } from '../src/utils/blogImageGenerator';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Book cover placeholder images
const bookCovers = [
  { width: 200, height: 300, text: 'AI Future', type: 'book' as const, backgroundColor: '#e9e9e9', textColor: '#333333' },
  { width: 200, height: 300, text: 'Working in Public', type: 'book' as const, backgroundColor: '#e9e9e9', textColor: '#333333' },
  { width: 200, height: 300, text: 'AI Business', type: 'book' as const, backgroundColor: '#e9e9e9', textColor: '#333333' },
  { width: 200, height: 300, text: 'Innovators', type: 'book' as const, backgroundColor: '#e9e9e9', textColor: '#333333' },
  { width: 200, height: 300, text: 'Hooked', type: 'book' as const, backgroundColor: '#e9e9e9', textColor: '#333333' },
  { width: 200, height: 300, text: 'Psychology of Money', type: 'book' as const, backgroundColor: '#e9e9e9', textColor: '#333333' },
  { width: 200, height: 300, text: 'Atomic Habits', type: 'book' as const, backgroundColor: '#e9e9e9', textColor: '#333333' },
  { width: 200, height: 300, text: 'Lean Startup', type: 'book' as const, backgroundColor: '#e9e9e9', textColor: '#333333' },
  { width: 200, height: 300, text: 'Zero to One', type: 'book' as const, backgroundColor: '#e9e9e9', textColor: '#333333' },
  { width: 200, height: 300, text: 'Thinking Fast Slow', type: 'book' as const, backgroundColor: '#e9e9e9', textColor: '#333333' },
  { width: 200, height: 300, text: 'Science Engineering', type: 'book' as const, backgroundColor: '#e9e9e9', textColor: '#333333' },
];

// Default blog post placeholder images
const defaultBlogImages = [
  { width: 1200, height: 630, text: 'Blog Post', type: 'blog' as const, backgroundColor: '#f5f5f5', textColor: '#333333' }, // Default OG image
  { width: 800, height: 450, text: 'Blog Post', type: 'blog' as const, backgroundColor: '#f5f5f5', textColor: '#333333' },  // Default thumbnail
];

// Function to read blog posts from the filesystem
function readBlogPosts() {
  const postsDir = path.join(process.cwd(), 'src', 'posts');
  const files = fs.readdirSync(postsDir);
  
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(postsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter } = matter(fileContent);
      const slug = file.replace('.md', '');
      
      return {
        slug,
        frontmatter: {
          title: frontmatter.title || slug.replace(/-/g, ' '),
          // Add other frontmatter fields as needed
        }
      };
    });
}

async function main() {
  console.log('Generating blog images...');
  
  // Get all blog posts to generate their images
  const blogPosts = readBlogPosts();
  console.log(`Found ${blogPosts.length} blog posts`);
  
  // Create image configs for each blog post
  const blogPostImages = blogPosts.map(post => {
    const title = post.frontmatter.title || post.slug;
    return [
      // OG image (1200x630)
      { 
        width: 1200, 
        height: 630, 
        text: title, 
        type: 'blog' as const, 
        backgroundColor: '#f5f5f5', 
        textColor: '#333333' 
      },
      // Featured image (1200x400)
      { 
        width: 1200, 
        height: 400, 
        text: title, 
        type: 'blog' as const, 
        backgroundColor: '#f5f5f5', 
        textColor: '#333333' 
      },
      // Thumbnail (800x384)
      { 
        width: 800, 
        height: 384, 
        text: title, 
        type: 'blog' as const, 
        backgroundColor: '#f5f5f5', 
        textColor: '#333333' 
      }
    ];
  }).flat();
  
  // Generate all blog images
  await generateBlogImages(blogPostImages);
  console.log('Blog images generated successfully!');
}

main().catch((error) => {
  console.error('Error generating blog images:', error);
  process.exit(1);
}); 