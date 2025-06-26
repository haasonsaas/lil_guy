#!/usr/bin/env bun
/**
 * Generate OpenGraph metadata for Cloudflare Pages function
 * This reads all blog posts and outputs a JSON file with their metadata
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDir = path.join(process.cwd(), 'src/posts')
const outputPath = path.join(process.cwd(), 'public/blog-metadata.json')

interface BlogMetadata {
  [slug: string]: {
    title: string
    description: string
    author: string
    pubDate: string
    tags: string[]
  }
}

async function generateMetadata() {
  const files = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'))
  const metadata: BlogMetadata = {}

  for (const file of files) {
    const filePath = path.join(postsDir, file)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(fileContent)

    // Generate slug from filename
    const slug = file.replace('.md', '')

    metadata[slug] = {
      title: data.title || slug,
      description: data.description || '',
      author: data.author || 'Jonathan Haas',
      pubDate: data.pubDate || new Date().toISOString(),
      tags: data.tags || [],
    }
  }

  // Write to public directory so it's accessible at runtime
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2))
  console.log(
    `✅ Generated metadata for ${Object.keys(metadata).length} blog posts`
  )
  console.log(`📄 Output: ${outputPath}`)
}

generateMetadata().catch(console.error)
