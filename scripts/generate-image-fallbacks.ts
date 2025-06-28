#!/usr/bin/env bun

/**
 * Generate JPG fallbacks for WebP images
 * This ensures compatibility with older browsers that don't support WebP
 */

import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import { join, extname, basename } from 'path'
import { existsSync } from 'fs'

const GENERATED_DIR = join(process.cwd(), 'public', 'generated')
const QUALITY = 85 // JPG quality

async function generateFallback(webpPath: string): Promise<void> {
  const jpgPath = webpPath.replace(/\.webp$/, '.jpg')

  // Skip if JPG already exists
  if (existsSync(jpgPath)) {
    return
  }

  try {
    await sharp(webpPath)
      .jpeg({ quality: QUALITY, progressive: true })
      .toFile(jpgPath)

    console.log(`✅ Generated fallback: ${basename(jpgPath)}`)
  } catch (error) {
    console.error(
      `❌ Failed to generate fallback for ${basename(webpPath)}:`,
      error
    )
  }
}

async function processDirectory(dir: string): Promise<void> {
  const files = await readdir(dir)

  const webpFiles = files.filter(
    (file) => extname(file).toLowerCase() === '.webp'
  )

  console.log(`Found ${webpFiles.length} WebP files in ${dir}`)

  for (const file of webpFiles) {
    const filePath = join(dir, file)
    const stats = await stat(filePath)

    if (stats.isFile()) {
      await generateFallback(filePath)
    }
  }
}

async function main() {
  console.log('🖼️  Generating JPG fallbacks for WebP images...\n')

  if (!existsSync(GENERATED_DIR)) {
    console.error(`Directory not found: ${GENERATED_DIR}`)
    process.exit(1)
  }

  const startTime = Date.now()

  await processDirectory(GENERATED_DIR)

  const elapsed = Date.now() - startTime
  console.log(`\n✨ Completed in ${elapsed}ms`)
}

// Run the script
main().catch(console.error)
