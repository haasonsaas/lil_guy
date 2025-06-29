const fs = require('fs')
const path = require('path')

const postsDir = path.join(__dirname, '../src/posts')
const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'))

let fixedCount = 0

for (const file of files) {
  const filePath = path.join(postsDir, file)
  let content = fs.readFileSync(filePath, 'utf-8')
  const newContent = content.replace(
    /^description:.*$/gm,
    "description: 'FIXME: Add a full description for this post.'"
  )
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent)
    fixedCount++
    console.log(`Fixed: ${file}`)
  }
}

console.log(`\nFixed ${fixedCount} files.`)
