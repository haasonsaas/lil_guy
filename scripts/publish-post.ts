#!/usr/bin/env bun

import { parseArgs } from "util";
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import chalk from "chalk";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Parse command line arguments
const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    date: {
      type: 'string',
      short: 'd',
      description: 'Publication date (defaults to today)'
    },
    commit: {
      type: 'boolean',
      short: 'c',
      default: false,
      description: 'Create a git commit after publishing'
    },
    push: {
      type: 'boolean',
      short: 'p',
      default: false,
      description: 'Push to git after publishing (implies --commit)'
    }
  },
  strict: true,
  allowPositionals: true,
});

// Get search query for the post to publish
const query = positionals.slice(2).join(' ');
if (!query) {
  console.error(chalk.red('❌ Error: Please provide a search query to find the draft post'));
  console.error('Usage: bun run publish-post "post title or keyword" [-d date] [-c] [-p]');
  console.error('\nOptions:');
  console.error('  -d, --date     Publication date (YYYY-MM-DD, defaults to today)');
  console.error('  -c, --commit   Create a git commit after publishing');
  console.error('  -p, --push     Push to git after publishing (implies --commit)');
  process.exit(1);
}

interface DraftPost {
  file: string;
  title: string;
  description: string;
  tags: string[];
  match: number;
}

// Parse frontmatter from markdown
function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]+)$/);
  if (!match) return { frontmatter: {}, body: content };
  
  const frontmatterText = match[1];
  const body = match[2];
  const frontmatter: Record<string, unknown> = {};
  
  // Simple YAML parser for frontmatter
  const lines = frontmatterText.split('\n');
  let currentKey = '';
  let inArray = false;
  
  for (const line of lines) {
    if (line.match(/^[a-zA-Z]+:/)) {
      const [key, ...valueParts] = line.split(':');
      currentKey = key.trim();
      const value = valueParts.join(':').trim();
      
      if (value) {
        // Handle boolean strings
        if (value === 'true' || value === '"true"') {
          frontmatter[currentKey] = true;
        } else if (value === 'false' || value === '"false"') {
          frontmatter[currentKey] = false;
        } else {
          frontmatter[currentKey] = value.replace(/^["']|["']$/g, '');
        }
      } else {
        inArray = true;
        frontmatter[currentKey] = [];
      }
    } else if (inArray && line.trim().startsWith('-')) {
      const value = line.trim().substring(1).trim().replace(/^["']|["']$/g, '');
      if (Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey].push(value);
      }
    } else if (line.trim() && !line.trim().startsWith('-')) {
      inArray = false;
    }
  }
  
  return { frontmatter, body };
}

// Calculate match score
function calculateMatchScore(title: string, content: string, query: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  let score = 0;
  
  // Exact title match
  if (lowerTitle === lowerQuery) score += 100;
  // Title contains query
  else if (lowerTitle.includes(lowerQuery)) score += 50;
  
  // Count occurrences in content
  const contentMatches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
  score += contentMatches * 2;
  
  return score;
}

// Find draft posts matching the query
async function findDraftPosts(query: string): Promise<DraftPost[]> {
  const postsDir = join(process.cwd(), 'src', 'posts');
  const files = await readdir(postsDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  const drafts: DraftPost[] = [];
  
  for (const file of mdFiles) {
    const filepath = join(postsDir, file);
    const content = await readFile(filepath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    
    // Skip if not a draft
    if (!frontmatter.draft) continue;
    
    const title = frontmatter.title || 'Untitled';
    const matchScore = calculateMatchScore(title, body, query);
    
    if (matchScore > 0) {
      drafts.push({
        file,
        title,
        description: frontmatter.description || '',
        tags: frontmatter.tags || [],
        match: matchScore
      });
    }
  }
  
  // Sort by match score
  return drafts.sort((a, b) => b.match - a.match);
}

// Update frontmatter to publish
function updateFrontmatter(content: string, pubDate: string): string {
  // First, parse the frontmatter properly
  const frontmatterMatch = content.match(/^(---\r?\n)([\s\S]+?)(\r?\n---\r?\n)([\s\S]*)$/);
  if (!frontmatterMatch) {
    console.error('❌ Could not parse frontmatter');
    return content;
  }

  const [, startDelim, frontmatterContent, endDelim, body] = frontmatterMatch;
  
  // Process frontmatter line by line
  const lines = frontmatterContent.split(/\r?\n/);
  const updatedLines: string[] = [];
  let foundDraft = false;
  let foundPubDate = false;

  for (const line of lines) {
    if (line.match(/^\s*draft:\s*/)) {
      updatedLines.push('draft: false');
      foundDraft = true;
    } else if (line.match(/^\s*pubDate:\s*/)) {
      updatedLines.push(`pubDate: "${pubDate}"`);
      foundPubDate = true;
    } else {
      updatedLines.push(line);
    }
  }

  // Add pubDate if it wasn't found
  if (!foundPubDate) {
    // Find a good place to insert pubDate (after author or at the beginning)
    let insertIndex = 0;
    for (let i = 0; i < updatedLines.length; i++) {
      if (updatedLines[i].match(/^\s*author:\s*/) || updatedLines[i].match(/^\s*title:\s*/)) {
        insertIndex = i + 1;
        break;
      }
    }
    updatedLines.splice(insertIndex, 0, `pubDate: "${pubDate}"`);
  }

  // Reconstruct the file
  return startDelim + updatedLines.join('\n') + endDelim + body;
}

// Main publish function
async function publishPost() {
  // Find matching drafts
  const drafts = await findDraftPosts(query);
  
  if (drafts.length === 0) {
    console.log(chalk.yellow('No draft posts found matching your query.'));
    console.log(chalk.gray('\nTip: Use "bun run search" to find draft posts.'));
    return;
  }
  
  // If multiple matches, show them and ask user to be more specific
  if (drafts.length > 1) {
    console.log(chalk.yellow(`Found ${drafts.length} draft posts matching "${query}":\n`));
    
    drafts.slice(0, 5).forEach((draft, index) => {
      console.log(chalk.cyan(`${index + 1}. ${draft.title}`));
      console.log(chalk.gray(`   📄 ${draft.file}`));
      if (draft.description) {
        console.log(chalk.gray(`   📝 ${draft.description.substring(0, 80)}...`));
      }
      console.log();
    });
    
    console.log(chalk.yellow('Please be more specific with your search query.'));
    return;
  }
  
  // Single match - proceed with publishing
  const draft = drafts[0];
  const filepath = join(process.cwd(), 'src', 'posts', draft.file);
  
  console.log(chalk.green(`\n📝 Publishing: ${draft.title}`));
  console.log(chalk.gray(`   File: ${draft.file}`));
  
  // Determine publication date
  const pubDate = values.date || new Date().toISOString().split('T')[0];
  console.log(chalk.gray(`   Date: ${pubDate}`));
  
  // Read and update the file
  const content = await readFile(filepath, 'utf-8');
  const updatedContent = updateFrontmatter(content, pubDate);
  
  // Write the updated file
  await writeFile(filepath, updatedContent);
  console.log(chalk.green('\n✅ Post published successfully!'));
  
  // Git operations if requested
  if (values.commit || values.push) {
    console.log(chalk.blue('\n🔄 Creating git commit...'));
    
    try {
      // Stage the file
      await execAsync(`git add "${filepath}"`);
      
      // Create commit
      const commitMessage = `publish: ${draft.title}\n\n- Convert draft to published post\n- Set publication date to ${pubDate}`;
      await execAsync(`git commit -m "${commitMessage}"`);
      
      console.log(chalk.green('✅ Git commit created'));
      
      // Push if requested
      if (values.push) {
        console.log(chalk.blue('\n🚀 Pushing to remote...'));
        await execAsync('git push');
        console.log(chalk.green('✅ Pushed to remote repository'));
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Git operation failed:'), error);
    }
  }
  
  // Show next steps
  console.log(chalk.cyan('\n📋 Next steps:'));
  if (!values.commit && !values.push) {
    console.log(chalk.gray('   - Review the changes'));
    console.log(chalk.gray('   - Run "git add -A && git commit -m "publish: post title"'));
    console.log(chalk.gray('   - Push to deploy: "git push"'));
  } else if (!values.push) {
    console.log(chalk.gray('   - Push to deploy: "git push"'));
  } else {
    console.log(chalk.gray('   - Your post will be live after the deployment completes!'));
  }
  
  // RSS feed reminder
  console.log(chalk.yellow('\n💡 Note: RSS feed will be regenerated during the next build.'));
}

// Run the publish function
publishPost().catch(console.error);