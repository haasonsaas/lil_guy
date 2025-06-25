import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const postsDir = join(process.cwd(), 'src/posts')
const imagesDir = join(process.cwd(), 'public/images')

async function main() {
  const files = await readdir(postsDir)
  const changedFiles = new Set<string>()

  for (const file of files) {
    if (!file.endsWith('.md')) continue

    const filePath = join(postsDir, file)
    const content = await readFile(filePath, 'utf-8')

    const match = content.match(
      /image:\n {2}url: '(https:\/\/images\.unsplash\.com\/photo-.*?)'/
    )
    if (match) {
      const imageUrl = match[1]
      const imageName = `${file.replace('.md', '')}.jpg`
      const imagePath = join(imagesDir, imageName)

      console.log(`Downloading ${imageUrl} to ${imagePath}`)
      await execAsync(`curl -o ${imagePath} "${imageUrl}"`)

      console.log(`Optimizing ${imagePath}`)
      await execAsync(`jpegoptim --size=500k ${imagePath}`)

      const newContent = content.replace(imageUrl, `/images/${imageName}`)
      await writeFile(filePath, newContent)

      changedFiles.add(filePath)
      changedFiles.add(imagePath)
    }
  }

  if (changedFiles.size > 0) {
    console.log('Committing changes...')
    await execAsync(`git add ${[...changedFiles].join(' ')}`)
    await execAsync(
      'git commit -m "feat: replace external images with optimized local copies"'
    )
    console.log('Changes committed.')
  } else {
    console.log('No external images to replace.')
  }
}

main().catch(console.error)
