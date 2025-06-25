#!/usr/bin/env bun

import { parseArgs } from "util";
import chalk from "chalk";

async function main() {
  const { positionals } = parseArgs({
    args: Bun.argv,
    allowPositionals: true,
  });

  const command = positionals[2];
  const args = positionals.slice(3);

  if (!command) {
    console.error(chalk.red('❌ Error: Please provide a command.'));
    console.error('Usage: bun run gemini <command> [args]');
    process.exit(1);
  }

  switch (command) {
    case 'new-draft':
      await newDraft(args.join(' '));
      break;
    case 'social':
      await social(args.join(' '));
      break;
    case 'audit':
      await audit();
      break;
    default:
      console.error(chalk.red(`❌ Error: Unknown command "${command}"`));
      process.exit(1);
  }
}

async function newDraft(topic: string) {
  console.log(chalk.blue(`📝 Creating new draft for topic: "${topic}"`));
  // TODO: Implement new draft logic
}

import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';

async function social(postSlug: string) {
  console.log(chalk.blue(`🐦 Generating social media snippets for post: "${postSlug}"\n`));

  try {
    const filePath = path.join(process.cwd(), 'src', 'posts', `${postSlug}.md`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);

    if (!frontmatter.title) {
      console.error(chalk.red('❌ Error: Post does not have a title.'));
      process.exit(1);
    }

    // This is where the magic happens. In a real-world scenario, you'd use a powerful
    // language model to generate these snippets. For this example, we'll use a template.
    const summary = frontmatter.description || content.substring(0, 150) + '...';
    const hashtags = frontmatter.tags ? frontmatter.tags.map((tag: string) => `#${tag.replace(/-/g, '')}`).join(' ') : '#blogging #tech';

    console.log(chalk.green('✨ Here are your social media snippets:\n'));

    // Twitter/X Snippet
    console.log(chalk.cyan('--- Twitter/X ---'));
    console.log(`Just published: "${frontmatter.title}"\n\n${summary}\n\nRead more: [LINK_TO_POST]\n\n${hashtags}\n`);

    // LinkedIn Snippet
    console.log(chalk.cyan('--- LinkedIn ---'));
    console.log(`New article is live: "${frontmatter.title}"\n\nI'm excited to share my latest post where I explore ${frontmatter.description ? 'the topic of ' + frontmatter.description.toLowerCase() : 'a new topic'}.\n\nKey takeaways:\n- [Key Takeaway 1]\n- [Key Takeaway 2]\n- [Key Takeaway 3]\n\nRead the full post here: [LINK_TO_POST]\n\nWhat are your thoughts?\n\n${hashtags}\n`);

  } catch (error) {
    console.error(chalk.red('❌ An error occurred while generating social media snippets:'), error);
    process.exit(1);
  }
}

import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

async function audit() {
  console.log(chalk.blue('🔍 Auditing staged markdown files...\n'));

  try {
    // Get staged markdown files
    const { stdout: stagedFilesOutput } = await execAsync('git diff --name-only --cached');
    const stagedFiles = stagedFilesOutput.trim().split('\n');
    const markdownFiles = stagedFiles.filter(file => file.endsWith('.md') && file.startsWith('src/posts/'));

    if (markdownFiles.length === 0) {
      console.log(chalk.green('✅ No staged markdown posts to audit.'));
      return;
    }

    console.log(chalk.yellow(`Found ${markdownFiles.length} staged markdown posts to audit:`));
    markdownFiles.forEach(file => console.log(chalk.gray(`  - ${file}`)));
    console.log('\n');

    let hasIssues = false;

    // Run checks
    const checks = [
      { name: 'Markdown Lint', command: `npx markdownlint-cli2 ${markdownFiles.join(' ')}` },
      { name: 'Spell Check', command: `npx cspell ${markdownFiles.join(' ')}` },
      { name: 'SEO Validation', command: `bun run scripts/validateSEO.ts ${markdownFiles.join(' ')}` },
    ];

    for (const check of checks) {
      console.log(chalk.cyan(`Running ${check.name}...`));
      try {
        const { stdout, stderr } = await execAsync(check.command);
        if (stdout) console.log(stdout);
        if (stderr) {
          console.error(stderr);
          hasIssues = true;
        }
        console.log(chalk.green(`✅ ${check.name} passed.\n`));
      } catch (error) {
        console.error(chalk.red(`❌ ${check.name} failed:`));
        const execError = error as { stdout?: string; stderr?: string };
        if (execError.stdout) console.error(execError.stdout);
        if (execError.stderr) console.error(execError.stderr);
        console.log('\n');
        hasIssues = true;
      }
    }

    if (hasIssues) {
      console.log(chalk.red('\n Audit complete. Issues found.'));
    } else {
      console.log(chalk.green('\n Audit complete. All checks passed!'));
    }

  } catch (error) {
    console.error(chalk.red('❌ An error occurred during the audit process:'), error);
    process.exit(1);
  }
}

main().catch(console.error);
