#!/usr/bin/env bun

import { parseArgs } from 'util'
import chalk from 'chalk'
import { $ } from 'bun'
import path from 'path'

/**
 * Create a new blog post with AI writing coach integration
 *
 * This combines the new-post creation with automatic writing coach analysis
 */

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      help: { type: 'boolean', short: 'h', default: false },
      draft: { type: 'boolean', short: 'd', default: true },
      coach: { type: 'boolean', short: 'c', default: true },
      watch: { type: 'boolean', short: 'w', default: false },
    },
    strict: false,
    allowPositionals: true,
  })

  if (values.help || positionals.length === 0) {
    console.log(`
${chalk.bold('Create New Blog Post with AI Writing Coach')}

${chalk.bold('Usage:')}
  bun run new-post-with-coach "Post Title" [options]

${chalk.bold('Options:')}
  -d, --draft          Create as draft (default: true)
  -c, --coach          Run writing coach after creation (default: true)
  -w, --watch          Watch file for changes with coach (default: false)
  -h, --help           Show this help message

${chalk.bold('Examples:')}
  bun run new-post-with-coach "My Amazing Post"
  bun run new-post-with-coach "Technical Deep Dive" -w   # With live coaching
  bun run new-post-with-coach "Quick Update" --no-coach  # Skip coach

${chalk.bold('Workflow:')}
  1. Creates new post with title and metadata
  2. Opens in your editor
  3. Runs AI writing coach for initial feedback
  4. Optionally watches for changes and provides real-time feedback
`)
    process.exit(0)
  }

  const title = positionals.join(' ')

  console.log(chalk.blue(`\n📝 Creating new post: "${title}"`))

  try {
    // Create the post using existing new-post script
    const result =
      await $`bun run new-post "${title}" ${values.draft ? '-d' : ''}`.quiet()

    // Extract the file path from the output
    const output = result.stdout.toString()
    const fileMatch = output.match(/Created new.*?: (.*\.md)/)

    if (!fileMatch || !fileMatch[1]) {
      console.error(chalk.red('❌ Could not determine created file path'))
      process.exit(1)
    }

    const filePath = fileMatch[1].trim()
    console.log(chalk.green(`✅ Post created: ${filePath}`))

    // Run writing coach if enabled
    if (values.coach) {
      console.log(chalk.blue('\n🤖 Running AI Writing Coach...'))
      console.log(
        chalk.gray('(This analyzes your post structure and metadata)\n')
      )

      // Give the editor time to open
      await new Promise((resolve) => setTimeout(resolve, 2000))

      try {
        if (values.watch) {
          console.log(chalk.yellow('Starting live coaching mode...'))
          console.log(
            chalk.gray('The coach will analyze your writing as you type.\n')
          )
          await $`bun run writing-coach -w "${filePath}"`
        } else {
          await $`bun run writing-coach "${filePath}"`
          console.log(
            chalk.blue(
              '\n💡 Tip: Use -w flag to enable live coaching as you write!'
            )
          )
        }
      } catch (coachError) {
        console.log(
          chalk.yellow('\n⚠️  Writing coach requires content to analyze.')
        )
        console.log(
          chalk.gray(
            'Start writing and run: bun run writing-coach -w ' + filePath
          )
        )
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error)
    process.exit(1)
  }
}

main().catch(console.error)
