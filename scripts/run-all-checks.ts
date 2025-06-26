#!/usr/bin/env bun

import { $ } from 'bun'
import chalk from 'chalk'

/**
 * Run all quality checks for the project
 * This can be run manually or as part of CI/CD
 */
async function runAllChecks() {
  console.log(chalk.blue('🔍 Running all quality checks...\n'))

  const checks = [
    {
      name: 'TypeScript',
      command: 'bun run typecheck',
      required: true,
    },
    {
      name: 'ESLint',
      command: 'bun run lint',
      required: true,
    },
    {
      name: 'Prettier',
      command: 'bun x prettier --check "src/**/*.{ts,tsx,js,jsx,json,md}"',
      required: false,
    },
    {
      name: 'Markdown Lint',
      command: 'bun run lint:md',
      required: false,
    },
    {
      name: 'Spell Check',
      command: 'bun run spell',
      required: false,
    },
    {
      name: 'SEO Validation',
      command: 'bun run validate:seo',
      required: false,
    },
    {
      name: 'Link Check',
      command: 'bun run check:links',
      required: false,
    },
    {
      name: 'Bundle Size',
      command: 'bun run check:deploy',
      required: false,
    },
  ]

  let hasErrors = false
  let hasWarnings = false

  for (const check of checks) {
    console.log(chalk.yellow(`Running ${check.name}...`))

    try {
      await $`${check.command}`.quiet()
      console.log(chalk.green(`✅ ${check.name} passed`))
    } catch (error) {
      if (check.required) {
        console.log(chalk.red(`❌ ${check.name} failed`))
        hasErrors = true
      } else {
        console.log(chalk.yellow(`⚠️  ${check.name} has warnings`))
        hasWarnings = true
      }
    }

    console.log('') // Empty line between checks
  }

  // Summary
  console.log(chalk.blue('\n📊 Summary:'))
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
