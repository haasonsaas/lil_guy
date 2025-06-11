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
bun run generate-blog-images  # Generate social media images for all posts
bun run watch:images          # Watch for new posts and auto-generate images
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
Deployed on **Cloudflare Pages** with:
- **Serverless Functions**: `functions/subscribe.ts` for email subscriptions with rate limiting
- **KV Storage**: Two namespaces for subscribers and rate limiting
- **Security Headers**: Comprehensive headers via `functions/_headers.ts`

## Adding New Blog Posts

1. Create new `.md` file in `src/posts/`
2. Add frontmatter:
   ```yaml
   ---
   title: "Your Post Title"
   date: "2024-01-01"
   tags: ["tag1", "tag2"]
   description: "Brief description"
   ---
   ```
3. Write markdown content
4. Social media images auto-generate on save

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