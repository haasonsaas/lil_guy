import { Helmet } from 'react-helmet-async';
import { BlogPostFrontmatter } from '../../types/blog';

interface MetaTagsProps {
  title: string;
  description: string;
  url: string;
  type?: 'website' | 'article';
  image?: string;
  imageAlt?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  readingTime?: number;
  noIndex?: boolean;
  canonical?: string;
}

interface BlogPostMetaProps {
  frontmatter: BlogPostFrontmatter;
  slug: string;
  content: string;
  readingTime?: number;
}

const DEFAULT_CONFIG = {
  siteName: 'Haas on SaaS',
  baseUrl: 'https://haasonsaas.com',
  authorName: 'Jonathan Haas',
  authorTwitter: '@haasonsaas',
  defaultImage: 'https://haasonsaas.com/og-default.webp',
  favicon: '/favicon.ico'
};

/**
 * Comprehensive SEO meta tags component
 */
export function MetaTags({
  title,
  description,
  url,
  type = 'website',
  image,
  imageAlt,
  author,
  publishedTime,
  modifiedTime,
  tags,
  readingTime,
  noIndex = false,
  canonical
}: MetaTagsProps) {
  const fullTitle = title.includes(DEFAULT_CONFIG.siteName) 
    ? title 
    : `${title} | ${DEFAULT_CONFIG.siteName}`;
  
  const imageUrl = image || DEFAULT_CONFIG.defaultImage;
  const canonicalUrl = canonical || url;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="author" content={author || DEFAULT_CONFIG.authorName} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Keywords */}
      {tags && tags.length > 0 && (
        <meta name="keywords" content={tags.join(', ')} />
      )}
      
      {/* Reading Time */}
      {readingTime && (
        <meta name="twitter:label1" content="Reading time" />
      )}
      {readingTime && (
        <meta name="twitter:data1" content={`${readingTime} min read`} />
      )}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={DEFAULT_CONFIG.siteName} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={imageAlt || title} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* Article-specific Open Graph */}
      {type === 'article' && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {tags && tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={DEFAULT_CONFIG.authorTwitter} />
      <meta name="twitter:creator" content={DEFAULT_CONFIG.authorTwitter} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt || title} />
      
      {/* Additional Twitter metadata */}
      {type === 'article' && (
        <>
          <meta name="twitter:label2" content="Filed under" />
          {tags && tags.length > 0 && (
            <meta name="twitter:data2" content={tags.slice(0, 3).join(', ')} />
          )}
        </>
      )}
      
      {/* Theme Color */}
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />
      
      {/* Favicon */}
      <link rel="icon" href={DEFAULT_CONFIG.favicon} />
      <link rel="apple-touch-icon" href="/apple-touch-icon.webp" />
      
      {/* RSS Feed */}
      <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/rss.xml" />
      <link rel="alternate" type="application/atom+xml" title="Atom Feed" href="/atom.xml" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
}

/**
 * Blog post specific meta tags with sensible defaults
 */
export function BlogPostMeta({ frontmatter, slug, content, readingTime }: BlogPostMetaProps) {
  const url = `${DEFAULT_CONFIG.baseUrl}/blog/${slug}`;
  const imageUrl = `${DEFAULT_CONFIG.baseUrl}/generated/${slug}-1200x630.webp`;
  
  // Calculate reading time if not provided
  const estimatedReadingTime = readingTime || Math.ceil(content.split(/\s+/).length / 200);
  
  // Generate optimized description
  const description = frontmatter.description || 
    content.replace(/[#*`]/g, '').split('\n').find(line => line.length > 50)?.substring(0, 155) + '...' ||
    `Read this insightful article by ${DEFAULT_CONFIG.authorName}`;
    
  return (
    <MetaTags
      title={frontmatter.title}
      description={description}
      url={url}
      type="article"
      image={imageUrl}
      imageAlt={`Cover image for ${frontmatter.title}`}
      author={frontmatter.author || DEFAULT_CONFIG.authorName}
      publishedTime={new Date(frontmatter.pubDate).toISOString()}
      modifiedTime={frontmatter.updatedDate ? new Date(frontmatter.updatedDate).toISOString() : undefined}
      tags={frontmatter.tags}
      readingTime={estimatedReadingTime}
      noIndex={frontmatter.draft || false}
    />
  );
}

/**
 * Website/page meta tags
 */
export function WebsiteMeta({ 
  title = DEFAULT_CONFIG.siteName, 
  description = 'Insights on building and scaling SaaS products, startup strategy, and product management',
  path = ''
}: {
  title?: string;
  description?: string;
  path?: string;
}) {
  const url = `${DEFAULT_CONFIG.baseUrl}${path}`;
  
  return (
    <MetaTags
      title={title}
      description={description}
      url={url}
      type="website"
      image={DEFAULT_CONFIG.defaultImage}
      imageAlt={`${DEFAULT_CONFIG.siteName} - ${description}`}
    />
  );
}

export default MetaTags;