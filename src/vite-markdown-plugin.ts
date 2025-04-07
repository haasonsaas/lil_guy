
import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export function markdownPlugin(): Plugin {
  return {
    name: 'vite-plugin-markdown',
    transform(code, id) {
      if (id.endsWith('.md')) {
        const fileContent = fs.readFileSync(id, 'utf-8');
        return `export default ${JSON.stringify(fileContent)};`;
      }
      return null;
    }
  };
}
