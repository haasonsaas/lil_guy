#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'
import matter from 'gray-matter'

async function fixFrontmatter() {
  console.log('🔧 Fixing frontmatter validation issues...')

  // Find all markdown files
  const files = await glob(
    '/Users/jonathanhaas/projects/web-apps/haas-blog/src/posts/*.md'
  )
  let processedCount = 0
  let fixedCount = 0

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8')
      const { data: frontmatter, content: markdownContent } = matter(content)

      let wasFixed = false

      // Fix description formatting and length
      if (frontmatter.description) {
        const originalDesc = frontmatter.description

        // Convert multi-line description to single line
        let newDesc = originalDesc.replace(/\n\s*/g, ' ').trim()

        // Trim to 160 characters if too long
        if (newDesc.length > 160) {
          // Try to cut at a word boundary near 160 chars
          const cutPoint = newDesc.lastIndexOf(' ', 160)
          if (cutPoint > 140) {
            newDesc = newDesc.substring(0, cutPoint).trim()
          } else {
            // If no good word boundary, just cut at 157 chars and add ellipsis
            newDesc = newDesc.substring(0, 157).trim() + '...'
          }
        }

        if (newDesc !== originalDesc) {
          frontmatter.description = newDesc
          wasFixed = true
          console.log(`  Fixed description: ${file.split('/').pop()}`)
        }
      }

      // Fix date format (ISO to YYYY-MM-DD)
      if (frontmatter.pubDate) {
        const originalDate = frontmatter.pubDate
        let newDate = originalDate

        // Convert to string if it's a Date object
        if (typeof originalDate === 'object' && originalDate instanceof Date) {
          newDate = originalDate.toISOString().split('T')[0]
          frontmatter.pubDate = newDate
          wasFixed = true
          console.log(
            `  Fixed date format (Date object): ${file.split('/').pop()}`
          )
        }
        // Check if it's ISO format string
        else if (
          typeof originalDate === 'string' &&
          originalDate.includes('T') &&
          originalDate.includes('Z')
        ) {
          newDate = originalDate.split('T')[0]
          frontmatter.pubDate = newDate
          wasFixed = true
          console.log(
            `  Fixed date format (ISO string): ${file.split('/').pop()}`
          )
        }
      }

      // Fix tag formatting (lowercase-hyphenated)
      if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
        const originalTags = [...frontmatter.tags]
        const newTags = frontmatter.tags.map((tag: string) => {
          return tag
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
        })

        if (JSON.stringify(originalTags) !== JSON.stringify(newTags)) {
          frontmatter.tags = newTags
          wasFixed = true
          console.log(`  Fixed tags: ${file.split('/').pop()}`)
        }
      }

      // Remove unknown fields
      const knownFields = [
        'author',
        'pubDate',
        'title',
        'description',
        'featured',
        'draft',
        'tags',
      ]
      const unknownFields = Object.keys(frontmatter).filter(
        (key) => !knownFields.includes(key)
      )

      if (unknownFields.length > 0) {
        unknownFields.forEach((field) => {
          delete frontmatter[field]
        })
        wasFixed = true
        console.log(
          `  Removed unknown fields (${unknownFields.join(', ')}): ${file.split('/').pop()}`
        )
      }

      if (wasFixed) {
        // Reconstruct the file
        const newContent = matter.stringify(markdownContent, frontmatter)
        writeFileSync(file, newContent)
        fixedCount++
      }

      processedCount++
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error)
    }
  }

  console.log(`✅ Processed ${processedCount} files`)
  console.log(`🔧 Fixed frontmatter issues in ${fixedCount} posts`)
  console.log('📝 All posts now have valid frontmatter formatting')
}

// Run the script
if (import.meta.main) {
  fixFrontmatter().catch(console.error)
}
