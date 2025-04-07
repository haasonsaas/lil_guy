
import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export function markdownPlugin(): Plugin {
  return {
    name: 'vite-plugin-markdown',
    transform(code, id) {
      if (id.endsWith('.md')) {
        const fileContent = fs.readFileSync(id, 'utf-8');
        // We need to escape any content that might cause JavaScript syntax errors
        // when interpreted as a JS string
        const escapedContent = fileContent
          .replace(/\\([^"])/g, '\\\\$1') // Escape backslashes (except those already escaping quotes)
          .replace(/\n/g, '\\n') // Convert newlines to literal '\n'
          .replace(/"/g, '\\"'); // Escape double quotes
          
        return `export default "${escapedContent}";`;
      }
      return null;
    }
  };
}
