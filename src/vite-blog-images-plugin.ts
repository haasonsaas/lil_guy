import { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { generateBlogImages } from './utils/blogImageGenerator'

const isDevelopment = process.env.NODE_ENV === 'development'

interface BlogImageConfig {
  width: number
  height: number
  text: string
  type: 'blog'
  backgroundColor?: string
  textColor?: string
}

export function viteBlogImagesPlugin(): Plugin {
  let isGenerating = false
  const generatedImages = new Set<string>()

  async function generateMissingImages() {
    if (isGenerating) return
    isGenerating = true

    try {
      const postsDir = path.join(process.cwd(), 'src', 'posts')
      const generatedDir = path.join(process.cwd(), 'public', 'generated')

      // Ensure generated directory exists
      if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true })
      }

      // Get all markdown files
      const files = fs
        .readdirSync(postsDir)
        .filter((file) => file.endsWith('.md'))

      const imagesToGenerate: BlogImageConfig[] = []

      for (const file of files) {
        const filePath = path.join(postsDir, file)
        const fileContent = fs.readFileSync(filePath, 'utf8')
        const { data: frontmatter } = matter(fileContent)
        const slug = file.replace('.md', '')
        const title = frontmatter.title || slug.replace(/-/g, ' ')

        // Check which images need to be generated
        const sizes = [
          { width: 1200, height: 630 }, // OG image
          { width: 1200, height: 400 }, // Featured
          { width: 800, height: 384 }, // Thumbnail
        ]

        for (const size of sizes) {
          const cleanText = title.toLowerCase().replace(/[^a-z0-9]/g, '-')
          const fileName = `${size.width}x${size.height}-${cleanText}.webp`
          const imagePath = path.join(generatedDir, fileName)
          const imageKey = `${slug}-${size.width}x${size.height}`

          if (!fs.existsSync(imagePath) && !generatedImages.has(imageKey)) {
            imagesToGenerate.push({
              width: size.width,
              height: size.height,
              text: title,
              type: 'blog',
              backgroundColor: '#f5f5f5',
              textColor: '#333333',
            })
            generatedImages.add(imageKey)
          }
        }
      }

      if (imagesToGenerate.length > 0) {
        if (isDevelopment) {
          console.log(
            `\n🖼️  Generating ${imagesToGenerate.length} missing blog images...`
          )
        }
        await generateBlogImages(imagesToGenerate)
        if (isDevelopment) {
          console.log('✅ Blog images generated successfully!\n')
        }
      }
    } catch (error) {
      console.error('Error generating blog images:', error)
    } finally {
      isGenerating = false
    }
  }

  return {
    name: 'vite-blog-images-plugin',

    async buildStart() {
      // Generate images at build start
      await generateMissingImages()
    },

    configureServer(server) {
      // Watch for changes in the posts directory
      const postsDir = path.join(process.cwd(), 'src', 'posts')

      server.watcher.add(postsDir)

      // Generate images when markdown files are added or changed
      server.watcher.on('add', async (filePath) => {
        if (filePath.endsWith('.md') && filePath.includes('src/posts')) {
          if (isDevelopment) {
            console.log(
              `\n📝 New blog post detected: ${path.basename(filePath)}`
            )
          }
          await generateMissingImages()
        }
      })

      server.watcher.on('change', async (filePath) => {
        if (filePath.endsWith('.md') && filePath.includes('src/posts')) {
          // Only regenerate if the title changed
          const fileContent = fs.readFileSync(filePath, 'utf8')
          const { data: frontmatter } = matter(fileContent)
          const title = frontmatter.title

          if (title) {
            const slug = path.basename(filePath).replace('.md', '')
            const cleanText = title.toLowerCase().replace(/[^a-z0-9]/g, '-')
            const testFile = path.join(
              process.cwd(),
              'public',
              'generated',
              `1200x630-${cleanText}.webp`
            )

            if (!fs.existsSync(testFile)) {
              if (isDevelopment) {
                console.log(
                  `\n✏️  Blog post title changed: ${path.basename(filePath)}`
                )
              }
              await generateMissingImages()
            }
          }
        }
      })
    },
  }
}
