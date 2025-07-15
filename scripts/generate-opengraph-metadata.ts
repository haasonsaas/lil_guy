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

/**
 * Calculate reading time in minutes based on word count
 */
function calculateReadingTime(content: string): {
  minutes: number
  wordCount: number
} {
  // Average reading speed in words per minute
  const WORDS_PER_MINUTE = 200

  // Clean up the content while preserving meaningful text
  const text = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks with triple backticks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/^\s*[-*]\s.*$/gm, '') // Remove list items
    .replace(/^\s*\d+\.\s.*$/gm, '') // Remove numbered list items
    .replace(/^\s*#{1,6}\s.*$/gm, '') // Remove headers
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // Keep alt text from links/images
    .replace(/[#*`~>|]/g, '') // Remove markdown syntax
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))

  return {
    minutes,
    wordCount,
  }
}

interface BlogMetadata {
  [slug: string]: {
    title: string
    description: string
    author: string
    pubDate: string
    tags: string[]
    readingTime: {
      minutes: number
      wordCount: number
    }
    featured: boolean
    draft: boolean
  }
}

async function generateMetadata() {
  const files = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'))
  const metadata: BlogMetadata = {}

  for (const file of files) {
    const filePath = path.join(postsDir, file)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)

    // Generate slug from filename
    const slug = file.replace('.md', '')

    // Calculate reading time
    const readingTime = calculateReadingTime(content)

    metadata[slug] = {
      title: data.title || slug,
      description: data.description || '',
      author: data.author || 'Jonathan Haas',
      pubDate: data.pubDate || new Date().toISOString(),
      tags: data.tags || [],
      readingTime,
      featured: !!data.featured,
      draft: !!data.draft,
    }
  }

  // Write to public directory so it's accessible at runtime
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2))
  console.log(`✅ Generated metadata for ${Object.keys(metadata).length} blog posts`)
  console.log(`📄 Output: ${outputPath}`)
}

generateMetadata().catch(console.error)
