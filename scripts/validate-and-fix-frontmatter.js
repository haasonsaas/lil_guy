import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const postsDir = path.join(__dirname, '../src/posts')
const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'))

let fixedCount = 0
let errorCount = 0
const errors = []

console.log('🔍 Validating markdown frontmatter...\n')

for (const file of files) {
  const filePath = path.join(postsDir, file)
  let content = fs.readFileSync(filePath, 'utf-8')
  const filename = path.basename(file)

  try {
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) {
      console.log(`❌ ${filename}: No frontmatter found`)
      errorCount++
      continue
    }

    const frontmatterText = frontmatterMatch[1]

    // Try to parse YAML
    try {
      const frontmatter = yaml.load(frontmatterText)

      // Check for truncated description
      if (
        frontmatter.description &&
        typeof frontmatter.description === 'string'
      ) {
        const desc = frontmatter.description

        // Check if description is truncated (ends with single quote and no proper ending)
        if (
          desc.endsWith("'") &&
          !desc.endsWith(".'") &&
          !desc.endsWith("!'") &&
          !desc.endsWith("?'")
        ) {
          console.log(`🔧 ${filename}: Fixing truncated description`)

          // Replace with placeholder
          const newFrontmatterText = frontmatterText.replace(
            new RegExp(
              `description: '${desc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`
            ),
            "description: 'FIXME: Add a full description for this post.'"
          )

          // Update the content
          const newContent = content.replace(
            frontmatterText,
            newFrontmatterText
          )
          fs.writeFileSync(filePath, newContent)
          fixedCount++
        }
      }
    } catch (yamlError) {
      console.log(`❌ ${filename}: YAML parsing error - ${yamlError.message}`)
      errors.push({ file: filename, error: yamlError.message })
      errorCount++

      // Try to fix common YAML issues
      if (yamlError.message.includes('block mapping entry')) {
        console.log(`🔧 ${filename}: Attempting to fix YAML structure...`)

        // Look for the specific pattern: description with unclosed quote followed by featured
        const fixedContent = content.replace(
          /(description: '[^']*)'featured: (true|false)/g,
          "$1'\nfeatured: $2"
        )

        if (content !== fixedContent) {
          fs.writeFileSync(filePath, fixedContent)
          console.log(`✅ ${filename}: Fixed YAML structure`)
          fixedCount++
        }
      }
    }
  } catch (error) {
    console.log(`❌ ${filename}: Unexpected error - ${error.message}`)
    errors.push({ file: filename, error: error.message })
    errorCount++
  }
}

console.log(`\n📊 Summary:`)
console.log(`✅ Fixed: ${fixedCount} files`)
console.log(`❌ Errors: ${errorCount} files`)

if (errors.length > 0) {
  console.log(`\n❌ Files with errors:`)
  errors.forEach(({ file, error }) => {
    console.log(`  - ${file}: ${error}`)
  })
}

if (errorCount === 0) {
  console.log(`\n🎉 All markdown files have valid frontmatter!`)
}
