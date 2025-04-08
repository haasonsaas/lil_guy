import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { BlogPostFrontmatter } from './types/blog';

export function markdownPlugin(): Plugin {
  return {
    name: 'vite-plugin-markdown',
    transform(code, id) {
      if (id.endsWith('.md')) {
        try {
          const fileContent = fs.readFileSync(id, 'utf-8');
          
          // Parse frontmatter
          const frontmatterMatch = fileContent.match(/^---\r?\n([\s\S]+?)\r?\n---/);
          let content = fileContent;
          const frontmatter: Record<string, unknown> = {};
          
          if (frontmatterMatch) {
            // Extract frontmatter
            const frontmatterRaw = frontmatterMatch[1];
            
            // Remove frontmatter from content
            content = fileContent.replace(frontmatterMatch[0], '').trim();
            
            // Parse frontmatter fields
            const frontmatterLines = frontmatterRaw.split(/\r?\n/);
            let currentKey: string | null = null;
            let multilineValue = '';
            let isMultiline = false;
            let isNestedObject = false;
            let nestedObjectKey: string | null = null;
            const nestedObject: Record<string, string> = {};
            
            for (let i = 0; i < frontmatterLines.length; i++) {
              const line = frontmatterLines[i].trim();
              
              // Skip empty lines
              if (!line) continue;
              
              // Check if this is a new key
              const keyMatch = line.match(/^(\w+):\s*(.*)/);
              
              if (keyMatch && !isMultiline && !isNestedObject) {
                // Save previous multiline value if exists
                if (currentKey && multilineValue) {
                  frontmatter[currentKey] = multilineValue.trim();
                  multilineValue = '';
                }
                
                // Save previous nested object if exists
                if (currentKey && isNestedObject && Object.keys(nestedObject).length > 0) {
                  frontmatter[currentKey] = { ...nestedObject };
                  isNestedObject = false;
                }
                
                currentKey = keyMatch[1];
                const value = keyMatch[2].trim();
                
                // Check if this is the start of a multiline value
                if (value === "'" || value === '"' || value === '' || value.startsWith('-')) {
                  isMultiline = true;
                  multilineValue = value === "'" || value === '"' ? '' : value;
                } else {
                  // Single line value
                  frontmatter[currentKey] = value.replace(/^['"]|['"]$/g, '');
                  currentKey = null;
                }
              } else if (currentKey && isMultiline) {
                // This is part of a multiline value
                if (line.startsWith('-')) {
                  // Handle array items
                  if (!Array.isArray(frontmatter[currentKey])) {
                    frontmatter[currentKey] = [];
                  }
                  (frontmatter[currentKey] as string[]).push(line.substring(1).trim().replace(/^['"]|['"]$/g, ''));
                } else if (line.match(/^\w+:/)) {
                  // This is a new key in a nested object
                  isMultiline = false;
                  i--; // Process this line again as a new key
                  if (multilineValue) {
                    frontmatter[currentKey] = multilineValue.trim();
                    multilineValue = '';
                  }
                } else {
                  // Continue multiline value
                  multilineValue += (multilineValue ? '\n' : '') + line.replace(/^['"]|['"]$/g, '');
                }
              } else if (line.startsWith('  ') && currentKey === 'image') {
                // This is a nested key in the image object
                isNestedObject = true;
                const nestedKeyMatch = line.trim().match(/^(\w+):\s*(.*)/);
                
                if (nestedKeyMatch) {
                  nestedObjectKey = nestedKeyMatch[1];
                  const value = nestedKeyMatch[2].trim();
                  
                  if (value) {
                    nestedObject[nestedObjectKey] = value.replace(/^['"]|['"]$/g, '');
                  }
                }
              } else if (isNestedObject && line.match(/^\w+:/)) {
                // This is a new top-level key after the nested object
                isNestedObject = false;
                if (currentKey && Object.keys(nestedObject).length > 0) {
                  frontmatter[currentKey] = { ...nestedObject };
                }
                i--; // Process this line again as a new key
              }
            }
            
            // Save the last multiline value if exists
            if (currentKey && multilineValue) {
              frontmatter[currentKey] = multilineValue.trim();
            }
            
            // Save the last nested object if exists
            if (currentKey && isNestedObject && Object.keys(nestedObject).length > 0) {
              frontmatter[currentKey] = { ...nestedObject };
            }
            
            // Handle special nested fields like image
            if (typeof frontmatter.image === 'string') {
              const imageLines = frontmatter.image.split('\n');
              const imageObj: Record<string, string> = {};
              
              imageLines.forEach(line => {
                const imgMatch = line.match(/(\w+):\s*(.*)/);
                if (imgMatch) {
                  imageObj[imgMatch[1]] = imgMatch[2].replace(/^['"]|['"]$/g, '');
                }
              });
              
              if (Object.keys(imageObj).length > 0) {
                frontmatter.image = imageObj;
              }
            }
            
            // Handle tags if it's a string instead of an array
            if (typeof frontmatter.tags === 'string') {
              frontmatter.tags = frontmatter.tags.split('\n')
                .map((tag: string) => tag.trim())
                .filter((tag: string) => tag.startsWith('-'))
                .map((tag: string) => tag.substring(1).trim().replace(/^['"]|['"]$/g, '').toLowerCase())
                .filter(Boolean);
            } else if (Array.isArray(frontmatter.tags)) {
              frontmatter.tags = frontmatter.tags.map((tag: string) => tag.trim().toLowerCase());
            }
          }
          
          // Combine frontmatter and content
          const result = {
            frontmatter,
            content
          };
          
          return `export default ${JSON.stringify(result)};`;
        } catch (error) {
          console.error(`Error processing markdown file ${id}:`, error);
          return `export default { frontmatter: {}, content: "Error loading markdown file" };`;
        }
      }
      return null;
    },
    resolveId(id) {
      if (id.endsWith('.md')) {
        return id;
      }
      return null;
    }
  };
}
