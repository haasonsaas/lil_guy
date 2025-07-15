import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const isDevelopment = process.env.NODE_ENV === 'development'

interface BlogImageConfig {
  width: number
  height: number
  text: string
  type: 'blog'
  backgroundColor?: string
  textColor?: string
  fontSize?: number
  formats?: ('png' | 'webp' | 'avif')[]
  quality?: number
}

/**
 * Calculate the optimal font size for the given text and dimensions
 */
function calculateOptimalFontSize(text: string, width: number, height: number): number {
  const targetLines = 2.5 // We want to wrap text at around 2-3 lines
  const avgCharWidth = 0.6 // Approximate width of a character relative to font size
  const lineHeight = 1.2 // Line height multiplier

  // Calculate available width (accounting for padding)
  const availableWidth = width * 0.7 // Reduced from 0.8 to 0.7 for more padding
  const availableHeight = height * 0.5 // Reduced from 0.6 to 0.5 for more padding

  // Calculate base font size based on width
  let fontSize = availableWidth / (text.length * avgCharWidth)

  // Adjust for target number of lines
  fontSize = Math.min(fontSize * targetLines, availableHeight / (targetLines * lineHeight))

  // Scale down more aggressively to ensure comfortable fit
  fontSize *= 0.7 // Reduced from 0.8 to 0.7

  // Set minimum and maximum font sizes based on image dimensions
  const minFontSize = Math.min(width, height) * 0.03 // Reduced from 0.04
  const maxFontSize = Math.min(width, height) * 0.12 // Reduced from 0.15

  return Math.min(Math.max(fontSize, minFontSize), maxFontSize)
}

/**
 * Generate an SVG for a blog image
 */
function generateBlogSVG(config: BlogImageConfig): string {
  const { width, height, text, backgroundColor = '#f5f5f5', textColor = '#333333' } = config

  // Calculate optimal font size
  const fontSize = calculateOptimalFontSize(text, width, height)

  // Calculate text wrapping
  const maxLineWidth = width * 0.7 // Reduced from 0.8 to 0.7
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = testLine.length * fontSize * 0.6 // Approximate width

    if (testWidth > maxLineWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  })
  if (currentLine) {
    lines.push(currentLine)
  }

  // Calculate line height and starting Y position
  const lineHeight = fontSize * 1.3 // Increased from 1.2 to 1.3 for better spacing
  const totalTextHeight = lines.length * lineHeight
  const startY = (height - totalTextHeight) / 2 + fontSize

  // Generate SVG
  const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustColor(backgroundColor, -10)};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#grad)" />
  
  <!-- Text -->
  ${lines
    .map(
      (line, index) => `
    <text
      x="50%"
      y="${startY + index * lineHeight}"
      font-family="Arial, sans-serif"
      font-size="${fontSize}px"
      font-weight="600"
      fill="${textColor}"
      text-anchor="middle"
      dominant-baseline="middle"
    >${line}</text>
  `
    )
    .join('')}
  
  <!-- Decorative Line -->
  <line x1="${width * 0.25}" y1="${height * 0.8}" y2="${height * 0.8}" x2="${width * 0.75}" 
    stroke="${textColor}" 
    stroke-opacity="0.2" 
    stroke-width="2"
  />
</svg>`

  return svg
}

/**
 * Adjust a color's brightness
 */
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const num = parseInt(hex, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * Generate responsive image set for a blog post
 */
export function generateResponsiveImageConfigs(
  title: string,
  options?: {
    quality?: number
    formats?: ('png' | 'webp' | 'avif')[]
    backgroundColor?: string
    textColor?: string
  }
): BlogImageConfig[] {
  const {
    quality = 85,
    formats = ['png', 'webp', 'avif'],
    backgroundColor = '#f5f5f5',
    textColor = '#333333',
  } = options || {}

  const configs: BlogImageConfig[] = []

  // Social media sizes (fixed aspect ratios)
  const socialSizes = [
    { width: 1200, height: 630 }, // Open Graph
    { width: 1200, height: 400 }, // Twitter Card
    { width: 800, height: 384 }, // LinkedIn
  ]

  // Responsive sizes for different breakpoints (16:9 aspect ratio)
  const responsiveSizes = [
    { width: 400, height: 225 }, // Mobile small
    { width: 640, height: 360 }, // Mobile large
    { width: 768, height: 432 }, // Tablet
    { width: 1024, height: 576 }, // Desktop small
    { width: 1280, height: 720 }, // Desktop medium
    { width: 1920, height: 1080 }, // Desktop large
    { width: 2560, height: 1440 }, // 2K
  ]

  // Generate configs for all sizes
  const allSizes = [...socialSizes, ...responsiveSizes]
  allSizes.forEach(({ width, height }) => {
    configs.push({
      width,
      height,
      text: title,
      type: 'blog' as const,
      backgroundColor,
      textColor,
      formats,
      quality,
    })
  })

  return configs
}

/**
 * Generate blog images for the given configurations
 */
export async function generateBlogImages(configs: BlogImageConfig[]): Promise<void> {
  // Ensure the generated images directory exists
  const generatedDir = path.join(process.cwd(), 'public', 'generated')
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true })
  }

  // Generate each blog image
  for (const config of configs) {
    const cleanText = config.text.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const formats = config.formats || ['png', 'webp']
    const quality = config.quality || 85

    // Generate SVG once
    const svg = generateBlogSVG(config)
    const buffer = Buffer.from(svg)

    if (isDevelopment) {
      console.log(`Generating images for: ${config.text}`)
    }

    // Generate each format
    for (const format of formats) {
      const fileName = `${config.width}x${config.height}-${cleanText}.${format}`
      const filePath = path.join(generatedDir, fileName)

      // Skip if image already exists
      if (fs.existsSync(filePath)) {
        if (isDevelopment) {
          console.log(`Image already exists, skipping: ${fileName}`)
        }
        continue
      }

      try {
        const sharpInstance = sharp(buffer)

        if (format === 'webp') {
          await sharpInstance
            .webp({ quality, effort: 6 }) // High effort for better compression
            .toFile(filePath)
        } else if (format === 'avif') {
          await sharpInstance
            .avif({ quality: Math.round(quality * 0.9), effort: 9 }) // Slightly lower quality for AVIF, max effort
            .toFile(filePath)
        } else if (format === 'png') {
          await sharpInstance.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(filePath)
        }

        // Get file size for optimization feedback
        const stats = fs.statSync(filePath)
        const sizeKB = Math.round(stats.size / 1024)
        if (isDevelopment) {
          console.log(`Generated: ${fileName} (${sizeKB}KB)`)
        }
      } catch (error) {
        console.error(`Error generating ${format} image for ${config.text}:`, error)
      }
    }
  }
}
