
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
          
          // Check if the content contains frontmatter (between --- markers)
          let processedContent = fileContent;
          const frontmatterMatch = fileContent.match(/^---\r?\n([\s\S]+?)\r?\n---/);
          
          // Return the content as a properly escaped string with export
          return `export default ${JSON.stringify(processedContent)};`;
        } catch (error) {
          console.error(`Error processing markdown file ${id}:`, error);
          return `export default "Error loading markdown file";`;
        }
      }
      return null;
    }
  };
}
