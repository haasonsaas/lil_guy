#!/usr/bin/env bun

import { promisify } from "util";
import { exec } from "child_process";
import chalk from "chalk";

const execAsync = promisify(exec);

async function audit() {
  console.log(chalk.blue('🔍 Auditing staged markdown files...\n'));

  try {
    const { stdout: porcelainOutput } = await execAsync('git status --porcelain');
    const stagedFiles = new Set(porcelainOutput.trim().split('\n').filter(line => line.startsWith('A ') || line.startsWith('M ')).map(line => line.split(' ').pop()));

    const { stdout: allMarkdownFilesOutput } = await execAsync("find src/posts -name '*.md'");
    const allMarkdownFiles = allMarkdownFilesOutput.trim().split('\n');

    const markdownFilesToAudit = allMarkdownFiles.filter(file => stagedFiles.has(file));

    console.log('staged files:', stagedFiles);
    console.log('all markdown files:', allMarkdownFiles);

    if (markdownFilesToAudit.length === 0) {
      console.log(chalk.green('✅ No staged markdown posts to audit.'));
      return;
    }

    console.log(chalk.yellow(`Found ${markdownFilesToAudit.length} staged markdown posts to audit:`));
    markdownFilesToAudit.forEach(file => console.log(chalk.gray(`  - ${file}`)));
    console.log('\n');

  } catch (error) {
    console.error(chalk.red('❌ An error occurred during the audit process:'), error);
    process.exit(1);
  }
}

audit();