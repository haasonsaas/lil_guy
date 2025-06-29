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
    const { data, content: postContent } = matter(content)

    // Check if description exists and needs fixing
    if (data.description) {
      // Convert to single-line format
      const singleLineDesc = data.description.replace(/\n\s+/g, ' ').trim()

      // Truncate if too long
      let finalDesc = singleLineDesc
      if (singleLineDesc.length > 160) {
        finalDesc = singleLineDesc.substring(0, 157) + '...'
      }

      // Only update if changed
      if (data.description !== finalDesc) {
        data.description = finalDesc
        const updatedContent = matter.stringify(postContent, data)
        await writeFile(filePath, updatedContent)
        fixedCount++
        console.log(`✅ Fixed: ${file}`)
      }
    }
  }

  console.log(`\n📊 Fixed ${fixedCount} files with multi-line descriptions`)
}

// Run the script
fixYamlDescriptions().catch(console.error)
