import { generateBlogImages } from '../src/utils/blogImageGenerator';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Generating OpenGraph image...');
  
  // Define the OpenGraph image configuration
  const ogImageConfig = {
    width: 1200,
    height: 630,
    text: 'Haas on SaaS',
    type: 'blog' as const,
    backgroundColor: '#f5f5f5',
    textColor: '#333333'
  };
  
  // Generate the OpenGraph image
  await generateBlogImages([ogImageConfig]);
  
  // Copy the generated image to the public directory with the correct name
  const generatedImagePath = path.join(
    process.cwd(), 
    'public', 
    'generated', 
    `${ogImageConfig.width}x${ogImageConfig.height}-${ogImageConfig.text.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`
  );
  
  const targetImagePath = path.join(process.cwd(), 'public', 'opengraph-image-p98pqg.png');
  
  // Copy the file
  fs.copyFileSync(generatedImagePath, targetImagePath);
  
  console.log(`OpenGraph image generated successfully at: ${targetImagePath}`);
}

main().catch((error) => {
  console.error('Error generating OpenGraph image:', error);
  process.exit(1);
}); 