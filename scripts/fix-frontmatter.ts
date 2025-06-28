import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

const postsDir = path.join(process.cwd(), 'src', 'posts')

async function fixFrontmatter() {
  const files = glob.sync(path.join(postsDir, '*.md'))
  let fixedCount = 0

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const filename = path.basename(file)

    // Check if the file has the malformed frontmatter pattern
    if (content.includes("'featured:")) {
      console.log(`Fixing frontmatter in: ${filename}`)

      // Split content into lines and process each line
      const lines = content.split('\n')
      const fixedLines = lines.map((line) => {
        // Look for the pattern: description: '...'featured: true/false
        if (line.includes("'featured:")) {
          // Find the position of 'featured:'
          const featuredIndex = line.indexOf("'featured:")
          if (featuredIndex > 0) {
            // Split at the position and add a newline
            const beforeFeatured = line.substring(0, featuredIndex + 1) // Include the closing quote
            const afterFeatured = line.substring(featuredIndex + 1) // Remove the opening quote
            return beforeFeatured + '\n' + afterFeatured
          }
        }
        return line
      })

      const fixedContent = fixedLines.join('\n')
      fs.writeFileSync(file, fixedContent)
      fixedCount++
    }
  }

  console.log(`Fixed ${fixedCount} files`)
}

fixFrontmatter().catch(console.error)
