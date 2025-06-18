# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
bun run dev              # Start development server (localhost:8080)
bun run build            # Production build
bun run build:dev        # Development build
bun run lint             # ESLint with TypeScript support
bun run typecheck        # TypeScript type checking
bun run preview          # Preview production build
```

### Blog Content Management
```bash
bun run new-post "Title" [-d] [-D "desc"] [-t tag1] [-t tag2]  # Create new blog post
bun run search "keyword" [-c] [-t] [--title] [-l N]            # Search blog content
bun run publish "post title" [-c] [-p]                         # Convert draft to published
bun run generate-blog-images                                   # Generate social media images for all posts
bun run watch:images                                           # Watch for new posts and auto-generate images
```

### Quality Assurance & Linting
```bash
bun run lint             # ESLint with TypeScript support
bun run lint:md          # Markdown linting with markdownlint-cli2
bun run spell            # Spell checking with cspell (custom dictionary)
bun run check:links      # Validate all links in markdown files
```

### Deployment & DevOps
```bash
bun run check:deploy         # Validate deployment readiness (CF Pages limits, env vars, etc.)
bun run preview:cf           # Preview build using Wrangler (matches CF Pages environment)
bun run setup:secrets        # Manage GitHub secrets for CI/CD (--check, --interactive)
```

## Architecture Overview

### Blog System
This is a **file-based blog** where markdown files in `src/posts/` are automatically processed into blog posts. The system includes:

- **Markdown Processing**: Custom Vite plugin (`vite-markdown-plugin.ts`) parses YAML frontmatter and content
- **Automated Image Generation**: `vite-blog-images-plugin.ts` creates social media images (1200x630, 1200x400, 800x384) for each post
- **Content Loading**: Uses Vite's `import.meta.glob` to dynamically load all markdown files at build time

### Key Files
- `src/utils/blog/postUtils.ts` - Core blog post processing logic
- `src/utils/blogImageGenerator.ts` - SVG-to-PNG image generation using Sharp
- `src/components/MarkdownRenderer.tsx` - Secure markdown rendering with syntax highlighting

### Component System
Built on **shadcn/ui** with 40+ components in `src/components/ui/`. Uses:
- **Theming**: CSS custom properties supporting light/dark/sepia themes
- **Styling**: Tailwind CSS with `@tailwindcss/typography` for markdown content
- **State**: React Query for server state, Context providers for global state

### Deployment Architecture
Deployed on **Cloudflare Pages** with full GitHub Actions CI/CD:

**GitHub Actions Workflows:**
- `deploy-preview.yml` - Preview deployments for every PR with status comments
- `deploy-production.yml` - Production deployments with cache purging
- `quality-checks.yml` - TypeScript, ESLint, security scanning, bundle size monitoring
- `cleanup-previews.yml` - Automatic cleanup when PRs are closed

**Cloudflare Integration:**
- **Serverless Functions**: `functions/subscribe.ts` for email subscriptions with rate limiting
- **KV Storage**: Two namespaces for subscribers and rate limiting  
- **Security Headers**: Comprehensive headers via `functions/_headers.ts`
- **Preview Environments**: Unique URLs for every PR branch
- **Cache Management**: Automatic purging on production deployments

## Content Creation Workflow

### Creating New Posts (Recommended)
```bash
# Create a new blog post with CLI (recommended)
bun run new-post "Your Amazing Post Title" \
  -D "A compelling description for SEO" \
  -t developer-experience -t blogging -t productivity

# This automatically:
# - Generates URL-friendly slug
# - Creates properly formatted frontmatter  
# - Opens file in your editor
# - Creates as draft by default (add -d false to publish immediately)
```

### Manual Post Creation
1. Create new `.md` file in `src/posts/`
2. Add frontmatter:
   ```yaml
   ---
   author: "Jonathan Haas"
   pubDate: "2024-01-01"
   title: "Your Post Title"
   description: "Brief description (150-160 chars for SEO)"
   featured: false
   draft: true
   tags: ["tag1", "tag2"]
   ---
   ```
3. Write markdown content
4. Social media images auto-generate on save

### Publishing Workflow
```bash
# Search for draft posts
bun run search "keyword" -t

# Convert draft to published
bun run publish "post title" -c -p  # -c commits, -p pushes to trigger deployment
```

## Existing Features (DO NOT SUGGEST THESE)

- **Search Functionality**: Full-text search across all blog posts is already implemented
- **Analytics**: Cloudflare Web Analytics with comprehensive event tracking  
- **SEO**: Complete structured data, sitemaps, meta tags, and validation tools
- **Email Automation**: Subscription system with welcome series (deployment needs fixing)

## Important Conventions

### File Structure
- Blog posts: `src/posts/*.md`
- Pages: `src/pages/*.tsx` 
- Components: `src/components/` (reusable) and `src/components/ui/` (shadcn)
- Utils: `src/utils/` and `src/utils/blog/` for blog-specific utilities

### Build Process
- **Vite**: Custom plugins handle markdown processing and image generation
- **TypeScript**: Strict typing with custom type definitions in `src/types/`
- **Bun**: Required runtime (>=1.0.0) for package management and scripts

### Email Subscription System
The `functions/subscribe.ts` endpoint handles newsletter signups:
- Integrates with Resend API for email notifications
- Rate limited to 5 requests/hour per IP via Cloudflare KV
- Validates email addresses and prevents duplicates

### Image Generation
Automated blog image generation runs on:
- Development file changes (via Vite plugin)
- Manual execution (`bun run generate-blog-images`)
- Generates 3 sizes for different social media platforms
- Uses SVG templates converted to PNG with Sharp

## Developer Experience Features

### VS Code Integration
- **Workspace Settings**: Optimized for markdown editing with spell check, formatting
- **Code Snippets**: 15+ blog-specific snippets (`blog-front`, `blog-code`, `blog-section`, etc.)
- **Extensions**: Recommended extensions auto-suggested for optimal experience

### Content Tools
- **Search**: Fuzzy search across all posts with relevance scoring and colored output
- **Validation**: Real-time frontmatter validation with helpful error messages and suggestions
- **Hot Reload**: Instant preview updates when editing markdown files

### Quality Assurance & Pre-commit Automation
- **Frontmatter Validation**: Catches common errors (missing fields, wrong types, typos)
- **Bundle Size Monitoring**: Automated checks for Cloudflare Pages limits (25MB)
- **Security Scanning**: Prevents committing API keys and checks dependencies
- **RSS Generation**: Automatic feed updates with deployment validation
- **Markdown Linting**: Consistent formatting and structure validation
- **Spell Checking**: Custom dictionary with 100+ technical terms and proper names
- **Link Validation**: Background checking for broken external links
- **Image Optimization**: Warnings for large files (>1MB) with optimization suggestions

### Local Development
- **HMR**: Hot module replacement for markdown files
- **Preview Matching Production**: `bun run preview:cf` uses Wrangler for exact CF Pages environment
- **Deployment Health Checks**: Pre-deployment validation of build size, functions, env vars

## Important Debugging Principles
- NEVER skip steps when diagnosing build or runtime issues
- ALWAYS investigate the root cause thoroughly rather than working around problems
- When build fails, examine the specific error messages and fix the underlying issue
- Don't use timeout commands or other shortcuts to avoid debugging - this is laziness
- Properly diagnose esbuild service errors, dependency issues, and configuration problems
- Clean reinstalls (rm -rf node_modules && bun install) often resolve service communication issues