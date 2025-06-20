#!/usr/bin/env bun
/**
 * Generate static HTML pages for OpenGraph previews
 * These pages contain meta tags for social media sharing and redirect to the actual blog post
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { existsSync } from 'fs';

const POSTS_DIR = join(process.cwd(), 'src/posts');
const OUTPUT_DIR = join(process.cwd(), 'public/og');

interface FrontMatter {
  title: string;
  description: string;
  author?: string;
  pubDate?: string;
  tags?: string[];
  draft?: boolean;
}

function generateOGHtml(slug: string, frontmatter: FrontMatter): string {
  const title = frontmatter.title || 'Untitled Post';
  const description = frontmatter.description || '';
  const author = frontmatter.author || 'Jonathan Haas';
  const pubDate = frontmatter.pubDate || new Date().toISOString();
  
  // Generate image URL matching the exact pattern from vite-blog-images-plugin.ts
  // Line 115: title.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const cleanText = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const imageUrl = `https://haasonsaas.com/generated/1200x630-${cleanText}.webp`;
  const blogUrl = `https://haasonsaas.com/blog/${slug}`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Redirect to actual blog post -->
    <meta http-equiv="refresh" content="0; url=${blogUrl}">
    <script>window.location.href = "${blogUrl}";</script>
    
    <!-- Primary Meta Tags -->
    <title>${title} | Haas on SaaS</title>
    <meta name="title" content="${title} | Haas on SaaS">
    <meta name="description" content="${description}">
    <meta name="author" content="${author}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${blogUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/webp">
    <meta property="og:site_name" content="Haas on SaaS">
    <meta property="article:author" content="${author}">
    <meta property="article:published_time" content="${pubDate}">
    ${frontmatter.tags?.map(tag => `<meta property="article:tag" content="${tag}">`).join('\n    ')}
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${blogUrl}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    <meta name="twitter:site" content="@haasonsaas">
    <meta name="twitter:creator" content="@haasonsaas">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${blogUrl}">
</head>
<body>
    <p>Redirecting to <a href="${blogUrl}">${title}</a>...</p>
</body>
</html>`;
}

async function generateOGPages() {
  try {
    // Create output directory if it doesn't exist
    if (!existsSync(OUTPUT_DIR)) {
      await mkdir(OUTPUT_DIR, { recursive: true });
    }
    
    // Read all markdown files
    const files = await readdir(POSTS_DIR);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    console.log(`📄 Generating OG preview pages for ${mdFiles.length} posts...`);
    
    let generated = 0;
    let skipped = 0;
    
    for (const file of mdFiles) {
      const filePath = join(POSTS_DIR, file);
      const fileContent = await readFile(filePath, 'utf-8');
      const { data } = matter(fileContent);
      const frontmatter = data as FrontMatter;
      
      // Skip drafts
      if (frontmatter.draft) {
        skipped++;
        continue;
      }
      
      const slug = file.replace('.md', '');
      const html = generateOGHtml(slug, frontmatter);
      const outputPath = join(OUTPUT_DIR, `${slug}.html`);
      
      await writeFile(outputPath, html, 'utf-8');
      generated++;
    }
    
    console.log(`✅ Generated ${generated} OG preview pages (${skipped} drafts skipped)`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    console.log(`\n💡 When sharing blog posts, use: https://haasonsaas.com/og/[slug].html`);
    console.log(`   Example: https://haasonsaas.com/og/building-my-blog.html`);
    
  } catch (error) {
    console.error('❌ Error generating OG pages:', error);
    process.exit(1);
  }
}

generateOGPages();