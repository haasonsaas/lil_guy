
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
          
          // Return the content as a properly escaped string with export
          return `export default ${JSON.stringify(fileContent)};`;
        } catch (error) {
          console.error(`Error processing markdown file ${id}:`, error);
          return `export default "Error loading markdown file";`;
        }
      }
      return null;
    },
    // Add handling for resolving .md imports
    resolveId(id) {
      if (id.endsWith('.md')) {
        return id;
      }
      return null;
    }
  };
}
