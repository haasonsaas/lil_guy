import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

async function optimizeImages() {
  const imagesDir = path.join(process.cwd(), 'public', 'images')
  const files = fs.readdirSync(imagesDir)

  console.log('Optimizing large images...')

  for (const file of files) {
    if (
      file.endsWith('.jpg') ||
      file.endsWith('.jpeg') ||
      file.endsWith('.png')
    ) {
      const filePath = path.join(imagesDir, file)
      const stats = fs.statSync(filePath)

      // Only optimize files larger than 200KB
      if (stats.size > 200 * 1024) {
        console.log(`Optimizing ${file} (${Math.round(stats.size / 1024)}KB)`)

        try {
          await sharp(filePath)
            .resize({
              width: 1200,
              height: 800,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({
              quality: 80,
              progressive: true,
            })
            .toFile(filePath.replace(/\.(png|jpg|jpeg)$/i, '-optimized.jpg'))

          // Replace original with optimized version
          fs.renameSync(
            filePath.replace(/\.(png|jpg|jpeg)$/i, '-optimized.jpg'),
            filePath.replace(/\.(png|jpg|jpeg)$/i, '.jpg')
          )

          const newStats = fs.statSync(
            filePath.replace(/\.(png|jpg|jpeg)$/i, '.jpg')
          )
          console.log(
            `  Reduced from ${Math.round(stats.size / 1024)}KB to ${Math.round(newStats.size / 1024)}KB`
          )
        } catch (error) {
          console.error(`Error optimizing ${file}:`, error)
        }
      }
    }
  }

  console.log('Image optimization complete!')
}

optimizeImages().catch(console.error)
