import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const postsDir = path.join(__dirname, '../src/posts')
const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'))

let fixedCount = 0

for (const file of files) {
  const filePath = path.join(postsDir, file)
  let content = fs.readFileSync(filePath, 'utf-8')

  // Only operate on the frontmatter block
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) continue
  let frontmatter = frontmatterMatch[1]

  // Regex: description: '...'<fieldname>: ...
  // Fix: insert a newline after the closing single quote and before the next field
  const fixedFrontmatter = frontmatter.replace(
    /(description: '[^']*?')\s*(tags:|featured:|draft:|author:|pubDate:|title:)/g,
    '$1\n$2'
  )

  if (frontmatter !== fixedFrontmatter) {
    const newContent = content.replace(frontmatter, fixedFrontmatter)
    fs.writeFileSync(filePath, newContent)
    fixedCount++
    console.log(`Fixed: ${file}`)
  }
}

console.log(`\nFixed ${fixedCount} files.`)
