#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import chalk from 'chalk';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

const baseUrl = 'https://haasonsaas.com';

/**
 * Static pages configuration
 */
const staticPages: SitemapUrl[] = [
  {
    loc: `${baseUrl}/`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 1.0
  },
  {
    loc: `${baseUrl}/blog`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.9
  },
  {
    loc: `${baseUrl}/about`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.8
  },
  {
    loc: `${baseUrl}/uses`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    loc: `${baseUrl}/reading`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.6
  },
  {
    loc: `${baseUrl}/tags`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.6
  },
  {
    loc: `${baseUrl}/archive`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.5
  },
  {
    loc: `${baseUrl}/newsletter`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.5
  },
  {
    loc: `${baseUrl}/faq`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.4
  },
  {
    loc: `${baseUrl}/experiments`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.3
  }
];

/**
 * Generate sitemap XML content
 */
function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlElements = urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

/**
 * Generate robots.txt content
 */
function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin and draft pages
Disallow: /admin
Disallow: /drafts

# Allow crawling of generated images
Allow: /generated/

# Crawl delay (be nice to our server)
Crawl-delay: 1`;
}

/**
 * Load blog posts directly from filesystem (Node.js compatible)
 */
function loadBlogPosts() {
  const postsDir = path.join(process.cwd(), 'src', 'posts');
  const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));
  
  const posts = files.map(file => {
    const filePath = path.join(postsDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter } = matter(fileContent);
    
    return {
      slug: path.basename(file, '.md'),
      frontmatter
    };
  });
  
  return posts.filter(post => !post.frontmatter.draft);
}

/**
 * Main sitemap generation function
 */
async function generateSitemap() {
  try {
    console.log(chalk.blue('🗺️  Generating XML sitemap...\n'));

    // Get all published blog posts
    const publishedPosts = loadBlogPosts();

    console.log(chalk.gray(`Found ${publishedPosts.length} published posts`));

    // Generate blog post URLs
    const blogPostUrls: SitemapUrl[] = publishedPosts.map(post => {
      const slug = post.slug;
      const lastmod = post.frontmatter.updatedDate || post.frontmatter.pubDate;
      
      return {
        loc: `${baseUrl}/blog/${slug}`,
        lastmod: new Date(lastmod).toISOString().split('T')[0],
        changefreq: 'monthly' as const,
        priority: 0.8
      };
    });

    // Generate tag URLs
    const allTags = Array.from(new Set(
      publishedPosts
        .flatMap(post => post.frontmatter.tags || [])
        .filter(Boolean)
    ));

    const tagUrls: SitemapUrl[] = allTags.map(tag => ({
      loc: `${baseUrl}/tags/${tag}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly' as const,
      priority: 0.6
    }));

    console.log(chalk.gray(`Generated ${tagUrls.length} tag pages`));

    // Combine all URLs
    const allUrls = [...staticPages, ...blogPostUrls, ...tagUrls];
    
    // Sort by priority (descending) then by URL
    allUrls.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.loc.localeCompare(b.loc);
    });

    // Generate XML content
    const sitemapXML = generateSitemapXML(allUrls);
    const robotsTxt = generateRobotsTxt();

    // Write sitemap.xml to both dist and public directories
    const distPath = path.join(process.cwd(), 'dist', 'sitemap.xml');
    const publicPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    
    // Ensure directories exist
    fs.mkdirSync(path.dirname(distPath), { recursive: true });
    fs.mkdirSync(path.dirname(publicPath), { recursive: true });
    
    // Write sitemap files
    fs.writeFileSync(distPath, sitemapXML);
    fs.writeFileSync(publicPath, sitemapXML);
    
    // Write robots.txt to both directories
    const distRobotsPath = path.join(process.cwd(), 'dist', 'robots.txt');
    const publicRobotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    
    fs.writeFileSync(distRobotsPath, robotsTxt);
    fs.writeFileSync(publicRobotsPath, robotsTxt);

    console.log(chalk.green(`✅ Sitemap generated: ${distPath}`));
    console.log(chalk.green(`✅ Sitemap also generated in public: ${publicPath}`));
    console.log(chalk.green(`✅ Robots.txt generated: ${distRobotsPath}`));
    console.log(chalk.green(`✅ Robots.txt also generated in public: ${publicRobotsPath}`));
    
    console.log(chalk.gray(`\nSitemap contains ${allUrls.length} URLs:`));
    console.log(chalk.gray(`  • ${staticPages.length} static pages`));
    console.log(chalk.gray(`  • ${blogPostUrls.length} blog posts`));
    console.log(chalk.gray(`  • ${tagUrls.length} tag pages`));

    // Validate sitemap size
    const sitemapSize = Buffer.byteLength(sitemapXML, 'utf8');
    const maxSize = 50 * 1024 * 1024; // 50MB limit for sitemaps
    
    if (sitemapSize > maxSize) {
      console.log(chalk.yellow(`⚠️  Warning: Sitemap size (${(sitemapSize / 1024 / 1024).toFixed(2)}MB) is large. Consider splitting into multiple sitemaps.`));
    }

    if (allUrls.length > 50000) {
      console.log(chalk.yellow(`⚠️  Warning: Sitemap contains ${allUrls.length} URLs. Google recommends max 50,000 per sitemap.`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Failed to generate sitemap:'), error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.main) {
  generateSitemap();
}