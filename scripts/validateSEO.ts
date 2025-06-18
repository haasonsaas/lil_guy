#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import chalk from 'chalk';
import { validateStructuredData } from '../src/utils/seo/structuredData';
import { getAllPosts } from '../src/utils/blogUtils';

interface SEOValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
  score: number;
}

interface SEOIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Validate SEO aspects of a blog post
 */
function validatePostSEO(frontmatter: Record<string, unknown>, content: string, filename: string): SEOIssue[] {
  const issues: SEOIssue[] = [];

  // Title validation
  if (!frontmatter.title || typeof frontmatter.title !== 'string') {
    issues.push({
      type: 'error',
      field: 'title',
      message: 'Title is required',
      suggestion: 'Add a descriptive title to your frontmatter'
    });
  } else {
    const titleLength = frontmatter.title.length;
    if (titleLength < 10) {
      issues.push({
        type: 'error',
        field: 'title',
        message: 'Title is too short',
        suggestion: 'Use at least 10 characters for better SEO'
      });
    } else if (titleLength > 60) {
      issues.push({
        type: 'warning',
        field: 'title',
        message: 'Title may be too long for search results',
        suggestion: 'Consider keeping titles under 60 characters'
      });
    }
  }

  // Description validation
  if (!frontmatter.description || typeof frontmatter.description !== 'string') {
    issues.push({
      type: 'error',
      field: 'description',
      message: 'Meta description is required',
      suggestion: 'Add a compelling description to improve click-through rates'
    });
  } else {
    const descLength = frontmatter.description.length;
    if (descLength < 120) {
      issues.push({
        type: 'warning',
        field: 'description',
        message: 'Description is quite short',
        suggestion: 'Aim for 120-160 characters for optimal SEO'
      });
    } else if (descLength > 160) {
      issues.push({
        type: 'warning',
        field: 'description',
        message: 'Description may be truncated in search results',
        suggestion: 'Keep descriptions under 160 characters'
      });
    }
  }

  // Tags validation
  if (!frontmatter.tags || !Array.isArray(frontmatter.tags) || frontmatter.tags.length === 0) {
    issues.push({
      type: 'warning',
      field: 'tags',
      message: 'No tags specified',
      suggestion: 'Add 3-5 relevant tags to improve discoverability'
    });
  } else {
    if (frontmatter.tags.length < 2) {
      issues.push({
        type: 'warning',
        field: 'tags',
        message: 'Very few tags',
        suggestion: 'Add 2-5 relevant tags for better categorization'
      });
    } else if (frontmatter.tags.length > 10) {
      issues.push({
        type: 'warning',
        field: 'tags',
        message: 'Too many tags',
        suggestion: 'Limit to 5-10 most relevant tags'
      });
    }
  }

  // Author validation
  if (!frontmatter.author || typeof frontmatter.author !== 'string') {
    issues.push({
      type: 'error',
      field: 'author',
      message: 'Author is required',
      suggestion: 'Add author field for proper attribution'
    });
  }

  // Publication date validation
  if (!frontmatter.pubDate) {
    issues.push({
      type: 'error',
      field: 'pubDate',
      message: 'Publication date is required',
      suggestion: 'Add pubDate in YYYY-MM-DD format'
    });
  } else {
    const pubDate = new Date(frontmatter.pubDate as string);
    if (isNaN(pubDate.getTime())) {
      issues.push({
        type: 'error',
        field: 'pubDate',
        message: 'Invalid publication date format',
        suggestion: 'Use YYYY-MM-DD format for pubDate'
      });
    } else if (pubDate > new Date()) {
      issues.push({
        type: 'warning',
        field: 'pubDate',
        message: 'Publication date is in the future',
        suggestion: 'Future-dated posts may not be visible until the date'
      });
    }
  }

  // Content length validation
  const wordCount = content.trim().split(/\s+/).length;
  if (wordCount < 300) {
    issues.push({
      type: 'warning',
      field: 'content',
      message: 'Content is quite short',
      suggestion: 'Aim for at least 300 words for better SEO value'
    });
  }

  // Heading structure validation
  const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
  const h1Count = (content.match(/^#\s+.+$/gm) || []).length;
  
  if (h1Count === 0) {
    issues.push({
      type: 'warning',
      field: 'content',
      message: 'No H1 heading found',
      suggestion: 'Add a main heading (# Title) to improve structure'
    });
  } else if (h1Count > 1) {
    issues.push({
      type: 'warning',
      field: 'content',
      message: 'Multiple H1 headings found',
      suggestion: 'Use only one H1 heading per post'
    });
  }

  if (headings.length < 2) {
    issues.push({
      type: 'warning',
      field: 'content',
      message: 'Limited heading structure',
      suggestion: 'Add more headings to improve readability and SEO'
    });
  }

  // Internal links validation
  const internalLinks = (content.match(/\[.*?\]\(\/[^)]*\)/g) || []).length;
  const externalLinks = (content.match(/\[.*?\]\(https?:\/\/[^)]*\)/g) || []).length;
  
  if (internalLinks === 0 && filename !== 'index.md') {
    issues.push({
      type: 'warning',
      field: 'content',
      message: 'No internal links found',
      suggestion: 'Add links to related posts to improve site navigation'
    });
  }

  // Image alt text validation
  const images = content.match(/!\[([^\]]*)\]\([^)]+\)/g) || [];
  const imagesWithoutAlt = images.filter(img => {
    const altMatch = img.match(/!\[([^\]]*)\]/);
    return !altMatch || !altMatch[1].trim();
  });

  if (imagesWithoutAlt.length > 0) {
    issues.push({
      type: 'warning',
      field: 'content',
      message: `${imagesWithoutAlt.length} image(s) missing alt text`,
      suggestion: 'Add descriptive alt text for all images'
    });
  }

  return issues;
}

/**
 * Calculate SEO score based on issues
 */
function calculateSEOScore(issues: SEOIssue[]): number {
  let score = 100;
  
  for (const issue of issues) {
    if (issue.type === 'error') {
      score -= 15;
    } else {
      score -= 5;
    }
  }
  
  return Math.max(0, score);
}

/**
 * Validate SEO for all posts or specific files
 */
async function validateSEO(filePaths?: string[]) {
  try {
    console.log(chalk.blue('🔍 Validating SEO compliance...\n'));

    let posts;
    let filesToCheck: string[];

    if (filePaths && filePaths.length > 0) {
      // Validate specific files
      filesToCheck = filePaths.filter(f => f.endsWith('.md') && f.includes('src/posts/'));
      console.log(chalk.gray(`Checking ${filesToCheck.length} specified files`));
    } else {
      // Validate all posts
      posts = await getAllPosts();
      filesToCheck = posts.map(post => `src/posts/${path.basename(post.id)}`);
      console.log(chalk.gray(`Checking ${filesToCheck.length} blog posts`));
    }

    const results: SEOValidationResult[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const filePath of filesToCheck) {
      const fullPath = path.resolve(filePath);
      
      if (!fs.existsSync(fullPath)) {
        console.log(chalk.yellow(`⚠️  File not found: ${filePath}`));
        continue;
      }

      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      const { data: frontmatter, content } = matter(fileContent);
      const filename = path.basename(filePath);

      const issues = validatePostSEO(frontmatter, content, filename);
      const errors = issues.filter(i => i.type === 'error');
      const warnings = issues.filter(i => i.type === 'warning');
      const score = calculateSEOScore(issues);

      results.push({
        file: filename,
        errors: errors.map(e => e.message),
        warnings: warnings.map(w => w.message),
        score
      });

      totalErrors += errors.length;
      totalWarnings += warnings.length;

      // Display results for this file
      if (issues.length > 0) {
        console.log(chalk.bold(filename) + chalk.gray(` (Score: ${score}/100)`));
        
        for (const issue of issues) {
          const icon = issue.type === 'error' ? '❌' : '⚠️ ';
          const color = issue.type === 'error' ? chalk.red : chalk.yellow;
          
          console.log(`  ${icon} ${color(issue.field)}: ${issue.message}`);
          if (issue.suggestion) {
            console.log(`     ${chalk.gray('💡 ' + issue.suggestion)}`);
          }
        }
        console.log();
      } else {
        console.log(chalk.green(`✅ ${filename} - Perfect SEO score (100/100)`));
      }
    }

    // Summary
    console.log(chalk.bold('\n📊 SEO Validation Summary:'));
    console.log(chalk.gray(`Files checked: ${results.length}`));
    console.log(chalk.red(`Total errors: ${totalErrors}`));
    console.log(chalk.yellow(`Total warnings: ${totalWarnings}`));

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    console.log(chalk.gray(`Average SEO score: ${avgScore.toFixed(1)}/100`));

    // Top and bottom performers
    const sortedResults = results.sort((a, b) => b.score - a.score);
    
    if (sortedResults.length > 0) {
      console.log(chalk.green(`\n🏆 Best performing: ${sortedResults[0].file} (${sortedResults[0].score}/100)`));
      
      if (sortedResults[sortedResults.length - 1].score < 80) {
        console.log(chalk.red(`🔧 Needs attention: ${sortedResults[sortedResults.length - 1].file} (${sortedResults[sortedResults.length - 1].score}/100)`));
      }
    }

    // Exit with error code if there are critical issues
    if (totalErrors > 0) {
      console.log(chalk.red(`\n❌ ${totalErrors} critical SEO issues found. Please fix before deploying.`));
      process.exit(1);
    } else if (totalWarnings > 0) {
      console.log(chalk.yellow(`\n⚠️  ${totalWarnings} SEO improvements suggested.`));
    } else {
      console.log(chalk.green('\n✅ All posts pass SEO validation!'));
    }

  } catch (error) {
    console.error(chalk.red('❌ SEO validation failed:'), error);
    process.exit(1);
  }
}

// CLI usage
if (import.meta.main) {
  const args = process.argv.slice(2);
  validateSEO(args.length > 0 ? args : undefined);
}

export { validateSEO, validatePostSEO, calculateSEOScore };