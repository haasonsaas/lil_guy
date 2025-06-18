import { BlogPostFrontmatter } from '../../types/blog';

interface StructuredDataConfig {
  baseUrl: string;
  siteName: string;
  authorName: string;
  authorUrl: string;
  logoUrl: string;
}

const config: StructuredDataConfig = {
  baseUrl: 'https://haasonsaas.com',
  siteName: 'Haas on SaaS',
  authorName: 'Jonathan Haas',
  authorUrl: 'https://haasonsaas.com/about',
  logoUrl: 'https://haasonsaas.com/logo.webp'
};

export interface BlogPostStructuredData {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  image: string[];
  datePublished: string;
  dateModified: string;
  author: {
    '@type': string;
    name: string;
    url: string;
  };
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
  articleSection: string[];
  keywords: string[];
  wordCount?: number;
  timeRequired?: string;
  url: string;
}

export interface WebsiteStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  description: string;
  author: {
    '@type': string;
    name: string;
    url: string;
  };
  potentialAction: {
    '@type': string;
    target: string;
    'query-input': string;
  };
}

export interface BreadcrumbStructuredData {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item: string;
  }>;
}

/**
 * Generates JSON-LD structured data for a blog post
 */
export function generateBlogPostStructuredData(
  frontmatter: BlogPostFrontmatter,
  slug: string,
  content: string,
  readingTime?: number
): BlogPostStructuredData {
  const postUrl = `${config.baseUrl}/blog/${slug}`;
  const publishDate = new Date(frontmatter.pubDate).toISOString();
  const modifiedDate = frontmatter.updatedDate 
    ? new Date(frontmatter.updatedDate).toISOString() 
    : publishDate;

  // Generate image URLs for the post - use title-based naming
  const cleanTitle = frontmatter.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const imageUrls = [
    `${config.baseUrl}/generated/1200x630-${cleanTitle}.webp`,
    `${config.baseUrl}/generated/1200x400-${cleanTitle}.webp`,
    `${config.baseUrl}/generated/800x384-${cleanTitle}.webp`
  ];

  // Calculate word count if not provided
  const wordCount = content.replace(/\s+/g, ' ').split(' ').length;
  const estimatedReadingTime = readingTime || Math.ceil(wordCount / 200); // 200 WPM average

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: frontmatter.title,
    description: frontmatter.description,
    image: imageUrls,
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Person',
      name: config.authorName,
      url: config.authorUrl
    },
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      logo: {
        '@type': 'ImageObject',
        url: config.logoUrl
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl
    },
    articleSection: frontmatter.tags || [],
    keywords: frontmatter.tags || [],
    wordCount,
    timeRequired: `PT${estimatedReadingTime}M`,
    url: postUrl
  };
}

/**
 * Generates JSON-LD structured data for the website
 */
export function generateWebsiteStructuredData(): WebsiteStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Website',
    name: config.siteName,
    url: config.baseUrl,
    description: 'Insights on building and scaling SaaS products, startup strategy, and product management',
    author: {
      '@type': 'Person',
      name: config.authorName,
      url: config.authorUrl
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${config.baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * Generates breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>
): BreadcrumbStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Generates reading time estimate in minutes
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Validates structured data for common SEO issues
 */
export function validateStructuredData(data: BlogPostStructuredData): string[] {
  const errors: string[] = [];

  if (!data.headline || data.headline.length < 10) {
    errors.push('Headline should be at least 10 characters long');
  }

  if (!data.description || data.description.length < 50) {
    errors.push('Description should be at least 50 characters long');
  }

  if (data.description && data.description.length > 160) {
    errors.push('Description should be under 160 characters for optimal SEO');
  }

  if (!data.image || data.image.length === 0) {
    errors.push('At least one image should be specified');
  }

  if (!data.keywords || data.keywords.length === 0) {
    errors.push('Keywords/tags should be provided');
  }

  if (data.keywords && data.keywords.length > 10) {
    errors.push('Too many keywords - consider limiting to 5-10 relevant tags');
  }

  return errors;
}