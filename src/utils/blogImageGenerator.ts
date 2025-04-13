import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

interface BlogImageConfig {
  width: number;
  height: number;
  text: string;
  type: 'blog';
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
}

/**
 * Calculate the optimal font size for the given text and dimensions
 */
function calculateOptimalFontSize(text: string, width: number, height: number): number {
  const targetLines = 2.5; // We want to wrap text at around 2-3 lines
  const avgCharWidth = 0.6; // Approximate width of a character relative to font size
  const lineHeight = 1.2; // Line height multiplier
  
  // Calculate available width (accounting for padding)
  const availableWidth = width * 0.8;
  const availableHeight = height * 0.6;
  
  // Calculate base font size based on width
  let fontSize = availableWidth / (text.length * avgCharWidth);
  
  // Adjust for target number of lines
  fontSize = Math.min(fontSize * targetLines, availableHeight / (targetLines * lineHeight));
  
  // Scale down slightly to ensure comfortable fit
  fontSize *= 0.8;
  
  // Set minimum and maximum font sizes based on image dimensions
  const minFontSize = Math.min(width, height) * 0.04;
  const maxFontSize = Math.min(width, height) * 0.15;
  
  return Math.min(Math.max(fontSize, minFontSize), maxFontSize);
}

/**
 * Generate an SVG for a blog image
 */
function generateBlogSVG(config: BlogImageConfig): string {
  const {
    width,
    height,
    text,
    backgroundColor = '#f5f5f5',
    textColor = '#333333'
  } = config;
  
  // Calculate optimal font size
  const fontSize = calculateOptimalFontSize(text, width, height);
  
  // Calculate text wrapping
  const maxLineWidth = width * 0.8; // 80% of width
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = testLine.length * fontSize * 0.6; // Approximate width
    
    if (testWidth > maxLineWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }
  
  // Calculate line height and starting Y position
  const lineHeight = fontSize * 1.2;
  const totalTextHeight = lines.length * lineHeight;
  const startY = (height - totalTextHeight) / 2 + fontSize;
  
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
  ${lines.map((line, index) => `
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
  `).join('')}
  
  <!-- Decorative Line -->
  <line x1="${width * 0.25}" y1="${height * 0.75}" x2="${width * 0.75}" y2="${height * 0.75}" 
    stroke="${textColor}" 
    stroke-opacity="0.2" 
    stroke-width="2"
  />
</svg>`;
  
  return svg;
}

/**
 * Adjust a color's brightness
 */
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Generate blog images for the given configurations
 */
export async function generateBlogImages(configs: BlogImageConfig[]): Promise<void> {
  // Ensure the generated images directory exists
  const generatedDir = path.join(process.cwd(), 'public', 'generated');
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }
  
  // Generate each blog image
  for (const config of configs) {
    const cleanText = config.text.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `${config.width}x${config.height}-${cleanText}.png`;
    const filePath = path.join(generatedDir, fileName);
    
    try {
      // Generate SVG
      const svg = generateBlogSVG(config);
      
      // For debugging
      console.log(`Generating image for: ${config.text}`);
      console.log(`SVG length: ${svg.length} bytes`);
      
      // Convert SVG to PNG using sharp
      const buffer = Buffer.from(svg);
      await sharp(buffer)
        .png()
        .toFile(filePath);
      
      console.log(`Generated: ${fileName}`);
    } catch (error) {
      console.error(`Error generating image for ${config.text}:`, error);
    }
  }
} 