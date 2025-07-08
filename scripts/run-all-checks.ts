#!/usr/bin/env bun

import { $ } from 'bun'
import chalk from 'chalk'

/**
 * Run all quality checks for the project
 * This can be run manually or as part of CI/CD
 */
async function runAllChecks() {
  console.log(chalk.blue('🔍 Running all quality checks...\n'))

  let hasErrors = false
  let hasWarnings = false

  // TypeScript check
  console.log(chalk.yellow('Running TypeScript...'))
  try {
    await $`bun run typecheck`.quiet()
    console.log(chalk.green('✅ TypeScript passed'))
  } catch (error) {
    console.log(chalk.red('❌ TypeScript failed'))
    hasErrors = true
  }
  console.log('')

  // ESLint check
  console.log(chalk.yellow('Running ESLint...'))
  try {
    await $`bun run lint`.quiet()
    console.log(chalk.green('✅ ESLint passed'))
  } catch (error) {
    console.log(chalk.red('❌ ESLint failed'))
    hasErrors = true
  }
  console.log('')

  // Prettier check
  console.log(chalk.yellow('Running Prettier...'))
  try {
    await $`bun run prettier:check`.quiet()
    console.log(chalk.green('✅ Prettier passed'))
  } catch (error) {
    console.log(chalk.yellow('⚠️  Prettier has warnings'))
    hasWarnings = true
  }
  console.log('')

  // Markdown Lint check
  console.log(chalk.yellow('Running Markdown Lint...'))
  try {
    await $`bun run lint:md`.quiet()
    console.log(chalk.green('✅ Markdown Lint passed'))
  } catch (error) {
    console.log(chalk.yellow('⚠️  Markdown Lint has warnings'))
    hasWarnings = true
  }
  console.log('')

  // Spell Check
  console.log(chalk.yellow('Running Spell Check...'))
  try {
    await $`bun run spell`.quiet()
    console.log(chalk.green('✅ Spell Check passed'))
  } catch (error) {
    console.log(chalk.yellow('⚠️  Spell Check has warnings'))
    hasWarnings = true
  }
  console.log('')

  // SEO Validation
  console.log(chalk.yellow('Running SEO Validation...'))
  try {
    await $`bun run validate:seo`.quiet()
    console.log(chalk.green('✅ SEO Validation passed'))
  } catch (error) {
    console.log(chalk.yellow('⚠️  SEO Validation has warnings'))
    hasWarnings = true
  }
  console.log('')

  // Link Check
  console.log(chalk.yellow('Running Link Check...'))
  try {
    await $`bun run check:links`.quiet()
    console.log(chalk.green('✅ Link Check passed'))
  } catch (error) {
    console.log(chalk.yellow('⚠️  Link Check has warnings'))
    hasWarnings = true
  }
  console.log('')

  // Bundle Size
  console.log(chalk.yellow('Running Bundle Size...'))
  try {
    await $`bun run check:deploy`.quiet()
    console.log(chalk.green('✅ Bundle Size passed'))
  } catch (error) {
    console.log(chalk.yellow('⚠️  Bundle Size has warnings'))
    hasWarnings = true
  }
  console.log('')

  // Analytics & Service Worker Tests
  console.log(chalk.yellow('Running Analytics & Service Worker Tests...'))
  try {
    await $`bun run test:analytics`.quiet()
    console.log(chalk.green('✅ Analytics & Service Worker Tests passed'))
  } catch (error) {
    console.log(chalk.red('❌ Analytics & Service Worker Tests failed'))
    hasErrors = true
  }
  console.log('')

  // Summary
  console.log(chalk.blue('📊 Summary:'))
  if (!hasErrors && !hasWarnings) {
    console.log(chalk.green('✅ All checks passed!'))
  } else {
    if (hasErrors) {
      console.log(chalk.red('❌ Some required checks failed'))
    }
    if (hasWarnings) {
      console.log(chalk.yellow('⚠️  Some optional checks have warnings'))
    }
  }

  // Exit with error if required checks failed
  if (hasErrors) {
    process.exit(1)
  }
}

// Run the checks
runAllChecks().catch(console.error)
