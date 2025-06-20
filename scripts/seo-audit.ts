#!/usr/bin/env bun

import { parseArgs } from "util";
import chalk from "chalk";

// Parse command line arguments
const { values } = parseArgs({
  args: Bun.argv,
  options: {
    url: {
      type: 'string',
      short: 'u',
      default: 'https://haasonsaas.com',
      description: 'Website URL to audit'
    },
    format: {
      type: 'string',
      short: 'f',
      default: 'table',
      description: 'Output format (table, json, markdown)'
    },
    depth: {
      type: 'string',
      short: 'd',
      default: 'basic',
      description: 'Audit depth (basic, comprehensive)'
    }
  },
  strict: true,
  allowPositionals: true,
});

interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  fix?: string;
}

interface SEOAuditResult {
  url: string;
  timestamp: string;
  score: number;
  issues: SEOIssue[];
  recommendations: string[];
  strengths: string[];
  stats: {
    totalPages: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

// Fetch and analyze a webpage
async function analyzePage(url: string): Promise<{ content: string; headers: Headers }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SEO-Audit-Bot/1.0 (https://haasonsaas.com/)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    return { content, headers: response.headers };
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error}`);
  }
}

// Extract meta information from HTML
function extractMetaInfo(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const descriptionMatch = html.match(/<meta[^>]*name=['"]description['"][^>]*content=['"]([^'"]*)['"]/i);
  const keywordsMatch = html.match(/<meta[^>]*name=['"]keywords['"][^>]*content=['"]([^'"]*)['"]/i);
  const canonicalMatch = html.match(/<link[^>]*rel=['"]canonical['"][^>]*href=['"]([^'"]*)['"]/i);
  const robotsMatch = html.match(/<meta[^>]*name=['"]robots['"][^>]*content=['"]([^'"]*)['"]/i);
  
  // Open Graph tags
  const ogTitleMatch = html.match(/<meta[^>]*property=['"]og:title['"][^>]*content=['"]([^'"]*)['"]/i);
  const ogDescriptionMatch = html.match(/<meta[^>]*property=['"]og:description['"][^>]*content=['"]([^'"]*)['"]/i);
  const ogImageMatch = html.match(/<meta[^>]*property=['"]og:image['"][^>]*content=['"]([^'"]*)['"]/i);
  
  // Twitter Cards
  const twitterCardMatch = html.match(/<meta[^>]*name=['"]twitter:card['"][^>]*content=['"]([^'"]*)['"]/i);
  const twitterTitleMatch = html.match(/<meta[^>]*name=['"]twitter:title['"][^>]*content=['"]([^'"]*)['"]/i);
  const twitterDescriptionMatch = html.match(/<meta[^>]*name=['"]twitter:description['"][^>]*content=['"]([^'"]*)['"]/i);
  
  // Structured data
  const jsonLdMatches = html.match(/<script[^>]*type=['"]application\/ld\+json['"][^>]*>([^<]*)<\/script>/gi);
  
  // Headings
  const h1Matches = html.match(/<h1[^>]*>([^<]*)<\/h1>/gi);
  const h2Matches = html.match(/<h2[^>]*>([^<]*)<\/h2>/gi);
  
  // Images without alt text
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const imagesWithoutAlt = imgMatches.filter(img => !img.match(/alt=['"][^'"]*['"]/i));
  
  // Links
  const linkMatches = html.match(/<a[^>]*href=['"]([^'"]*)['"]/gi) || [];
  const externalLinks = linkMatches.filter(link => {
    const hrefMatch = link.match(/href=['"]([^'"]*)['"]/i);
    if (!hrefMatch) return false;
    const href = hrefMatch[1];
    return href.startsWith('http') && !href.includes('haasonsaas.com');
  });
  
  return {
    title: titleMatch?.[1]?.trim(),
    description: descriptionMatch?.[1]?.trim(),
    keywords: keywordsMatch?.[1]?.trim(),
    canonical: canonicalMatch?.[1]?.trim(),
    robots: robotsMatch?.[1]?.trim(),
    ogTitle: ogTitleMatch?.[1]?.trim(),
    ogDescription: ogDescriptionMatch?.[1]?.trim(),
    ogImage: ogImageMatch?.[1]?.trim(),
    twitterCard: twitterCardMatch?.[1]?.trim(),
    twitterTitle: twitterTitleMatch?.[1]?.trim(),
    twitterDescription: twitterDescriptionMatch?.[1]?.trim(),
    jsonLd: jsonLdMatches?.length || 0,
    h1Count: h1Matches?.length || 0,
    h2Count: h2Matches?.length || 0,
    imagesWithoutAlt: imagesWithoutAlt.length,
    totalImages: imgMatches.length,
    externalLinks: externalLinks.length,
    totalLinks: linkMatches.length
  };
}

// Perform SEO audit
async function performAudit(baseUrl: string): Promise<SEOAuditResult> {
  const issues: SEOIssue[] = [];
  const recommendations: string[] = [];
  const strengths: string[] = [];
  
  console.log(chalk.blue(`🔍 Auditing ${baseUrl}...`));
  
  // Test main page
  const { content, headers } = await analyzePage(baseUrl);
  const meta = extractMetaInfo(content);
  
  // Title analysis
  if (!meta.title) {
    issues.push({
      type: 'error',
      category: 'Title',
      title: 'Missing page title',
      description: 'The page is missing a <title> tag',
      impact: 'high',
      fix: 'Add a descriptive <title> tag'
    });
  } else if (meta.title.length < 30) {
    issues.push({
      type: 'warning',
      category: 'Title',
      title: 'Title too short',
      description: `Title is ${meta.title.length} characters (recommended: 30-60)`,
      impact: 'medium',
      fix: 'Expand title to 30-60 characters with relevant keywords'
    });
  } else if (meta.title.length > 60) {
    issues.push({
      type: 'warning',
      category: 'Title',
      title: 'Title too long',
      description: `Title is ${meta.title.length} characters (recommended: 30-60)`,
      impact: 'medium',
      fix: 'Shorten title to under 60 characters'
    });
  } else {
    strengths.push('Title length is optimal (30-60 characters)');
  }
  
  // Description analysis
  if (!meta.description) {
    issues.push({
      type: 'error',
      category: 'Meta Description',
      title: 'Missing meta description',
      description: 'The page is missing a meta description',
      impact: 'high',
      fix: 'Add a compelling meta description (150-160 characters)'
    });
  } else if (meta.description.length < 120) {
    issues.push({
      type: 'warning',
      category: 'Meta Description',
      title: 'Description too short',
      description: `Description is ${meta.description.length} characters (recommended: 150-160)`,
      impact: 'medium',
      fix: 'Expand description to 150-160 characters'
    });
  } else if (meta.description.length > 160) {
    issues.push({
      type: 'warning',
      category: 'Meta Description',
      title: 'Description too long',
      description: `Description is ${meta.description.length} characters (recommended: 150-160)`,
      impact: 'medium',
      fix: 'Shorten description to under 160 characters'
    });
  } else {
    strengths.push('Meta description length is optimal (150-160 characters)');
  }
  
  // Heading structure
  if (meta.h1Count === 0) {
    issues.push({
      type: 'error',
      category: 'Headings',
      title: 'Missing H1 tag',
      description: 'The page is missing an H1 heading',
      impact: 'high',
      fix: 'Add exactly one H1 tag with primary keyword'
    });
  } else if (meta.h1Count > 1) {
    issues.push({
      type: 'warning',
      category: 'Headings',
      title: 'Multiple H1 tags',
      description: `Found ${meta.h1Count} H1 tags (recommended: 1)`,
      impact: 'medium',
      fix: 'Use only one H1 tag per page'
    });
  } else {
    strengths.push('Single H1 tag found (good practice)');
  }
  
  if (meta.h2Count === 0) {
    issues.push({
      type: 'info',
      category: 'Headings',
      title: 'No H2 tags found',
      description: 'Consider using H2 tags for content structure',
      impact: 'low',
      fix: 'Add H2 tags to break up content sections'
    });
  } else {
    strengths.push(`Good heading structure with ${meta.h2Count} H2 tags`);
  }
  
  // Image optimization
  if (meta.imagesWithoutAlt > 0) {
    issues.push({
      type: 'warning',
      category: 'Images',
      title: 'Images missing alt text',
      description: `${meta.imagesWithoutAlt} of ${meta.totalImages} images missing alt text`,
      impact: 'medium',
      fix: 'Add descriptive alt text to all images for accessibility'
    });
  } else if (meta.totalImages > 0) {
    strengths.push('All images have alt text');
  }
  
  // Open Graph
  if (!meta.ogTitle || !meta.ogDescription || !meta.ogImage) {
    const missing = [];
    if (!meta.ogTitle) missing.push('og:title');
    if (!meta.ogDescription) missing.push('og:description');
    if (!meta.ogImage) missing.push('og:image');
    
    issues.push({
      type: 'warning',
      category: 'Social Media',
      title: 'Incomplete Open Graph tags',
      description: `Missing: ${missing.join(', ')}`,
      impact: 'medium',
      fix: 'Add complete Open Graph tags for better social media sharing'
    });
  } else {
    strengths.push('Complete Open Graph tags found');
  }
  
  // Twitter Cards
  if (!meta.twitterCard) {
    issues.push({
      type: 'info',
      category: 'Social Media',
      title: 'Missing Twitter Card',
      description: 'No Twitter Card meta tag found',
      impact: 'low',
      fix: 'Add Twitter Card meta tags for better Twitter sharing'
    });
  } else {
    strengths.push('Twitter Card meta tags found');
  }
  
  // Structured data
  if (meta.jsonLd === 0) {
    issues.push({
      type: 'info',
      category: 'Structured Data',
      title: 'No structured data found',
      description: 'Consider adding JSON-LD structured data',
      impact: 'low',
      fix: 'Add relevant schema.org structured data'
    });
  } else {
    strengths.push(`Structured data found (${meta.jsonLd} JSON-LD blocks)`);
  }
  
  // Canonical URL
  if (!meta.canonical) {
    issues.push({
      type: 'warning',
      category: 'Technical SEO',
      title: 'Missing canonical URL',
      description: 'No canonical link tag found',
      impact: 'medium',
      fix: 'Add canonical link tag to prevent duplicate content issues'
    });
  } else {
    strengths.push('Canonical URL specified');
  }
  
  // Check additional pages if comprehensive audit
  let totalPages = 1;
  if (values.depth === 'comprehensive') {
    console.log(chalk.gray('📄 Checking additional pages...'));
    
    const pagesToCheck = [
      '/blog',
      '/about',
      '/agents',
      '/sitemap.xml',
      '/robots.txt'
    ];
    
    for (const path of pagesToCheck) {
      try {
        const pageUrl = `${baseUrl}${path}`;
        await analyzePage(pageUrl);
        totalPages++;
      } catch (error) {
        if (path === '/sitemap.xml' || path === '/robots.txt') {
          issues.push({
            type: 'warning',
            category: 'Technical SEO',
            title: `Missing ${path}`,
            description: `${path} is not accessible`,
            impact: 'medium',
            fix: `Create and configure ${path}`
          });
        }
      }
    }
  }
  
  // Check robots.txt specifically
  try {
    await analyzePage(`${baseUrl}/robots.txt`);
    strengths.push('Robots.txt file found');
  } catch (error) {
    issues.push({
      type: 'warning',
      category: 'Technical SEO',
      title: 'Missing robots.txt',
      description: 'robots.txt file not found',
      impact: 'medium',
      fix: 'Create robots.txt file with sitemap reference'
    });
  }
  
  // Check sitemap.xml
  try {
    await analyzePage(`${baseUrl}/sitemap.xml`);
    strengths.push('XML sitemap found');
  } catch (error) {
    issues.push({
      type: 'warning',
      category: 'Technical SEO',
      title: 'Missing XML sitemap',
      description: 'sitemap.xml file not found',
      impact: 'medium',
      fix: 'Create and submit XML sitemap to search engines'
    });
  }
  
  // Generate recommendations
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  
  if (errorCount > 0) {
    recommendations.push('Fix critical errors immediately (missing titles, descriptions, H1 tags)');
  }
  if (warningCount > 3) {
    recommendations.push('Address warning-level issues to improve SEO performance');
  }
  if (meta.externalLinks > 0) {
    recommendations.push('Consider adding rel="nofollow" to external links where appropriate');
  }
  if (!meta.keywords && meta.description) {
    recommendations.push('Research and target specific keywords for better ranking');
  }
  if (values.depth === 'basic') {
    recommendations.push('Run comprehensive audit with --depth=comprehensive for full analysis');
  }
  
  // Calculate score
  const maxPoints = 100;
  let score = maxPoints;
  
  issues.forEach(issue => {
    switch (issue.impact) {
      case 'high':
        score -= 15;
        break;
      case 'medium':
        score -= 8;
        break;
      case 'low':
        score -= 3;
        break;
    }
  });
  
  score = Math.max(0, score);
  
  return {
    url: baseUrl,
    timestamp: new Date().toISOString(),
    score,
    issues,
    recommendations,
    strengths,
    stats: {
      totalPages,
      errorCount: issues.filter(i => i.type === 'error').length,
      warningCount: issues.filter(i => i.type === 'warning').length,
      infoCount: issues.filter(i => i.type === 'info').length
    }
  };
}

// Format issue for display
function formatIssue(issue: SEOIssue): string {
  const typeColors = {
    'error': chalk.red,
    'warning': chalk.yellow,
    'info': chalk.blue
  };
  
  const impactColors = {
    'high': chalk.red,
    'medium': chalk.yellow,
    'low': chalk.gray
  };
  
  const typeIcon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
  const color = typeColors[issue.type];
  
  return `${typeIcon} ${color(issue.title)} ${impactColors[issue.impact](`(${issue.impact} impact)`)}`;
}

// Generate table format report
function generateTableReport(audit: SEOAuditResult): void {
  console.log(chalk.bold.blue('\n🔍 SEO Audit Report'));
  console.log(chalk.gray('═'.repeat(60)));
  
  // Score and overview
  const scoreColor = audit.score >= 80 ? chalk.green : audit.score >= 60 ? chalk.yellow : chalk.red;
  console.log(chalk.bold('\n📊 Overall Score'));
  console.log(`${scoreColor(audit.score.toString())}/100 ${getScoreEmoji(audit.score)}`);
  console.log(`${chalk.cyan('URL:')} ${chalk.gray(audit.url)}`);
  console.log(`${chalk.cyan('Pages Analyzed:')} ${chalk.white(audit.stats.totalPages)}`);
  console.log(`${chalk.cyan('Timestamp:')} ${chalk.gray(new Date(audit.timestamp).toLocaleString())}`);
  
  // Issues breakdown
  if (audit.issues.length > 0) {
    console.log(chalk.bold('\n🚨 Issues Found'));
    console.log(chalk.gray('─'.repeat(50)));
    
    const issuesByCategory = audit.issues.reduce((acc, issue) => {
      if (!acc[issue.category]) acc[issue.category] = [];
      acc[issue.category].push(issue);
      return acc;
    }, {} as Record<string, SEOIssue[]>);
    
    Object.entries(issuesByCategory).forEach(([category, issues]) => {
      console.log(chalk.bold(`\n${category}:`));
      issues.forEach(issue => {
        console.log(`  ${formatIssue(issue)}`);
        console.log(`  ${chalk.gray('→')} ${chalk.gray(issue.description)}`);
        if (issue.fix) {
          console.log(`  ${chalk.blue('💡')} ${chalk.blue(issue.fix)}`);
        }
        console.log();
      });
    });
  }
  
  // Strengths
  if (audit.strengths.length > 0) {
    console.log(chalk.bold('\n✅ Strengths'));
    console.log(chalk.gray('─'.repeat(50)));
    audit.strengths.forEach(strength => {
      console.log(`${chalk.green('✓')} ${chalk.gray(strength)}`);
    });
  }
  
  // Recommendations
  if (audit.recommendations.length > 0) {
    console.log(chalk.bold('\n💡 Recommendations'));
    console.log(chalk.gray('─'.repeat(50)));
    audit.recommendations.forEach((rec, index) => {
      console.log(`${chalk.blue((index + 1).toString())}. ${chalk.gray(rec)}`);
    });
  }
  
  // Summary stats
  console.log(chalk.bold('\n📈 Issue Summary'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`${chalk.red('Errors:')} ${audit.stats.errorCount}`);
  console.log(`${chalk.yellow('Warnings:')} ${audit.stats.warningCount}`);
  console.log(`${chalk.blue('Info:')} ${audit.stats.infoCount}`);
  
  console.log(chalk.gray('\n🔗 Run with --format=json for raw data'));
  console.log(chalk.gray('🚀 Run with --depth=comprehensive for full site audit'));
  console.log();
}

// Generate JSON format report
function generateJsonReport(audit: SEOAuditResult): void {
  console.log(JSON.stringify(audit, null, 2));
}

// Generate markdown format report
function generateMarkdownReport(audit: SEOAuditResult): void {
  console.log('# 🔍 SEO Audit Report\n');
  console.log(`**URL:** ${audit.url}`);
  console.log(`**Score:** ${audit.score}/100 ${getScoreEmoji(audit.score)}`);
  console.log(`**Date:** ${new Date(audit.timestamp).toLocaleString()}`);
  console.log(`**Pages Analyzed:** ${audit.stats.totalPages}\n`);
  
  if (audit.issues.length > 0) {
    console.log('## 🚨 Issues Found\n');
    
    const issuesByCategory = audit.issues.reduce((acc, issue) => {
      if (!acc[issue.category]) acc[issue.category] = [];
      acc[issue.category].push(issue);
      return acc;
    }, {} as Record<string, SEOIssue[]>);
    
    Object.entries(issuesByCategory).forEach(([category, issues]) => {
      console.log(`### ${category}\n`);
      issues.forEach(issue => {
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} **${issue.title}** _(${issue.impact} impact)_`);
        console.log(`- ${issue.description}`);
        if (issue.fix) {
          console.log(`- **Fix:** ${issue.fix}`);
        }
        console.log();
      });
    });
  }
  
  if (audit.strengths.length > 0) {
    console.log('## ✅ Strengths\n');
    audit.strengths.forEach(strength => {
      console.log(`- ${strength}`);
    });
    console.log();
  }
  
  if (audit.recommendations.length > 0) {
    console.log('## 💡 Recommendations\n');
    audit.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log();
  }
  
  console.log('## 📊 Summary\n');
  console.log(`- **Errors:** ${audit.stats.errorCount}`);
  console.log(`- **Warnings:** ${audit.stats.warningCount}`);
  console.log(`- **Info:** ${audit.stats.infoCount}`);
}

function getScoreEmoji(score: number): string {
  if (score >= 90) return '🏆';
  if (score >= 80) return '🎯';
  if (score >= 70) return '👍';
  if (score >= 60) return '⚠️';
  return '🚨';
}

// Main function
async function runSEOAudit() {
  const url = values.url || 'https://haasonsaas.com';
  
  try {
    const audit = await performAudit(url);
    
    switch (values.format) {
      case 'json':
        generateJsonReport(audit);
        break;
      case 'markdown':
        generateMarkdownReport(audit);
        break;
      case 'table':
      default:
        generateTableReport(audit);
        break;
    }
  } catch (error) {
    console.error(chalk.red('❌ SEO audit failed:'), error);
    process.exit(1);
  }
}

// Run the audit
runSEOAudit().catch(console.error);