# Agent Guidelines for Haas Blog

## Commands

**Build/TypeScript:** `bun run build` (prod), `bun run build:dev`, `bun run typecheck`, `bun run lint`, `bun run lint:fix`  
**Testing:** `bun run test:automation`, `bun run test:automation -d` (dry run), `bun scripts/test-performance-api.ts`  
**Dev:** `bun run dev` (port 8082), `bun run preview`, `bun run preview:cf` (Cloudflare Pages preview)  
**Single test:** No formal test framework - use `bun run <script-name>` for individual script testing

## Architecture

**Tech Stack:** React 18 + TypeScript + Vite + Bun runtime + Tailwind CSS + shadcn/ui  
**Database:** SQLite (dre.db) - stores AI thoughts/sessions with tables: `sessions`, `thoughts`  
**Blog System:** File-based markdown posts in `src/posts/` with frontmatter, auto-generated social images  
**Deployment:** Cloudflare Pages with serverless functions, KV storage for subscriptions/rate limiting  
**API:** `/api` proxied to localhost:8788, functions in `functions/` directory  
**AI Pipeline:** Multi-agent content generation using Gemini + Claude APIs

## Code Style

**Imports:** Use `@/` alias for `src/`, no relative imports across major boundaries  
**Components:** shadcn/ui patterns in `src/components/ui/`, custom in `src/components/`  
**Types:** Strict TypeScript with custom definitions in `src/types/`  
**State:** React Query for server state, Context for global state  
**Styling:** Tailwind CSS + CSS custom properties for themes  
**Error Handling:** Graceful degradation, no mock data in production

## Content Rules

**NO MOCK DATA:** Real production app - always use actual API responses, never fake/placeholder data  
**Content Protection:** Never delete user content without explicit permission - fix problems, don't remove content  
**Voice Guidelines:** Follow Jonathan's style from CLAUDE.md - direct, conversational, short paragraphs, contractions

## Critical Notes

Built with sophisticated bundle splitting for 16+ interactive calculators. Uses custom Vite plugins for markdown processing and image generation. Extensive automation scripts for blog management, AI content generation, and deployment validation. Always run quality checks before deployment.
