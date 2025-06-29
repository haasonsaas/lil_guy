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
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  let inFrontmatter = false
  let hasBeenFixed = false
  const newLines = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter
      newLines.push(line)
      continue
    }

    if (inFrontmatter) {
      const match = line.match(
        /(description:.*?)'(tags:|featured:|draft:|author:|pubDate:|title:)/
      )

      if (match) {
        const descriptionPart = match[1] + "'" // The description with its closing quote
        const nextFieldPart = match[2] // The next field that was on the same line

        newLines.push(descriptionPart)
        newLines.push(nextFieldPart + lines[i].split(match[0])[1]) // Add the rest of the line for the next field

        console.log(`Fixed: ${file}`)
        fixedCount++
        hasBeenFixed = true
      } else {
        newLines.push(line)
      }
    } else {
      newLines.push(line)
    }
  }

  if (hasBeenFixed) {
    fs.writeFileSync(filePath, newLines.join('\n'))
  }
}

console.log(`\nFixed ${fixedCount} files.`)
