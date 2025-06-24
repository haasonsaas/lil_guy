import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Shared types
export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
  wordCount: number;
  readingTime: number;
  date: Date;
}

export interface BlogFrontmatter {
  title: string;
  pubDate: string;
  description?: string;
  tags?: string[];
  draft?: boolean;
  author?: string;
  featured?: boolean;
}

// Shared constants
export const POSTS_DIR = path.join(process.cwd(), 'src', 'posts');
export const WORDS_PER_MINUTE = 200;

// Cache for posts to avoid repeated file reads
let postsCache: BlogPost[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Count words in content, excluding code blocks and markdown syntax
 */
export function countWords(content: string): number {
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/#+\s/g, '')           // Remove headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
    .replace(/[*_~`]/g, '')         // Remove formatting
    .replace(/\n+/g, ' ')           // Replace newlines with spaces
    .trim();
  
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate reading time based on word count
 */
export function calculateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

/**
 * Parse and validate frontmatter
 */
export function parseFrontmatter(data: unknown): BlogFrontmatter {
  const obj = data as Record<string, unknown>;
  // Ensure required fields
  if (!obj.title || typeof obj.title !== 'string') {
    throw new Error('Invalid frontmatter: missing title');
  }
  
  if (!obj.pubDate) {
    throw new Error('Invalid frontmatter: missing pubDate');
  }
  
  return {
    title: obj.title as string,
    pubDate: obj.pubDate as string,
    description: obj.description as string | undefined,
    tags: Array.isArray(obj.tags) ? obj.tags as string[] : undefined,
    draft: obj.draft === true,
    author: (obj.author as string) || 'Jonathan Haas',
    featured: obj.featured === true,
  };
}

/**
 * Get all blog posts with caching
 */
export async function getAllPosts(options?: {
  includeDrafts?: boolean;
  sortBy?: 'date' | 'title' | 'wordCount';
  sortOrder?: 'asc' | 'desc';
  forceRefresh?: boolean;
}): Promise<BlogPost[]> {
  const {
    includeDrafts = false,
    sortBy = 'date',
    sortOrder = 'desc',
    forceRefresh = false
  } = options || {};
  
  // Check cache
  const now = Date.now();
  if (!forceRefresh && postsCache && (now - cacheTime) < CACHE_DURATION) {
    return filterAndSortPosts(postsCache, { includeDrafts, sortBy, sortOrder });
  }
  
  // Read all markdown files
  const files = await fs.readdir(POSTS_DIR);
  const markdownFiles = files.filter(file => file.endsWith('.md'));
  
  const posts = await Promise.all(
    markdownFiles.map(async (file) => {
      const filePath = path.join(POSTS_DIR, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const { data, content } = matter(fileContent);
      
      try {
        const frontmatter = parseFrontmatter(data);
        const wordCount = countWords(content);
        const readingTime = calculateReadingTime(wordCount);
        
        return {
          slug: file.replace('.md', ''),
          frontmatter,
          content,
          wordCount,
          readingTime,
          date: new Date(frontmatter.pubDate)
        };
      } catch (error) {
        console.warn(`Skipping invalid post ${file}:`, error);
        return null;
      }
    })
  );
  
  // Filter out nulls and cache
  postsCache = posts.filter((p): p is BlogPost => p !== null);
  cacheTime = now;
  
  return filterAndSortPosts(postsCache, { includeDrafts, sortBy, sortOrder });
}

/**
 * Filter and sort posts based on options
 */
function filterAndSortPosts(
  posts: BlogPost[],
  options: {
    includeDrafts?: boolean;
    sortBy: 'date' | 'title' | 'wordCount';
    sortOrder: 'asc' | 'desc';
  }
): BlogPost[] {
  // Filter drafts
  const filtered = options.includeDrafts 
    ? posts 
    : posts.filter(p => !p.frontmatter.draft);
  
  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    
    switch (options.sortBy) {
      case 'date':
        comparison = a.date.getTime() - b.date.getTime();
        break;
      case 'title':
        comparison = a.frontmatter.title.localeCompare(b.frontmatter.title);
        break;
      case 'wordCount':
        comparison = a.wordCount - b.wordCount;
        break;
    }
    
    return options.sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(tag: string, includeDrafts = false): Promise<BlogPost[]> {
  const posts = await getAllPosts({ includeDrafts });
  return posts.filter(p => p.frontmatter.tags?.includes(tag));
}

/**
 * Get recent posts
 */
export async function getRecentPosts(days: number, includeDrafts = false): Promise<BlogPost[]> {
  const posts = await getAllPosts({ includeDrafts });
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return posts.filter(p => p.date >= cutoffDate);
}

/**
 * Get tag counts
 */
export async function getTagCounts(includeDrafts = false): Promise<Map<string, number>> {
  const posts = await getAllPosts({ includeDrafts });
  const tagCounts = new Map<string, number>();
  
  posts.forEach(post => {
    post.frontmatter.tags?.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  
  return new Map([...tagCounts.entries()].sort((a, b) => b[1] - a[1]));
}

/**
 * Clear the posts cache
 */
export function clearCache(): void {
  postsCache = null;
  cacheTime = 0;
}