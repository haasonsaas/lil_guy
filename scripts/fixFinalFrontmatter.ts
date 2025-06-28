#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

async function fixFinalFrontmatter() {
  console.log('🔧 Final frontmatter cleanup...')

  const files = await glob(
    '/Users/jonathanhaas/projects/web-apps/haas-blog/src/posts/*.md'
  )
  let fixedCount = 0

  for (const file of files) {
    try {
      let content = readFileSync(file, 'utf-8')
      let wasFixed = false

      // Fix malformed tag list with description merged
      if (content.match(/- [a-z-]+\n {2}description:/)) {
        content = content.replace(
          /(- [a-z-]+)\n {2}description:/,
          '$1\ndescription:'
        )
        wasFixed = true
        console.log(
          `  Fixed malformed tags/description: ${file.split('/').pop()}`
        )
      }

      // Fix description followed by triple dashes without newline
      if (content.match(/description: '[^']*'---/)) {
        content = content.replace(/(description: '[^']*)'---/, "$1'\n---")
        wasFixed = true
        console.log(`  Fixed description/--- merge: ${file.split('/').pop()}`)
      }

      // Fix missing newlines before title/description/other fields
      content = content.replace(
        /(\n)(title:|description:|featured:|draft:|tags:)/g,
        '\n$2'
      )

      // Remove extra blank lines in frontmatter
      content = content.replace(/---\n\n+/g, '---\n')
      content = content.replace(
        /\n\n+(title:|description:|featured:|draft:|tags:|author:|pubDate:)/g,
        '\n$1'
      )

      if (wasFixed) {
        writeFileSync(file, content)
        fixedCount++
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error)
    }
  }

  console.log(`✅ Fixed ${fixedCount} files`)
}

if (import.meta.main) {
  fixFinalFrontmatter().catch(console.error)
}
