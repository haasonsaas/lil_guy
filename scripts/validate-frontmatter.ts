#!/usr/bin/env bun

import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import chalk from 'chalk'

interface ValidationResult {
  file: string
  errors: string[]
  warnings: string[]
}

/**
 * Validate blog post frontmatter
 * Ensures proper formatting and prevents common issues
 */
export async function validateFrontmatter(files?: string[]): Promise<boolean> {
  const postsDir = join(process.cwd(), 'src/posts')

  let mdFiles: string[]
  if (files && files.length > 0) {
    // Filter to only markdown files in posts directory
    mdFiles = files
      .filter((f) => f.includes('src/posts/') && f.endsWith('.md'))
      .map((f) => f.split('/').pop()!)
  } else {
    const allFiles = await readdir(postsDir)
    mdFiles = allFiles.filter((f) => f.endsWith('.md'))
  }

  const results: ValidationResult[] = []

  for (const file of mdFiles) {
    const filePath = join(postsDir, file)
    const errors: string[] = []
    const warnings: string[] = []

    let content: string
    try {
      content = await readFile(filePath, 'utf-8')
    } catch (e) {
      // File might have been deleted
      continue
    }

    try {
      const { data, content: postContent } = matter(content)

      // Check for multi-line descriptions
      const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/)
      if (yamlMatch) {
        const yamlContent = yamlMatch[1]
        if (
          yamlContent.includes('description: >') ||
          yamlContent.includes('description: |')
        ) {
          errors.push(
            'Multi-line YAML description detected (use single-line format)'
          )
        }
      }

      // Check required fields
      if (!data.title) errors.push('Missing required field: title')
      if (!data.author) errors.push('Missing required field: author')
      if (!data.pubDate) errors.push('Missing required field: pubDate')
      if (!data.description) errors.push('Missing required field: description')

      // Check description length
      if (data.description && data.description.length > 160) {
        warnings.push(
          `Description too long (${data.description.length} chars, max 160)`
        )
      }

      // Check for draft posts with minimal content
      const wordCount = postContent
        .split(/\s+/)
        .filter((word) => word.length > 0).length
      const readingTime = Math.ceil(wordCount / 200) // 200 words per minute

      if (readingTime < 1) {
        errors.push(
          `Post has less than 1 minute of content (${wordCount} words) - should be deleted or expanded`
        )
      } else if (readingTime <= 3) {
        warnings.push(
          `Post has only ${readingTime} minutes of content (${wordCount} words) - consider expanding`
        )
      }

      // Check date format
      if (data.pubDate) {
        const dateStr = data.pubDate.toString()
        if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          errors.push('pubDate should be in YYYY-MM-DD format')
        }
      }

      if (errors.length > 0 || warnings.length > 0) {
        results.push({ file, errors, warnings })
      }
    } catch (error) {
      errors.push(`Failed to parse frontmatter: ${error}`)
      results.push({ file, errors, warnings })
    }
  }

  // Display results
  if (results.length > 0) {
    console.log(chalk.yellow('\n⚠️  Frontmatter validation issues found:\n'))

    for (const result of results) {
      console.log(chalk.blue(`📄 ${result.file}`))

      for (const error of result.errors) {
        console.log(chalk.red(`  ❌ ${error}`))
      }

      for (const warning of result.warnings) {
        console.log(chalk.yellow(`  ⚠️  ${warning}`))
      }

      console.log()
    }

    const hasErrors = results.some((r) => r.errors.length > 0)
    return !hasErrors
  } else {
    console.log(chalk.green('✅ All frontmatter validation passed!'))
    return true
  }
}

// Run validation if called directly
if (import.meta.main) {
  // Get file arguments from command line
  const files = process.argv.slice(2)
  validateFrontmatter(files).then((success) => {
    process.exit(success ? 0 : 1)
  })
}
