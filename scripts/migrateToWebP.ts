import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface MigrationStats {
  pngFilesFound: number
  webpFilesFound: number
  pngFilesRemoved: number
  codeFilesUpdated: number
  spaceSavedMB: number
}

/**
 * Get all PNG files in generated directory
 */
function getPNGFiles(): string[] {
  const generatedDir = path.join(process.cwd(), 'public', 'generated')
  if (!fs.existsSync(generatedDir)) {
    return []
  }

  return fs
    .readdirSync(generatedDir)
    .filter((file) => file.endsWith('.png'))
    .map((file) => path.join(generatedDir, file))
}

/**
 * Get all WebP files in generated directory
 */
function getWebPFiles(): string[] {
  const generatedDir = path.join(process.cwd(), 'public', 'generated')
  if (!fs.existsSync(generatedDir)) {
    return []
  }

  return fs
    .readdirSync(generatedDir)
    .filter((file) => file.endsWith('.webp'))
    .map((file) => path.join(generatedDir, file))
}

/**
 * Check if a WebP equivalent exists for a PNG file
 */
function hasWebPEquivalent(pngPath: string): boolean {
  const webpPath = pngPath.replace('.png', '.webp')
  return fs.existsSync(webpPath)
}

/**
 * Update code files to use WebP instead of PNG
 */
function updateCodeFiles(): number {
  const codeFiles = [
    'src/utils/blog/imageUtils.ts',
    'src/utils/rssGenerator.ts',
    'src/utils/seo/structuredData.ts',
    'src/components/SEO/MetaTags.tsx',
    'src/vite-blog-images-plugin.ts',
  ]

  let updatedCount = 0

  for (const file of codeFiles) {
    const filePath = path.join(process.cwd(), file)
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`)
      continue
    }

    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content

    // Replace PNG references with WebP
    content = content.replace(
      /\/generated\/([^"'`\s]+)\.png/g,
      '/generated/$1.webp'
    )
    content = content.replace(/\.png(?=["'`\s])/g, '.webp')

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content)
      console.log(`✅ Updated: ${file}`)
      updatedCount++
    } else {
      console.log(`ℹ️  No changes needed: ${file}`)
    }
  }

  return updatedCount
}

/**
 * Remove PNG files that have WebP equivalents
 */
function removePNGFiles(dryRun: boolean = false): {
  removed: number
  spaceSavedMB: number
} {
  const pngFiles = getPNGFiles()
  let removed = 0
  let spaceSavedBytes = 0

  console.log(`\n🔍 Found ${pngFiles.length} PNG files`)

  for (const pngFile of pngFiles) {
    if (hasWebPEquivalent(pngFile)) {
      const stats = fs.statSync(pngFile)
      spaceSavedBytes += stats.size

      if (!dryRun) {
        fs.unlinkSync(pngFile)
        console.log(
          `🗑️  Removed: ${path.basename(pngFile)} (${Math.round(stats.size / 1024)}KB)`
        )
      } else {
        console.log(
          `🔍 Would remove: ${path.basename(pngFile)} (${Math.round(stats.size / 1024)}KB)`
        )
      }
      removed++
    } else {
      console.log(`⚠️  No WebP equivalent for: ${path.basename(pngFile)}`)
    }
  }

  return { removed, spaceSavedMB: spaceSavedBytes / (1024 * 1024) }
}

/**
 * Main migration function
 */
async function migrate(
  options: { dryRun?: boolean; updateCode?: boolean } = {}
) {
  const { dryRun = false, updateCode = true } = options

  console.log('🚀 Starting WebP migration...\n')

  const stats: MigrationStats = {
    pngFilesFound: 0,
    webpFilesFound: 0,
    pngFilesRemoved: 0,
    codeFilesUpdated: 0,
    spaceSavedMB: 0,
  }

  // Get current state
  stats.pngFilesFound = getPNGFiles().length
  stats.webpFilesFound = getWebPFiles().length

  console.log(`📊 Current state:`)
  console.log(`   PNG files: ${stats.pngFilesFound}`)
  console.log(`   WebP files: ${stats.webpFilesFound}`)

  // Update code files
  if (updateCode) {
    console.log(`\n📝 Updating code files...`)
    stats.codeFilesUpdated = updateCodeFiles()
  }

  // Remove PNG files
  console.log(`\n🧹 ${dryRun ? 'Analyzing' : 'Removing'} PNG files...`)
  const cleanupResult = removePNGFiles(dryRun)
  stats.pngFilesRemoved = cleanupResult.removed
  stats.spaceSavedMB = cleanupResult.spaceSavedMB

  // Summary
  console.log(`\n📋 Migration Summary:`)
  console.log(`   PNG files processed: ${stats.pngFilesFound}`)
  console.log(
    `   PNG files ${dryRun ? 'would be' : ''} removed: ${stats.pngFilesRemoved}`
  )
  console.log(`   Code files updated: ${stats.codeFilesUpdated}`)
  console.log(
    `   Space ${dryRun ? 'would be' : ''} saved: ${stats.spaceSavedMB.toFixed(2)}MB`
  )

  if (dryRun) {
    console.log(`\n💡 Run with --execute to perform actual migration`)
  } else {
    console.log(`\n✅ Migration completed successfully!`)
  }
}

// CLI interface
const args = process.argv.slice(2)
const dryRun = !args.includes('--execute')
const updateCode = !args.includes('--no-code-update')

migrate({ dryRun, updateCode }).catch((error) => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
