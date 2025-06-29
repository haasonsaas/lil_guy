#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import * as matter from 'gray-matter'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const postsDir = path.join(__dirname, '../src/posts')
const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'))

let totalFixes = 0

console.log('Running final YAML frontmatter fix...')

for (const file of files) {
  const filePath = path.join(postsDir, file)
  let content = fs.readFileSync(filePath, 'utf-8')
  const originalContent = content

  // Directly target the malformed strings and insert a newline
  content = content.replace(/'featured:/g, "'\nfeatured:")
  content = content.replace(/'tags:/g, "'\ntags:")
  content = content.replace(/'draft:/g, "'\ndraft:")

  if (originalContent !== content) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`Fixed: ${file}`)
    totalFixes++
  }
}

console.log(`\nFixed ${totalFixes} files.`)
