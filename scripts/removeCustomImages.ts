#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'
import matter from 'gray-matter'

async function removeCustomImages() {
  console.log('🧹 Removing custom images from blog posts...')

  // Find all markdown files
  const files = await glob(
    '/Users/jonathanhaas/projects/web-apps/haas-blog/src/posts/*.md'
  )
  let processedCount = 0
  let removedCount = 0

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8')
      const { data: frontmatter, content: markdownContent } = matter(content)

      // Check if this post has custom images
      if (frontmatter.image) {
        console.log(`  Removing image from: ${file.split('/').pop()}`)

        // Remove the image property
        delete frontmatter.image

        // Reconstruct the file
        const newContent = matter.stringify(markdownContent, frontmatter)
        writeFileSync(file, newContent)

        removedCount++
      }

      processedCount++
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error)
    }
  }

  console.log(`✅ Processed ${processedCount} files`)
  console.log(`🗑️  Removed custom images from ${removedCount} posts`)
  console.log('📸 All posts will now use dynamic WebP generation')
}

removeCustomImages().catch(console.error)
