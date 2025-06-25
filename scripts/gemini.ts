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

async function social(postSlug: string) {
  console.log(chalk.blue(`🐦 Generating social media snippets for post: "${postSlug}"`));
  // TODO: Implement social media snippet generation
}

async function audit() {
  console.log(chalk.blue('🔍 Auditing staged markdown files...'));
  // TODO: Implement audit logic
}

main().catch(console.error);
