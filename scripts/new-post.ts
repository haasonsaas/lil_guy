#!/usr/bin/env bun

import { parseArgs } from "util";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Parse command line arguments
const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    draft: {
      type: 'boolean',
      short: 'd',
      default: true,
    },
    tags: {
      type: 'string',
      short: 't',
      default: '',
    },
    description: {
      type: 'string',
      short: 'D',
      default: '',
    },
    open: {
      type: 'boolean',
      short: 'o',
      default: true,
    },
    dev: {
      type: 'boolean',
      default: false,
    },
  },
  strict: true,
  allowPositionals: true,
});

// Get the title from positional arguments (skip first two as they're bun and script path)
const titleArgs = positionals.slice(2);
if (titleArgs.length === 0) {
  console.error('❌ Error: Please provide a post title');
  console.error('Usage: bun run new-post "My Post Title" [-d|--draft] [-t|--tags "tag1,tag2"] [--description "desc"]');
  process.exit(1);
}

const title = titleArgs.join(' ');

// Generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Generate frontmatter
const generateFrontmatter = (title: string, options: any): string => {
  const today = new Date().toISOString().split('T')[0];
  const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];
  
  const frontmatter: any = {
    author: 'Jonathan Haas',
    pubDate: today,
    title: title,
    description: options.description || `${title} - exploring key insights and practical approaches`,
    featured: false,
    draft: options.draft,
  };

  // Format tags as YAML array
  let yamlContent = '---\n';
  for (const [key, value] of Object.entries(frontmatter)) {
    if (typeof value === 'boolean') {
      yamlContent += `${key}: ${value}\n`;
    } else {
      yamlContent += `${key}: "${value}"\n`;
    }
  }
  
  // Add tags
  yamlContent += 'tags:\n';
  if (tags.length > 0) {
    tags.forEach((tag: string) => {
      yamlContent += `  - ${tag}\n`;
    });
  } else {
    yamlContent += '  - uncategorized\n';
  }
  
  // Add image placeholder
  yamlContent += `image:
  url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643'
  alt: '${title} header image'
---`;

  return yamlContent;
};

// Main function
async function createNewPost() {
  const slug = generateSlug(title);
  const filename = `${slug}.md`;
  const filepath = join(process.cwd(), 'src', 'posts', filename);

  // Check if file already exists
  if (existsSync(filepath)) {
    console.error(`❌ Error: Post with slug "${slug}" already exists at ${filepath}`);
    process.exit(1);
  }

  // Generate content
  const frontmatter = generateFrontmatter(title, values);
  const content = `${frontmatter}

# ${title}

<!-- Start writing your post here -->

## Introduction

[Your introduction here]

## Main Content

[Your main content here]

## Conclusion

[Your conclusion here]
`;

  try {
    // Create posts directory if it doesn't exist
    const postsDir = join(process.cwd(), 'src', 'posts');
    if (!existsSync(postsDir)) {
      await mkdir(postsDir, { recursive: true });
    }

    // Write the file
    await writeFile(filepath, content);
    console.log(`✅ Created new post: ${filename}`);
    console.log(`📝 Title: ${title}`);
    console.log(`🔗 Slug: ${slug}`);
    console.log(`📁 Path: ${filepath}`);
    console.log(`${values.draft ? '📄 Status: Draft' : '🚀 Status: Ready to publish'}`);
    
    if (values.tags) {
      console.log(`🏷️  Tags: ${values.tags}`);
    }

    // Open in editor if requested
    if (values.open) {
      console.log('\n📂 Opening in editor...');
      // Try VS Code first, then fall back to system default
      try {
        await execAsync(`code "${filepath}"`);
      } catch {
        // If VS Code isn't available, try system open
        const openCmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
        try {
          await execAsync(`${openCmd} "${filepath}"`);
        } catch (e) {
          console.log('⚠️  Could not open file automatically. Please open manually.');
        }
      }
    }

    // Start dev server if requested
    if (values.dev) {
      console.log('\n🚀 Starting development server...');
      console.log(`📖 Post will be available at: http://localhost:8080/blog/${slug}`);
      
      // Start dev server in background
      exec('bun run dev', (error) => {
        if (error) {
          console.error('Failed to start dev server:', error.message);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error creating post:', error);
    process.exit(1);
  }
}

// Run the script
createNewPost();