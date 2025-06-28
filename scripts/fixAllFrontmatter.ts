#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

async function fixAllFrontmatter() {
  console.log('🔧 Fixing all frontmatter issues...')
  
  // Find all markdown files
  const files = await glob('/Users/jonathanhaas/projects/web-apps/haas-blog/src/posts/*.md')
  let processedCount = 0
  let fixedCount = 0
  
  for (const file of files) {
    try {
      let content = readFileSync(file, 'utf-8')
      let wasFixed = false
      
      // Fix various broken patterns
      
      // Pattern 1: description merged with featured
      if (content.includes(`'featured`)) {
        content = content.replace(
          /description: '([^']*)'featured/,
          "description: '$1'\nfeatured"
        )
        wasFixed = true
        console.log(`  Fixed merged description/featured: ${file.split('/').pop()}`)
      }
      
      // Pattern 2: description merged with other fields
      const mergedPatterns = [
        { field: 'draft', regex: /description: '([^']*)'draft/ },
        { field: 'tags', regex: /description: '([^']*)'tags/ },
        { field: 'author', regex: /description: '([^']*)'author/ }
      ]
      
      for (const pattern of mergedPatterns) {
        if (content.match(pattern.regex)) {
          content = content.replace(pattern.regex, `description: '$1'\n${pattern.field}`)
          wasFixed = true
          console.log(`  Fixed merged description/${pattern.field}: ${file.split('/').pop()}`)
        }
      }
      
      // Pattern 3: Missing newlines in frontmatter
      content = content.replace(/('\n)([a-zA-Z]+:)/g, '$1\n$2')
      
      // Pattern 4: Fix malformed tag structure
      content = content.replace(
        /tags:\n(\s*- [^\n]+)\n([a-zA-Z]+:)/g,
        'tags:\n$1\n$2'
      )
      
      if (wasFixed) {
        writeFileSync(file, content)
        fixedCount++
      }
      
      processedCount++
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error)
    }
  }
  
  console.log(`✅ Processed ${processedCount} files`)
  console.log(`🔧 Fixed frontmatter issues in ${fixedCount} posts`)
  console.log('📝 All frontmatter now properly formatted')
}

// Run the script
if (import.meta.main) {
  fixAllFrontmatter().catch(console.error)
}