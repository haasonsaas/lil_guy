#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

async function fixMultilineDescriptions() {
  console.log('🔧 Fixing YAML multiline descriptions...')

  // Find all markdown files
  const files = await glob(
    '/Users/jonathanhaas/projects/web-apps/haas-blog/src/posts/*.md'
  )
  let processedCount = 0
  let fixedCount = 0

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8')

      // Check if this file has the problematic YAML multiline description pattern
      if (content.includes('description: >-')) {
        console.log(`  Fixing multiline description: ${file.split('/').pop()}`)

        // Fix the YAML multiline description by converting to single line
        const fixedContent = content.replace(
          /description: >-\n((?: {2}.+\n?)*)/,
          (match, multilineContent) => {
            // Extract the text content and join lines
            const descriptionText = multilineContent
              .split('\n')
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 0)
              .join(' ')
              .trim()

            // Truncate if too long
            let finalDescription = descriptionText
            if (finalDescription.length > 160) {
              const cutPoint = finalDescription.lastIndexOf(' ', 160)
              if (cutPoint > 140) {
                finalDescription = finalDescription
                  .substring(0, cutPoint)
                  .trim()
              } else {
                finalDescription =
                  finalDescription.substring(0, 157).trim() + '...'
              }
            }

            return `description: '${finalDescription}'`
          }
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
  console.log(`🔧 Fixed multiline descriptions in ${fixedCount} posts`)
  console.log('📝 All descriptions now use single-line YAML format')
}

// Run the script
if (import.meta.main) {
  fixMultilineDescriptions().catch(console.error)
}
