#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import * as matter from 'gray-matter'
import chalk from 'chalk'

/**
 * Fix multi-line YAML descriptions in blog posts
 * Converts >- syntax to single-line format
 */
async function fixYamlDescriptions() {
  const postsDir = join(process.cwd(), 'src/posts')
  const files = await readdir(postsDir)
  const mdFiles = files.filter((f) => f.endsWith('.md'))

  let fixedCount = 0

  for (const file of mdFiles) {
    const filePath = join(postsDir, file)
    const content = await readFile(filePath, 'utf-8')

    // Check if file has multi-line description with >- syntax
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!yamlMatch) continue

    const yamlContent = yamlMatch[1]

    // Look for multi-line descriptions with >- syntax
    const multiLineDescRegex = /description:\s*>-?\s*\n((?:\s+.+\n?)+)/
    const match = yamlContent.match(multiLineDescRegex)

    if (match) {
      console.log(chalk.yellow(`Found multi-line description in ${file}`))

      // Extract the description text and clean it up
      const descLines = match[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      // Replace with single-line format
      const fixedYaml = yamlContent.replace(
        multiLineDescRegex,
        `description: '${descLines.replace(/'/g, "''")}'`
      )

      const fixedContent = content.replace(
        yamlMatch[0],
        `---\n${fixedYaml}\n---`
      )

      await writeFile(filePath, fixedContent)
      console.log(chalk.green(`✅ Fixed ${file}`))
      fixedCount++
    }
  }

  if (fixedCount > 0) {
    console.log(
      chalk.green(`\n✅ Fixed ${fixedCount} files with multi-line descriptions`)
    )
  } else {
    console.log(
      chalk.blue('\n✅ No multi-line descriptions found - all files are clean!')
    )
  }
}

// Run the fix
fixYamlDescriptions().catch(console.error)
