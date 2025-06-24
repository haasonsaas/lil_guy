#!/usr/bin/env bun

import { parseArgs } from "util";
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import matter from 'gray-matter';

interface DraftAnalysis {
  slug: string;
  title: string;
  completionScore: number;
  wordCount: number;
  daysSinceDraft: number;
  missingElements: string[];
  suggestions: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedTimeToComplete: string;
}

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    format: {
      type: 'string',
      short: 'f',
      default: 'table',
    },
    sort: {
      type: 'string',
      short: 's',
      default: 'score',
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
${chalk.bold('Usage:')} bun run drafts [options]

${chalk.bold('Options:')}
  -f, --format    Output format (table, json, markdown) [default: table]
  -s, --sort      Sort by (score, age, words, priority) [default: score]
  -h, --help      Show this help message

${chalk.bold('Examples:')}
  bun run drafts                    # Show all drafts sorted by completion
  bun run drafts -s age             # Sort by age (oldest first)
  bun run drafts -f markdown        # Export as markdown
  `);
  process.exit(0);
}

async function getDrafts() {
  const postsDir = path.join(process.cwd(), 'src', 'posts');
  const files = await fs.readdir(postsDir);
  const markdownFiles = files.filter(file => file.endsWith('.md'));
  
  const drafts = [];
  
  for (const file of markdownFiles) {
    const filePath = path.join(postsDir, file);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    
    if (data.draft === true) {
      drafts.push({
        slug: file.replace('.md', ''),
        frontmatter: data,
        content
      });
    }
  }
  
  return drafts;
}

interface DraftPost {
  slug: string;
  frontmatter: {
    title?: string;
    pubDate?: string;
    description?: string;
    tags?: string[];
    draft?: boolean;
  };
  content: string;
}

function analyzeDraft(draft: DraftPost): DraftAnalysis {
  const { slug, frontmatter, content } = draft;
  const missingElements: string[] = [];
  const suggestions: string[] = [];
  
  // Calculate word count
  const plainText = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#+\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .replace(/\n+/g, ' ');
  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
  
  // Check for required frontmatter
  let score = 0;
  
  if (frontmatter.title) score += 10; else missingElements.push('title');
  if (frontmatter.description) score += 10; else missingElements.push('description');
  if (frontmatter.tags && frontmatter.tags.length > 0) score += 10; else missingElements.push('tags');
  if (frontmatter.pubDate) score += 5;
  
  // Content checks
  const hasIntro = content.includes('##') || content.length > 100;
  if (hasIntro) score += 15; else suggestions.push('Add introduction paragraph');
  
  const hasSections = (content.match(/##/g) || []).length >= 2;
  if (hasSections) score += 15; else suggestions.push('Add more sections with ## headers');
  
  const hasConclusion = content.includes('---') || content.includes('conclusion') || content.includes('summary');
  if (hasConclusion) score += 10; else suggestions.push('Add conclusion or summary');
  
  const hasCodeBlocks = content.includes('```');
  const hasLinks = content.includes('[') && content.includes('](');
  const hasBold = content.includes('**');
  
  if (hasCodeBlocks || hasLinks || hasBold) score += 10;
  else suggestions.push('Add formatting (code blocks, links, or emphasis)');
  
  // Word count scoring
  if (wordCount < 100) {
    score += 5;
    suggestions.push('Very early draft - needs substantial content');
  } else if (wordCount < 500) {
    score += 15;
    suggestions.push('Add more depth - aim for 800+ words');
  } else if (wordCount < 800) {
    score += 20;
    suggestions.push('Nearly complete - add final sections');
  } else {
    score += 25;
  }
  
  // Calculate days since draft created
  const draftDate = frontmatter.pubDate ? new Date(frontmatter.pubDate) : new Date();
  const daysSinceDraft = Math.floor((new Date().getTime() - draftDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determine priority
  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (score >= 70 && daysSinceDraft < 30) priority = 'high';
  else if (score < 40 || daysSinceDraft > 90) priority = 'low';
  
  // Estimate time to complete
  let estimatedTime = '30 min';
  if (score < 30) estimatedTime = '2-3 hours';
  else if (score < 50) estimatedTime = '1-2 hours';
  else if (score < 70) estimatedTime = '30-60 min';
  else estimatedTime = '15-30 min';
  
  // Add specific suggestions based on content
  if (wordCount < 300 && !hasCodeBlocks) {
    suggestions.push('Consider adding code examples or interactive demos');
  }
  
  if (!content.includes('?')) {
    suggestions.push('Add questions to engage readers');
  }
  
  if (frontmatter.tags && frontmatter.tags.includes('tutorial') && !hasCodeBlocks) {
    suggestions.push('Tutorials should include code examples');
  }
  
  return {
    slug,
    title: frontmatter.title || slug.replace(/-/g, ' '),
    completionScore: Math.min(score, 100),
    wordCount,
    daysSinceDraft,
    missingElements,
    suggestions: suggestions.slice(0, 3), // Top 3 suggestions
    priority,
    estimatedTimeToComplete: estimatedTime
  };
}

function sortDrafts(drafts: DraftAnalysis[], sortBy: string): DraftAnalysis[] {
  switch (sortBy) {
    case 'age':
      return drafts.sort((a, b) => b.daysSinceDraft - a.daysSinceDraft);
    case 'words':
      return drafts.sort((a, b) => a.wordCount - b.wordCount);
    case 'priority':
      {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return drafts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      }
    case 'score':
    default:
      return drafts.sort((a, b) => b.completionScore - a.completionScore);
  }
}

function formatTable(analyses: DraftAnalysis[]): void {
  console.log(chalk.bold.blue('\n📝 Draft Analysis\n'));
  
  if (analyses.length === 0) {
    console.log(chalk.yellow('No drafts found!'));
    return;
  }
  
  analyses.forEach((analysis, index) => {
    const priorityColor = {
      high: chalk.red,
      medium: chalk.yellow,
      low: chalk.gray
    }[analysis.priority];
    
    const scoreColor = analysis.completionScore >= 70 ? chalk.green :
                      analysis.completionScore >= 40 ? chalk.yellow :
                      chalk.red;
    
    console.log(chalk.bold(`${index + 1}. ${analysis.title}`));
    console.log(`   ${chalk.gray('File:')} ${analysis.slug}.md`);
    console.log(`   ${chalk.gray('Score:')} ${scoreColor(analysis.completionScore + '%')} | ${chalk.gray('Words:')} ${analysis.wordCount} | ${chalk.gray('Age:')} ${analysis.daysSinceDraft} days`);
    console.log(`   ${chalk.gray('Priority:')} ${priorityColor(analysis.priority.toUpperCase())} | ${chalk.gray('Est. Time:')} ${analysis.estimatedTimeToComplete}`);
    
    if (analysis.missingElements.length > 0) {
      console.log(`   ${chalk.red('Missing:')} ${analysis.missingElements.join(', ')}`);
    }
    
    if (analysis.suggestions.length > 0) {
      console.log(`   ${chalk.cyan('Next steps:')}`);
      analysis.suggestions.forEach(suggestion => {
        console.log(`     • ${suggestion}`);
      });
    }
    
    console.log();
  });
  
  // Summary
  const avgScore = Math.round(analyses.reduce((sum, a) => sum + a.completionScore, 0) / analyses.length);
  const totalWords = analyses.reduce((sum, a) => sum + a.wordCount, 0);
  const highPriority = analyses.filter(a => a.priority === 'high').length;
  
  console.log(chalk.bold('📊 Summary'));
  console.log(`  Total drafts: ${chalk.blue(analyses.length)}`);
  console.log(`  Average completion: ${chalk.yellow(avgScore + '%')}`);
  console.log(`  Total words in drafts: ${chalk.green(totalWords.toLocaleString())}`);
  console.log(`  High priority: ${chalk.red(highPriority)}`);
  
  // Recommendations
  console.log(chalk.bold('\n💡 Recommendations'));
  const topDraft = analyses[0];
  console.log(`  1. Finish "${chalk.cyan(topDraft.title)}" - it's ${topDraft.completionScore}% complete (${topDraft.estimatedTimeToComplete})`);
  
  const oldestDraft = [...analyses].sort((a, b) => b.daysSinceDraft - a.daysSinceDraft)[0];
  if (oldestDraft.slug !== topDraft.slug) {
    console.log(`  2. Consider archiving "${chalk.gray(oldestDraft.title)}" - it's ${oldestDraft.daysSinceDraft} days old`);
  }
  
  const quickWins = analyses.filter(a => a.completionScore >= 70 && a.wordCount >= 500);
  if (quickWins.length > 0) {
    console.log(`  3. Quick wins: ${quickWins.length} drafts are >70% complete and could ship today`);
  }
}

function formatMarkdown(analyses: DraftAnalysis[]): void {
  console.log('# Draft Analysis Report\n');
  console.log(`Generated: ${new Date().toLocaleDateString()}\n`);
  
  console.log('## Summary\n');
  console.log(`- **Total drafts**: ${analyses.length}`);
  console.log(`- **Average completion**: ${Math.round(analyses.reduce((sum, a) => sum + a.completionScore, 0) / analyses.length)}%`);
  console.log(`- **Total words**: ${analyses.reduce((sum, a) => sum + a.wordCount, 0).toLocaleString()}\n`);
  
  console.log('## Drafts by Priority\n');
  
  ['high', 'medium', 'low'].forEach(priority => {
    const priorityDrafts = analyses.filter(a => a.priority === priority);
    if (priorityDrafts.length > 0) {
      console.log(`### ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority\n`);
      
      priorityDrafts.forEach(draft => {
        console.log(`#### ${draft.title}`);
        console.log(`- **File**: \`${draft.slug}.md\``);
        console.log(`- **Completion**: ${draft.completionScore}%`);
        console.log(`- **Words**: ${draft.wordCount}`);
        console.log(`- **Age**: ${draft.daysSinceDraft} days`);
        console.log(`- **Time to complete**: ${draft.estimatedTimeToComplete}`);
        
        if (draft.suggestions.length > 0) {
          console.log('- **Next steps**:');
          draft.suggestions.forEach(s => console.log(`  - ${s}`));
        }
        console.log();
      });
    }
  });
}

async function main() {
  const drafts = await getDrafts();
  const analyses = drafts.map(analyzeDraft);
  const sorted = sortDrafts(analyses, values.sort || 'score');
  
  switch (values.format) {
    case 'json':
      console.log(JSON.stringify(sorted, null, 2));
      break;
    case 'markdown':
      formatMarkdown(sorted);
      break;
    default:
      formatTable(sorted);
  }
}

main().catch(console.error);