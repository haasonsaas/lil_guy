#!/usr/bin/env bun

import { readdir, readFile, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import chalk from 'chalk'

interface CleanupOptions {
  fixMultilineDescriptions: boolean
  deleteMinimalContent: boolean
  fixDateFormats: boolean
  dryRun: boolean
}

/**
 * Clean up blog posts based on various criteria
 */
async function cleanupPosts(options: CleanupOptions) {
  const postsDir = join(process.cwd(), 'src/posts')
  const files = await readdir(postsDir)
  const mdFiles = files.filter((f) => f.endsWith('.md'))

  console.log(chalk.blue(`🧹 Cleaning up ${mdFiles.length} blog posts...\n`))

  let fixedCount = 0
  let deletedCount = 0

  for (const file of mdFiles) {
    const filePath = join(postsDir, file)
    const content = await readFile(filePath, 'utf-8')
    let modified = false
    let shouldDelete = false

    try {
      const { data, content: postContent } = matter(content)

      // Check for posts with minimal content
      if (options.deleteMinimalContent) {
        const wordCount = postContent
          .split(/\s+/)
          .filter((word) => word.length > 0).length
        const readingTime = Math.ceil(wordCount / 200)

        if (readingTime < 1 || (data.draft && readingTime <= 3)) {
          console.log(
            chalk.red(
              `🗑️  ${file} - Only ${readingTime} min of content (${wordCount} words)`
            )
          )
          shouldDelete = true
        }
      }

      if (shouldDelete) {
        if (!options.dryRun) {
          await unlink(filePath)
          console.log(chalk.red(`   ✅ Deleted`))
        } else {
          console.log(chalk.yellow(`   🔍 Would delete (dry run)`))
        }
        deletedCount++
        continue
      }

      // Fix multi-line descriptions
      if (options.fixMultilineDescriptions) {
        const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/)
        if (yamlMatch) {
          const yamlContent = yamlMatch[1]
          const multiLineDescRegex = /description:\s*>-?\s*\n((?:\s+.+\n?)+)/
          const match = yamlContent.match(multiLineDescRegex)

          if (match) {
            console.log(chalk.yellow(`📝 ${file} - Has multi-line description`))

            const descLines = match[1]
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.length > 0)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim()

            const fixedYaml = yamlContent.replace(
              multiLineDescRegex,
              `description: '${descLines.replace(/'/g, "''")}'`
            )

            const fixedContent = content.replace(
              yamlMatch[0],
              `---\n${fixedYaml}\n---`
            )

            if (!options.dryRun) {
              await writeFile(filePath, fixedContent)
              console.log(chalk.green(`   ✅ Fixed`))
            } else {
              console.log(chalk.yellow(`   🔍 Would fix (dry run)`))
            }

            modified = true
            fixedCount++
          }
        }
      }

      // Fix date formats
      if (options.fixDateFormats && data.pubDate) {
        const dateStr = data.pubDate.toString()
        const isoDateMatch = dateStr.match(/^\d{4}-\d{2}-\d{2}T/)

        if (isoDateMatch) {
          console.log(chalk.yellow(`📅 ${file} - Has ISO date format`))

          const simpleDate = dateStr.split('T')[0]
          const fixedContent = content.replace(
            /pubDate:\s*['"]?\d{4}-\d{2}-\d{2}T[\d:.Z]+['"]?/,
            `pubDate: '${simpleDate}'`
          )

          if (!options.dryRun) {
            await writeFile(filePath, fixedContent)
            console.log(chalk.green(`   ✅ Fixed`))
          } else {
            console.log(chalk.yellow(`   🔍 Would fix (dry run)`))
          }

          modified = true
          fixedCount++
        }
      }
    } catch (error) {
      console.log(chalk.red(`❌ ${file} - Error: ${error}`))
    }
  }

  // Summary
  console.log(chalk.blue('\n📊 Summary:'))
  if (fixedCount > 0) {
    console.log(chalk.green(`✅ Fixed ${fixedCount} files`))
  }
  if (deletedCount > 0) {
    console.log(chalk.red(`🗑️  Deleted ${deletedCount} files`))
  }
  if (fixedCount === 0 && deletedCount === 0) {
    console.log(chalk.green('✅ All posts are clean!'))
  }

  if (options.dryRun) {
    console.log(
      chalk.yellow('\n⚠️  This was a dry run. Use --apply to make changes.')
    )
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const options: CleanupOptions = {
  fixMultilineDescriptions:
    args.includes('--fix-descriptions') || args.includes('--all'),
  deleteMinimalContent:
    args.includes('--delete-minimal') || args.includes('--all'),
  fixDateFormats: args.includes('--fix-dates') || args.includes('--all'),
  dryRun: !args.includes('--apply'),
}

if (args.length === 0 || args.includes('--help')) {
  console.log(chalk.blue('Blog Post Cleanup Utility\n'))
  console.log('Usage: bun scripts/cleanup-posts.ts [options]')
  console.log('\nOptions:')
  console.log('  --fix-descriptions  Fix multi-line YAML descriptions')
  console.log('  --delete-minimal    Delete posts with < 1 min content')
  console.log('  --fix-dates        Fix ISO date formats to simple YYYY-MM-DD')
  console.log('  --all              Apply all fixes')
  console.log('  --apply            Actually make changes (default is dry run)')
  console.log('  --help             Show this help message')
  console.log('\nExample:')
  console.log('  bun scripts/cleanup-posts.ts --all --apply')
  process.exit(0)
}

// Run cleanup
cleanupPosts(options).catch(console.error)
