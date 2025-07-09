import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

async function convertToWebp(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return
  }

  const outputFilePath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp')

  try {
    await sharp(filePath).webp({ quality: 80 }).toFile(outputFilePath)

    console.log(`Successfully converted ${filePath} to ${outputFilePath}`)
  } catch (error) {
    console.error(`Error converting ${filePath} to WebP:`, error)
  }
}

const inputFile = process.argv[2]

if (!inputFile) {
  console.error('Please provide an input file path.')
  process.exit(1)
}

const fullPath = path.resolve(inputFile)
convertToWebp(fullPath)
