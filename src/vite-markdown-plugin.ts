
import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export function markdownPlugin(): Plugin {
  return {
    name: 'vite-plugin-markdown',
    transform(code, id) {
      if (id.endsWith('.md')) {
        try {
          const fileContent = fs.readFileSync(id, 'utf-8');
          
          // Convert the markdown content to a proper JS string literal
          // This ensures all special characters are properly escaped
          const jsonString = JSON.stringify(fileContent);
          
          // Return the content as a default export string
          return `export default ${jsonString};`;
        } catch (error) {
          console.error(`Error processing markdown file ${id}:`, error);
          return `export default "Error loading markdown file";`;
        }
      }
      return null;
    }
  };
}
