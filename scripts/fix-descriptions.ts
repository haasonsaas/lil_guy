#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'

const POSTS_DIR = './src/posts'

async function generateDescription(
  content: string,
  title: string
): Promise<string> {
  // Remove frontmatter
  const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\s*/, '')

  // Remove code blocks
  const contentWithoutCode = contentWithoutFrontmatter.replace(
    /```[\s\S]*?```/g,
    ''
  )

  // Remove markdown formatting
  const plainText = contentWithoutCode
    .replace(/#{1,6}\s+/g, '') // headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[-*+]\s+/gm, '') // lists
    .replace(/^\d+\.\s+/gm, '') // numbered lists
    .replace(/\n{2,}/g, ' ') // multiple newlines
    .replace(/\s+/g, ' ') // multiple spaces
    .trim()

  // Find the first meaningful sentence or two
  const sentences = plainText.split(/[.!?]\s+/)
  let description = ''

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (
      trimmed.length > 20 &&
      !trimmed.startsWith('I ') &&
      !trimmed.startsWith('You ')
    ) {
      description = trimmed
      // Add the next sentence if the first is short
      if (
        description.length < 100 &&
        sentences.indexOf(sentence) < sentences.length - 1
      ) {
        const nextSentence = sentences[sentences.indexOf(sentence) + 1].trim()
        if (nextSentence.length > 10) {
          description += '. ' + nextSentence
        }
      }
      break
    }
  }

  // If no good sentence found, use the first paragraph
  if (!description) {
    const firstParagraph = plainText.split('\n')[0]
    description = firstParagraph.substring(0, 200)
  }

  // Ensure proper length (150-160 chars ideal for SEO)
  if (description.length > 160) {
    description = description.substring(0, 157) + '...'
  } else if (description.length < 100 && title) {
    // If too short, create a description from the title
    description = `${title}: ${description}`
  }

  // Clean up any remaining issues
  description = description
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim()

  // Add period if missing
  if (description && !description.match(/[.!?]$/)) {
    description += '.'
  }

  return description
}

async function fixDescriptions() {
  const files = await readdir(POSTS_DIR)
  const mdFiles = files.filter((f) => f.endsWith('.md'))

  let fixedCount = 0
  const errors: string[] = []

  for (const file of mdFiles) {
    const filePath = join(POSTS_DIR, file)
    const content = await readFile(filePath, 'utf-8')
    const { data, content: postContent } = matter(content)

    if (data.description?.includes('FIXME')) {
      try {
        const newDescription = await generateDescription(
          postContent,
          data.title
        )

        if (newDescription) {
          data.description = newDescription
          const updatedContent = matter.stringify(postContent, data)
          await writeFile(filePath, updatedContent)
          fixedCount++
          console.log(`✅ Fixed: ${file}`)
          console.log(`   Description: ${newDescription}`)
        } else {
          errors.push(`❌ Could not generate description for: ${file}`)
        }
      } catch (error) {
        errors.push(`❌ Error processing ${file}: ${error}`)
      }
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Fixed: ${fixedCount} posts`)
  console.log(`   Errors: ${errors.length}`)

  if (errors.length > 0) {
    console.log(`\n❌ Errors:`)
    errors.forEach((err) => console.log(`   ${err}`))
  }
}

// Run the script
fixDescriptions().catch(console.error)
