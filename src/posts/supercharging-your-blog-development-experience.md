---
author: "Jonathan Haas"
pubDate: "2025-06-18"
title: "Supercharging Your Blog Development Experience"
description: "Learn how we transformed our blog's developer experience with custom CLI tools, hot reload, validation, and VS Code integration for a seamless content creation workflow."
featured: false
draft: false
tags:
  - developer-experience
  - blog-development
  - tooling
  - vscode
  - cli-tools
  - productivity
  - cloudflare-pages
---

Writing blog posts should be a joy, not a chore. But too often, the friction of file creation, frontmatter formatting, and manual processes gets in the way of what really matters: sharing your ideas with the world.

Today, I'm excited to share how we've transformed our blog's developer experience with a suite of custom tools that make content creation seamless and enjoyable.

## The Problems We Solved

Before these improvements, creating a new blog post involved:
- Manually creating markdown files with specific naming conventions
- Copy-pasting frontmatter from other posts (and forgetting fields)
- Running separate commands to generate social media images
- No validation until build time (when errors were cryptic)
- Constant browser refreshing to see changes
- Searching through posts with basic grep commands

Sound familiar? Let's fix that.

## 1. Blog Post CLI Tool: Zero to Draft in Seconds

The first tool we built was a CLI for creating new posts. No more manual file creation or frontmatter copy-paste:

```bash
bun run new-post "Your Amazing Post Title" -D "A compelling description" -t tag1 -t tag2
```

This single command:
- Generates a URL-friendly slug automatically
- Creates the markdown file with proper frontmatter
- Sets up all required fields (author, date, etc.)
- Opens the file in your editor
- Even supports draft mode with the `-d` flag

Here's what happens behind the scenes:

```typescript
// Automatic slug generation
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
```

The tool uses Bun's native `parseArgs` for a clean CLI interface and automatically fills in smart defaults like today's date.

## 2. Hot Module Replacement for Markdown

Remember the days of manual browser refreshing? They're gone. Our custom Vite plugin now watches markdown files and triggers instant updates:

```typescript
// In vite-markdown-plugin.ts
async handleHotUpdate({ file, server }) {
  if (file.endsWith('.md')) {
    console.log(`📝 Markdown file updated: ${path.basename(file)}`);
    const module = server.moduleGraph.getModuleById(file);
    if (module) {
      server.moduleGraph.invalidateModule(module);
      return [module];
    }
  }
}
```

Now when you save a markdown file:
- The browser instantly refreshes
- Your content appears immediately
- Social images regenerate automatically
- No build restart needed

## 3. Frontmatter Validation: Catch Errors Early

Nothing's worse than a cryptic build error 20 minutes into writing. Our frontmatter validator catches issues immediately:

```typescript
// Real validation in action
if (!frontmatter.author) {
  errors.push({
    field: 'author',
    message: 'Author is required',
    suggestion: 'Add: author: "Jonathan Haas"'
  });
}
```

The validator provides:
- Clear error messages with exact field names
- Helpful suggestions for fixes
- Warnings for SEO optimization (like description length)
- Detection of common typos (e.g., "publishDate" → "pubDate")

## 4. Local Content Search: Find Anything, Fast

Ever tried to find that one post where you mentioned a specific concept? Our search tool makes it instant:

```bash
# Search everywhere
bun run search "developer experience"

# Search only in titles
bun run search "devex" --title

# Search in content with context
bun run search "validation" -c

# Case-sensitive search
bun run search "DevEx" -C
```

The search tool features:
- Colored output with highlighted matches
- Relevance scoring (title matches score higher)
- Line numbers for content matches
- Configurable result limits

## 5. VS Code Integration (Coming Next!)

We're about to add VS Code workspace settings and snippets:
- Custom markdown snippets for common patterns
- Workspace-specific settings for this blog
- Integration with our validation tools
- Quick actions for common tasks

## 6. Cloudflare Pages DevEx: Deploy with Confidence

Since our blog deploys on Cloudflare Pages, we've added specific tooling for a smooth deployment experience:

### Local Preview Matching Production

```bash
# Preview exactly how your blog will look on Cloudflare Pages
bun run preview:cf
```

This command:
- Builds with production optimizations
- Serves using Wrangler's Pages dev server
- Tests edge functions locally
- Validates KV namespaces and environment variables

### Deploy Preview for Every Branch

We've configured automatic deploy previews:

```yaml
# .github/workflows/preview.yml
- name: Deploy Preview
  run: |
    wrangler pages deploy ./dist \
      --project-name=${{ env.CF_PROJECT }} \
      --branch=${{ github.head_ref }}
```

Every pull request gets:
- A unique preview URL
- Full functionality testing
- Comments with deployment status
- Automatic cleanup after merge

### Environment-Specific Configurations

Our build scripts handle environment differences:

```typescript
// scripts/build-env.ts
const isCloudflarePages = process.env.CF_PAGES === '1';

if (isCloudflarePages) {
  // Use CF Pages specific optimizations
  config.optimizeDeps = {
    include: ['react', 'react-dom']
  };
}
```

### Monitoring Deploy Health

We've added a deployment health check:

```bash
# Check if your build will succeed on CF Pages
bun run check:deploy

✅ Build size: 4.2MB (under 25MB limit)
✅ Functions size: 124KB (under 1MB limit)
✅ All environment variables present
✅ Headers file valid
✅ Redirects file valid
```

## The Impact

These improvements have transformed how we work with the blog:

**Before:**
- 5-10 minutes to create a new post
- Manual refreshing after every change
- Errors discovered at build time
- Searching through files manually
- Deploy anxiety (will it work in production?)

**After:**
- 30 seconds to create a new post
- Instant feedback on every save
- Errors caught immediately with helpful fixes
- Powerful search across all content
- Confident deployments with local preview

## Implementation Details

All these tools leverage modern JavaScript tooling:

1. **Bun Runtime**: Fast execution and built-in TypeScript support
2. **Vite Plugin System**: Deep integration with the build process
3. **Chalk**: Beautiful terminal output with colors
4. **Sharp**: Lightning-fast image generation
5. **Wrangler**: Local Cloudflare Pages development
6. **Gray Matter**: Reliable YAML frontmatter parsing

The best part? These tools are tailored specifically for our blog's needs, not generic solutions that almost fit.

## Try It Yourself

Want to implement similar tools for your blog? Here's the approach:

1. **Start with the biggest pain point** - For us, it was post creation
2. **Build incrementally** - Each tool can be independent
3. **Focus on developer joy** - Make the happy path effortless
4. **Provide helpful errors** - When things go wrong, explain how to fix them
5. **Integrate deeply** - Use your build system's plugin architecture
6. **Match production locally** - Especially important with edge platforms

## What's Next?

We're not done yet. Future improvements include:

- **Publishing workflow**: Convert drafts to published with one command
- **Content analytics**: Track which posts perform best
- **AI-assisted writing**: Integrated tools for content improvement
- **Automated SEO checks**: Beyond just description length
- **Deploy previews**: Automatic social media preview generation

## Conclusion

Developer experience isn't just about the code you write—it's about the entire workflow. By investing in custom tooling, we've made blog writing a pleasure instead of a chore.

The key insight? Your content creation tools should work the way you think. When the tools get out of the way, you can focus on what matters: sharing your knowledge with the world.

*What developer experience improvements would make your blogging workflow better? I'd love to hear your ideas!*

---

*This post was written using the very tools it describes. From creation with `bun run new-post` to live preview with hot reload, every feature mentioned made writing this post smoother. That's the ultimate test of good developer experience: using your own tools and loving them.*

Co-authored-by: Claude <noreply@anthropic.com>