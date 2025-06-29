#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'

const POSTS_DIR = './src/posts'

async function fixYamlDescriptions() {
  const files = await readdir(POSTS_DIR)
  const mdFiles = files.filter((f) => f.endsWith('.md'))

  let fixedCount = 0

  for (const file of mdFiles) {
    const filePath = join(POSTS_DIR, file)
    const content = await readFile(filePath, 'utf-8')

    // Check if file has block scalar description
    if (!content.includes('description: >')) {
      continue
    }

    // Parse with gray-matter
    const { data, content: postContent } = matter(content)

    if (data.description) {
      // Clean the description
      let cleanDesc = data.description
        .replace(/^>-?\s*/g, '')
        .replace(/\n\s+/g, ' ')
        .trim()

      // Ensure it's not too long
      if (cleanDesc.length > 160) {
        cleanDesc = cleanDesc.substring(0, 157) + '...'
      }

      // Manually construct the frontmatter to avoid gray-matter reformatting
      const frontmatterLines = ['---']

      // Preserve order and format of frontmatter fields
      for (const [key, value] of Object.entries(data)) {
        if (key === 'description') {
          // Use single quotes to preserve internal quotes
          frontmatterLines.push(
            `description: '${cleanDesc.replace(/'/g, "''")}'`
          )
        } else if (key === 'tags' && Array.isArray(value)) {
          frontmatterLines.push('tags:')
          value.forEach((tag) => {
            frontmatterLines.push(`  - ${tag}`)
          })
        } else if (typeof value === 'string') {
          // Quote strings that need it
          if (
            value.includes(':') ||
            value.includes("'") ||
            value.includes('"')
          ) {
            frontmatterLines.push(`${key}: '${value.replace(/'/g, "''")}'`)
          } else {
            frontmatterLines.push(`${key}: '${value}'`)
          }
        } else if (typeof value === 'boolean') {
          frontmatterLines.push(`${key}: ${value}`)
        } else {
          frontmatterLines.push(`${key}: ${value}`)
        }
      }

      frontmatterLines.push('---')

      // Reconstruct the file
      const newContent = frontmatterLines.join('\n') + '\n' + postContent

      // Write back
      await writeFile(filePath, newContent)

      fixedCount++
      console.log(`✅ Fixed: ${file}`)
    }
  }

  console.log(
    `\n📊 Fixed ${fixedCount} files with YAML block scalar descriptions`
  )
}

// Run the script
fixYamlDescriptions().catch(console.error)
