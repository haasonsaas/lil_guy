import type { BlogPost, Series } from '@/types/blog';

/**
 * Get all series from blog posts
 */
export const getAllSeries = (posts: BlogPost[]): Series[] => {
  const seriesMap = new Map<string, BlogPost[]>();
  
  // Group posts by series name
  posts.forEach(post => {
    if (post.frontmatter.series) {
      const seriesName = post.frontmatter.series.name;
      if (!seriesMap.has(seriesName)) {
        seriesMap.set(seriesName, []);
      }
      seriesMap.get(seriesName)!.push(post);
    }
  });
  
  // Convert to Series objects and sort posts by part number
  return Array.from(seriesMap.entries()).map(([name, seriesPosts]) => {
    const sortedPosts = seriesPosts.sort((a, b) => {
      const partA = a.frontmatter.series?.part || 0;
      const partB = b.frontmatter.series?.part || 0;
      return partA - partB;
    });
    
    // Get series description from the first post that has one
    const description = sortedPosts.find(post => post.frontmatter.series?.description)?.frontmatter.series?.description;
    
    return {
      name,
      description,
      posts: sortedPosts,
      totalParts: sortedPosts.length
    };
  }).sort((a, b) => {
    // Sort series by the publication date of their first post
    const firstPostA = a.posts[0];
    const firstPostB = b.posts[0];
    return new Date(firstPostB.frontmatter.pubDate).getTime() - new Date(firstPostA.frontmatter.pubDate).getTime();
  });
};

/**
 * Get a specific series by name
 */
export const getSeriesByName = (posts: BlogPost[], seriesName: string): Series | null => {
  const allSeries = getAllSeries(posts);
  return allSeries.find(series => series.name.toLowerCase() === seriesName.toLowerCase()) || null;
};

/**
 * Get series for a specific post
 */
export const getPostSeries = (posts: BlogPost[], currentPost: BlogPost): Series | null => {
  if (!currentPost.frontmatter.series) {
    return null;
  }
  
  return getSeriesByName(posts, currentPost.frontmatter.series.name);
};

/**
 * Get next post in a series
 */
export const getNextPostInSeries = (series: Series, currentPost: BlogPost): BlogPost | null => {
  const currentIndex = series.posts.findIndex(post => post.slug === currentPost.slug);
  if (currentIndex === -1 || currentIndex === series.posts.length - 1) {
    return null;
  }
  return series.posts[currentIndex + 1];
};

/**
 * Get previous post in a series
 */
export const getPreviousPostInSeries = (series: Series, currentPost: BlogPost): BlogPost | null => {
  const currentIndex = series.posts.findIndex(post => post.slug === currentPost.slug);
  if (currentIndex <= 0) {
    return null;
  }
  return series.posts[currentIndex - 1];
};

/**
 * Check if a post is part of a series
 */
export const isPartOfSeries = (post: BlogPost): boolean => {
  return !!post.frontmatter.series;
};

/**
 * Get series progress for a post (e.g., "Part 2 of 5")
 */
export const getSeriesProgress = (post: BlogPost, series: Series): string => {
  if (!post.frontmatter.series) {
    return '';
  }
  
  const part = post.frontmatter.series.part;
  const total = series.totalParts;
  return `Part ${part} of ${total}`;
};

/**
 * Get estimated reading time for entire series
 */
export const getSeriesReadingTime = (series: Series, calculateReadingTime: (content: string) => { minutes: number; wordCount: number }): { minutes: number; wordCount: number } => {
  return series.posts.reduce((total, post) => {
    const postTime = calculateReadingTime(post.content);
    return {
      minutes: total.minutes + postTime.minutes,
      wordCount: total.wordCount + postTime.wordCount
    };
  }, { minutes: 0, wordCount: 0 });
};