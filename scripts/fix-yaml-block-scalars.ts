#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'

const POSTS_DIR = './src/posts'

async function fixYamlBlockScalars() {
  const files = await readdir(POSTS_DIR)
  const mdFiles = files.filter((f) => f.endsWith('.md'))

  let fixedCount = 0

  for (const file of mdFiles) {
    const filePath = join(POSTS_DIR, file)
    const content = await readFile(filePath, 'utf-8')

    // Parse with gray-matter
    const { data, content: postContent } = matter(content)

    // Check if description exists
    if (data.description) {
      // Remove any YAML block scalar indicators and clean up
      let cleanDesc = data.description
        .replace(/^>-?\s*/g, '') // Remove >- or > at start
        .replace(/\n\s+/g, ' ') // Replace newlines and indentation with space
        .trim()

      // Ensure it's not too long
      if (cleanDesc.length > 160) {
        cleanDesc = cleanDesc.substring(0, 157) + '...'
      }

      // Update the frontmatter with clean description
      data.description = cleanDesc

      // Stringify back to markdown
      const updatedContent = matter.stringify(postContent, data)
      await writeFile(filePath, updatedContent)

      fixedCount++
      console.log(`✅ Fixed: ${file}`)
      console.log(`   Description: ${cleanDesc}`)
    }
  }

  console.log(
    `\n📊 Fixed ${fixedCount} files with YAML block scalar descriptions`
  )
}

// Run the script
fixYamlBlockScalars().catch(console.error)
