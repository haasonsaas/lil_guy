#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const POSTS_DIR = './src/posts'

// Test functions
async function testSingleFile(filename: string) {
  console.log(`\n🧪 Testing with single file: ${filename}`)

  const filePath = join(POSTS_DIR, filename)
  const content = await readFile(filePath, 'utf-8')

  console.log('📄 Original content (first 15 lines):')
  console.log(content.split('\n').slice(0, 15).join('\n'))

  // Check if it has block scalar
  const hasBlockScalar = content.includes('description: >')
  console.log(`\n🔍 Has block scalar: ${hasBlockScalar}`)

  if (hasBlockScalar) {
    const fixed = await fixSingleFile(filePath, content)
    if (fixed) {
      console.log('\n✅ Fixed content (first 15 lines):')
      const newContent = await readFile(filePath, 'utf-8')
      console.log(newContent.split('\n').slice(0, 15).join('\n'))
    }
  }
}

async function fixSingleFile(
  filePath: string,
  content: string
): Promise<boolean> {
  // Find the frontmatter section
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/m)
  if (!frontmatterMatch) {
    console.log('❌ No frontmatter found')
    return false
  }

  const frontmatter = frontmatterMatch[1]
  const postContent = content.substring(frontmatterMatch[0].length)

  // Extract description with block scalar
  const descMatch = frontmatter.match(/description:\s*>-?\s*\n((?:\s+.*\n?)*)/m)
  if (!descMatch) {
    console.log('❌ No block scalar description found')
    return false
  }

  // Clean the description
  const rawDesc = descMatch[1]
  const cleanDesc = rawDesc
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ')
    .trim()

  console.log(`\n📝 Original description: ${rawDesc.trim()}`)
  console.log(`📝 Cleaned description: ${cleanDesc}`)

  // Rebuild frontmatter line by line
  const lines = frontmatter.split('\n')
  const newLines: string[] = []
  let inDescription = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.match(/^description:\s*>-?\s*$/)) {
      // Found block scalar description start
      inDescription = true
      // Add the cleaned single-line description
      newLines.push(`description: '${cleanDesc.replace(/'/g, "''")}'`)
      continue
    }

    if (inDescription) {
      // Skip lines that are part of the block scalar description
      if (line.match(/^\s+/)) {
        continue
      } else {
        // End of block scalar description
        inDescription = false
      }
    }

    if (!inDescription) {
      newLines.push(line)
    }
  }

  // Reconstruct the file
  const newContent = `---\n${newLines.join('\n')}\n---${postContent}`

  // Write back
  await writeFile(filePath, newContent)
  return true
}

async function fixAllFiles() {
  console.log('\n🚀 Starting to fix all files...\n')

  const files = await readdir(POSTS_DIR)
  const mdFiles = files.filter((f) => f.endsWith('.md'))

  let fixedCount = 0
  let skippedCount = 0

  for (const file of mdFiles) {
    const filePath = join(POSTS_DIR, file)
    const content = await readFile(filePath, 'utf-8')

    if (content.includes('description: >')) {
      const fixed = await fixSingleFile(filePath, content)
      if (fixed) {
        fixedCount++
        console.log(`✅ Fixed: ${file}`)
      }
    } else {
      skippedCount++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Fixed: ${fixedCount} files`)
  console.log(`   Skipped: ${skippedCount} files`)
}

// Main execution
async function main() {
  const args = process.argv.slice(2)

  if (args[0] === '--test' && args[1]) {
    // Test mode with specific file
    await testSingleFile(args[1])
  } else if (args[0] === '--all') {
    // Fix all files
    await fixAllFiles()
  } else {
    console.log('Usage:')
    console.log(
      '  bun scripts/fix-yaml-descriptions-final.ts --test <filename>  # Test with single file'
    )
    console.log(
      '  bun scripts/fix-yaml-descriptions-final.ts --all             # Fix all files'
    )
  }
}

main().catch(console.error)
