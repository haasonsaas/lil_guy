#!/usr/bin/env bun

import { parseArgs } from "util";
import chalk from "chalk";
import { promisify } from "util";
import { exec } from "child_process";
import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Helper to call the Google AI API
async function callGoogleAI(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set in your .env file');
  }

  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(chalk.red('❌ Error calling Google AI API:'), error);
    throw error;
  }
}

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
  console.log(chalk.blue(`📝 Creating new draft for topic: "${topic}"\n`));

  try {
    // 1. Generate a blog post outline using the Google AI API
    console.log(chalk.yellow('🤖 Generating blog post outline with Google AI...'));
    const prompt = `
      You are a world-class content strategist and writer for a top-tier technical blog.
      Your audience consists of experienced product managers, senior software engineers, and technical founders. They are busy, skeptical, and value practical, actionable insights over fluff.

      Your task is to generate a compelling, well-structured blog post outline for the following topic.

      **Topic:** "${topic}"

      Please provide the following in a clear, structured JSON format. Do not include any text outside of the JSON object.

      {
        "title": "A catchy, SEO-friendly title (under 60 characters).",
        "description": "A meta description (120-160 characters) that summarizes the post and entices readers.",
        "tags": [
          "tag-one",
          "tag-two",
          "tag-three",
          "tag-four",
          "tag-five"
        ],
        "outline": "A detailed markdown outline. It must start with an H2 (##) for the introduction, have at least 3-4 main sections using H2s, and end with an H2 for the conclusion. Provide 2-3 bullet points under each heading to guide the writing process."
      }
    `;
    const generatedContent = await callGoogleAI(prompt);

    // Parse the generated content
    const parsedContent = JSON.parse(generatedContent);

    const { title, description, tags, outline } = parsedContent;

    // 2. Use the existing new-post.ts script
    console.log(chalk.yellow('\nCreating new post file...'));
    const command = `bun run scripts/new-post.ts "${title}" --tags "${tags.join(',')}" --description "${description}" --content "${outline}"`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error(chalk.red('❌ Error creating new post:'));
      console.error(stderr);
      return;
    }

    console.log(stdout);

    console.log(chalk.green('\n✅ New draft created successfully!'));

  } catch (error) {
    console.error(chalk.red('❌ An error occurred while creating the new draft:'), error);
    process.exit(1);
  }
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

    // Generate social media snippets using the Google AI API
    console.log(chalk.yellow('🤖 Generating social media snippets with Google AI...'));
    const prompt = `
      You are a savvy social media strategist for a high-traffic technical blog.
      Your audience consists of experienced product managers, senior software engineers, and technical founders on platforms like Twitter/X and LinkedIn.

      Your task is to generate a set of distinct, engaging social media snippets for the following blog post. The tone should be professional yet attention-grabbing.

      **Title:** "${frontmatter.title}"
      **Description:** "${frontmatter.description}"
      **Content Snippet:**
      ${content.substring(0, 1500)}...

      Please provide the following in a clear, structured JSON format. Do not include any text outside of the JSON object.

      {
        "twitter": "A concise and compelling tweet (under 280 characters) that includes a hook, a key insight, and a link to the post. Use 2-3 relevant hashtags.",
        "linkedin": "A more detailed and professional LinkedIn post. Start with a strong hook, provide a brief summary of the post's value, use bullet points for key takeaways, and end with a question to encourage discussion. Use 3-5 relevant hashtags."
      }
    `;
    const generatedContent = await callGoogleAI(prompt);

    // Parse the generated content
    const parsedContent = JSON.parse(generatedContent);

    console.log(chalk.green('✨ Here are your social media snippets:\n'));
    console.log(chalk.cyan('--- Twitter/X ---'));
    console.log(parsedContent.twitter + '\n');
    console.log(chalk.cyan('--- LinkedIn ---'));
    console.log(parsedContent.linkedin + '\n');

  } catch (error) {
    console.error(chalk.red('❌ An error occurred while generating social media snippets:'), error);
    process.exit(1);
  }
}

import { promisify } from "util";
import { exec } from "child_process";
import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Helper to call the Google AI API
async function callGoogleAI(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set in your .env file');
  }

  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(chalk.red('❌ Error calling Google AI API:'), error);
    throw error;
  }
}


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
