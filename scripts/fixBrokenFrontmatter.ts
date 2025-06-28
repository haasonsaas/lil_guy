#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

async function fixBrokenFrontmatter() {
  console.log(
    '🔧 Fixing broken frontmatter where description merged with featured...'
  )

  // Find all markdown files
  const files = await glob(
    '/Users/jonathanhaas/projects/web-apps/haas-blog/src/posts/*.md'
  )
  let processedCount = 0
  let fixedCount = 0

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8')

      // Check if this file has the broken pattern where description merged with featured
      if (content.includes(`'featured`)) {
        console.log(`  Fixing broken frontmatter: ${file.split('/').pop()}`)

        // Fix the broken frontmatter by adding proper line breaks
        const fixedContent = content.replace(
          /description: '([^']*)'featured/,
          "description: '$1'\nfeatured"
        )

        writeFileSync(file, fixedContent)
        fixedCount++
      }

      processedCount++
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error)
    }
  }

  console.log(`✅ Processed ${processedCount} files`)
  console.log(`🔧 Fixed broken frontmatter in ${fixedCount} posts`)
  console.log('📝 All frontmatter now properly formatted')
}

// Run the script
if (import.meta.main) {
  fixBrokenFrontmatter().catch(console.error)
}
