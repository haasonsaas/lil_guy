#!/usr/bin/env bun

import { parseArgs } from "util";
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import matter from 'gray-matter';

interface BlogPost {
  slug: string;
  frontmatter: {
    title: string;
    pubDate: string;
    description?: string;
    tags?: string[];
    draft?: boolean;
    author?: string;
    featured?: boolean;
  };
  content: string;
}

async function getAllPosts(): Promise<BlogPost[]> {
  const postsDir = path.join(process.cwd(), 'src', 'posts');
  const files = await fs.readdir(postsDir);
  const markdownFiles = files.filter(file => file.endsWith('.md'));
  
  const posts = await Promise.all(
    markdownFiles.map(async (file) => {
      const filePath = path.join(postsDir, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const { data, content } = matter(fileContent);
      
      return {
        slug: file.replace('.md', ''),
        frontmatter: data as BlogPost['frontmatter'],
        content
      };
    })
  );
  
  return posts.sort((a, b) => 
    new Date(b.frontmatter.pubDate).getTime() - 
    new Date(a.frontmatter.pubDate).getTime()
  );
}

interface WritingStats {
  totalPosts: number;
  totalWords: number;
  totalDrafts: number;
  publishedPosts: number;
  averageWordsPerPost: number;
  shortestPost: { title: string; words: number };
  longestPost: { title: string; words: number };
  writingStreak: number;
  longestGap: number;
  topTags: { tag: string; count: number }[];
  postsByMonth: { month: string; count: number; words: number }[];
  postsByDayOfWeek: { day: string; count: number }[];
  averagePostsPerWeek: number;
  totalReadingTime: number;
  topicDistribution: { topic: string; percentage: number }[];
}

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    period: {
      type: 'string',
      short: 'p',
      default: '30d',
    },
    format: {
      type: 'string',
      short: 'f',
      default: 'table',
    },
    help: {
      type: 'boolean',
      short: 'h',
    }
  },
  strict: true,
  allowPositionals: true,
});

if (values.help) {
  console.log(`
${chalk.bold('Usage:')} bun run stats [options]

${chalk.bold('Options:')}
  -p, --period    Time period (7d, 30d, 90d, 365d, all) [default: 30d]
  -f, --format    Output format (table, json, markdown) [default: table]
  -h, --help      Show this help message

${chalk.bold('Examples:')}
  bun run stats -p 30d              # Last 30 days stats
  bun run stats -p all -f markdown  # All time stats in markdown
  `);
  process.exit(0);
}

function parsePeriod(period: string): Date | null {
  const now = new Date();
  const match = period.match(/^(\d+)([dwmy])$/);
  
  if (period === 'all') return null;
  
  if (!match) {
    console.error(chalk.red(`Invalid period format: ${period}`));
    process.exit(1);
  }
  
  const [, num, unit] = match;
  const value = parseInt(num, 10);
  
  switch (unit) {
    case 'd':
      now.setDate(now.getDate() - value);
      break;
    case 'w':
      now.setDate(now.getDate() - value * 7);
      break;
    case 'm':
      now.setMonth(now.getMonth() - value);
      break;
    case 'y':
      now.setFullYear(now.getFullYear() - value);
      break;
  }
  
  return now;
}

function countWords(content: string): number {
  // Remove code blocks
  const withoutCode = content.replace(/```[\s\S]*?```/g, '');
  // Remove markdown formatting
  const plainText = withoutCode
    .replace(/#+\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .replace(/\n+/g, ' ');
  
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}

function calculateStreak(posts: BlogPost[]): number {
  if (posts.length === 0) return 0;
  
  const sortedPosts = posts
    .filter(p => !p.frontmatter.draft)
    .sort((a, b) => new Date(b.frontmatter.pubDate).getTime() - new Date(a.frontmatter.pubDate).getTime());
  
  if (sortedPosts.length === 0) return 0;
  
  let streak = 1;
  const today = new Date();
  const lastPost = new Date(sortedPosts[0].frontmatter.pubDate);
  
  // If last post was more than 7 days ago, streak is broken
  if ((today.getTime() - lastPost.getTime()) / (1000 * 60 * 60 * 24) > 7) {
    return 0;
  }
  
  for (let i = 1; i < sortedPosts.length; i++) {
    const currentDate = new Date(sortedPosts[i - 1].frontmatter.pubDate);
    const previousDate = new Date(sortedPosts[i].frontmatter.pubDate);
    const daysDiff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 7) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function findLongestGap(posts: BlogPost[]): number {
  const published = posts
    .filter(p => !p.frontmatter.draft)
    .sort((a, b) => new Date(a.frontmatter.pubDate).getTime() - new Date(b.frontmatter.pubDate).getTime());
  
  if (published.length < 2) return 0;
  
  let maxGap = 0;
  
  for (let i = 1; i < published.length; i++) {
    const current = new Date(published[i].frontmatter.pubDate);
    const previous = new Date(published[i - 1].frontmatter.pubDate);
    const gap = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
    maxGap = Math.max(maxGap, gap);
  }
  
  return Math.round(maxGap);
}

function getTopTags(posts: BlogPost[]): { tag: string; count: number }[] {
  const tagCounts: Record<string, number> = {};
  
  posts.forEach(post => {
    if (post.frontmatter.tags) {
      post.frontmatter.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getPostsByMonth(posts: BlogPost[]): { month: string; count: number; words: number }[] {
  const monthData: Record<string, { count: number; words: number }> = {};
  
  posts.forEach(post => {
    const date = new Date(post.frontmatter.pubDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthData[monthKey]) {
      monthData[monthKey] = { count: 0, words: 0 };
    }
    
    monthData[monthKey].count++;
    monthData[monthKey].words += countWords(post.content);
  });
  
  return Object.entries(monthData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12);
}

function getPostsByDayOfWeek(posts: BlogPost[]): { day: string; count: number }[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts: Record<string, number> = {};
  
  days.forEach(day => dayCounts[day] = 0);
  
  posts.forEach(post => {
    const date = new Date(post.frontmatter.pubDate);
    const dayName = days[date.getDay()];
    dayCounts[dayName]++;
  });
  
  return days.map(day => ({ day, count: dayCounts[day] }));
}

function getTopicDistribution(posts: BlogPost[]): { topic: string; percentage: number }[] {
  const topicMap: Record<string, string[]> = {
    'SaaS & Business': ['saas', 'startup', 'business', 'metrics', 'growth', 'pricing', 'unit-economics'],
    'Engineering': ['engineering', 'architecture', 'technical', 'development', 'code', 'programming'],
    'Leadership': ['leadership', 'management', 'team', 'hiring', 'culture'],
    'Product': ['product', 'product-management', 'features', 'user-experience'],
    'Marketing': ['marketing', 'content', 'seo', 'analytics'],
    'AI & Innovation': ['ai', 'machine-learning', 'automation', 'innovation'],
  };
  
  const topicCounts: Record<string, number> = {};
  Object.keys(topicMap).forEach(topic => topicCounts[topic] = 0);
  
  posts.forEach(post => {
    if (post.frontmatter.tags) {
      post.frontmatter.tags.forEach(tag => {
        Object.entries(topicMap).forEach(([topic, keywords]) => {
          if (keywords.some(keyword => tag.includes(keyword))) {
            topicCounts[topic]++;
          }
        });
      });
    }
  });
  
  const total = Object.values(topicCounts).reduce((sum, count) => sum + count, 0);
  
  return Object.entries(topicCounts)
    .map(([topic, count]) => ({
      topic,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

async function calculateStats(posts: BlogPost[], since: Date | null): WritingStats {
  const filteredPosts = since
    ? posts.filter(post => new Date(post.frontmatter.pubDate) >= since)
    : posts;
  
  const publishedPosts = filteredPosts.filter(p => !p.frontmatter.draft);
  const draftPosts = filteredPosts.filter(p => p.frontmatter.draft);
  
  const wordCounts = filteredPosts.map(post => ({
    title: post.frontmatter.title,
    words: countWords(post.content)
  }));
  
  const totalWords = wordCounts.reduce((sum, { words }) => sum + words, 0);
  const sortedByWords = [...wordCounts].sort((a, b) => a.words - b.words);
  
  // Calculate posts per week
  const daysSincePeriodStart = since
    ? (new Date().getTime() - since.getTime()) / (1000 * 60 * 60 * 24)
    : (posts.length > 0
        ? (new Date().getTime() - new Date(posts[posts.length - 1].frontmatter.pubDate).getTime()) / (1000 * 60 * 60 * 24)
        : 0);
  const weeks = Math.max(1, daysSincePeriodStart / 7);
  
  return {
    totalPosts: filteredPosts.length,
    totalWords,
    totalDrafts: draftPosts.length,
    publishedPosts: publishedPosts.length,
    averageWordsPerPost: filteredPosts.length > 0 ? Math.round(totalWords / filteredPosts.length) : 0,
    shortestPost: sortedByWords[0] || { title: 'N/A', words: 0 },
    longestPost: sortedByWords[sortedByWords.length - 1] || { title: 'N/A', words: 0 },
    writingStreak: calculateStreak(posts), // Use all posts for streak
    longestGap: findLongestGap(publishedPosts),
    topTags: getTopTags(filteredPosts),
    postsByMonth: getPostsByMonth(publishedPosts),
    postsByDayOfWeek: getPostsByDayOfWeek(publishedPosts),
    averagePostsPerWeek: Math.round((publishedPosts.length / weeks) * 10) / 10,
    totalReadingTime: Math.round(totalWords / 200), // 200 WPM reading speed
    topicDistribution: getTopicDistribution(filteredPosts),
  };
}

function formatTable(stats: WritingStats, period: string): void {
  console.log(chalk.bold.blue(`\n📊 Writing Statistics (${period})\n`));
  
  // Overview
  console.log(chalk.bold('📝 Overview'));
  console.log(`  Total Posts: ${chalk.green(stats.totalPosts)} (${chalk.yellow(stats.publishedPosts)} published, ${chalk.gray(stats.totalDrafts)} drafts)`);
  console.log(`  Total Words: ${chalk.green(stats.totalWords.toLocaleString())}`);
  console.log(`  Average Words/Post: ${chalk.green(stats.averageWordsPerPost.toLocaleString())}`);
  console.log(`  Total Reading Time: ${chalk.green(stats.totalReadingTime)} minutes`);
  console.log();
  
  // Productivity
  console.log(chalk.bold('⚡ Productivity'));
  console.log(`  Writing Streak: ${chalk.green(stats.writingStreak)} posts`);
  console.log(`  Average Posts/Week: ${chalk.green(stats.averagePostsPerWeek)}`);
  console.log(`  Longest Gap: ${chalk.yellow(stats.longestGap)} days`);
  console.log();
  
  // Post Lengths
  console.log(chalk.bold('📏 Post Lengths'));
  console.log(`  Shortest: "${chalk.cyan(stats.shortestPost.title)}" (${stats.shortestPost.words} words)`);
  console.log(`  Longest: "${chalk.cyan(stats.longestPost.title)}" (${stats.longestPost.words} words)`);
  console.log();
  
  // Topic Distribution
  console.log(chalk.bold('🎯 Topic Distribution'));
  stats.topicDistribution.forEach(({ topic, percentage }) => {
    const bar = '█'.repeat(Math.round(percentage / 2));
    console.log(`  ${topic.padEnd(20)} ${bar} ${percentage}%`);
  });
  console.log();
  
  // Top Tags
  console.log(chalk.bold('🏷️  Top Tags'));
  stats.topTags.slice(0, 5).forEach(({ tag, count }) => {
    console.log(`  ${chalk.cyan(tag.padEnd(25))} ${count} posts`);
  });
  console.log();
  
  // Publishing Patterns
  console.log(chalk.bold('📅 Publishing Patterns'));
  console.log('  By Day of Week:');
  stats.postsByDayOfWeek.forEach(({ day, count }) => {
    const bar = '▓'.repeat(count);
    console.log(`    ${day.padEnd(10)} ${bar} ${count}`);
  });
  console.log();
  
  // Recent Activity
  if (stats.postsByMonth.length > 0) {
    console.log(chalk.bold('📈 Recent Activity'));
    stats.postsByMonth.slice(0, 6).forEach(({ month, count, words }) => {
      const avgWords = Math.round(words / count);
      console.log(`  ${month}: ${chalk.green(count)} posts, ${chalk.blue(words.toLocaleString())} words (avg ${avgWords})`);
    });
  }
}

function formatMarkdown(stats: WritingStats, period: string): void {
  console.log(`# Writing Statistics (${period})\n`);
  
  console.log('## Overview\n');
  console.log(`- **Total Posts**: ${stats.totalPosts} (${stats.publishedPosts} published, ${stats.totalDrafts} drafts)`);
  console.log(`- **Total Words**: ${stats.totalWords.toLocaleString()}`);
  console.log(`- **Average Words/Post**: ${stats.averageWordsPerPost.toLocaleString()}`);
  console.log(`- **Total Reading Time**: ${stats.totalReadingTime} minutes\n`);
  
  console.log('## Productivity\n');
  console.log(`- **Writing Streak**: ${stats.writingStreak} posts`);
  console.log(`- **Average Posts/Week**: ${stats.averagePostsPerWeek}`);
  console.log(`- **Longest Gap**: ${stats.longestGap} days\n`);
  
  console.log('## Post Lengths\n');
  console.log(`- **Shortest**: "${stats.shortestPost.title}" (${stats.shortestPost.words} words)`);
  console.log(`- **Longest**: "${stats.longestPost.title}" (${stats.longestPost.words} words)\n`);
  
  console.log('## Topic Distribution\n');
  stats.topicDistribution.forEach(({ topic, percentage }) => {
    console.log(`- **${topic}**: ${percentage}%`);
  });
  console.log();
  
  console.log('## Top Tags\n');
  stats.topTags.slice(0, 10).forEach(({ tag, count }) => {
    console.log(`- **${tag}**: ${count} posts`);
  });
  console.log();
  
  console.log('## Recent Activity\n');
  console.log('| Month | Posts | Words | Avg Words |');
  console.log('|-------|-------|-------|-----------|');
  stats.postsByMonth.slice(0, 12).forEach(({ month, count, words }) => {
    const avgWords = Math.round(words / count);
    console.log(`| ${month} | ${count} | ${words.toLocaleString()} | ${avgWords} |`);
  });
}

async function main() {
  const periodStart = parsePeriod(values.period || '30d');
  const posts = await getAllPosts();
  const stats = await calculateStats(posts, periodStart);
  
  switch (values.format) {
    case 'json':
      console.log(JSON.stringify(stats, null, 2));
      break;
    case 'markdown':
      formatMarkdown(stats, values.period || '30d');
      break;
    default:
      formatTable(stats, values.period || '30d');
  }
}

main().catch(console.error);