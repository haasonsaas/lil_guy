# Haas Blog

A modern, feature-rich blog built with React, TypeScript, and Vite. This project showcases a clean architecture, modern web development practices, and cutting-edge AI integration for content creation and voice replication.

## 🚀 Features

### Core Blog Features

- 📝 Markdown-based blog posts with rich frontmatter
- 🎨 Modern UI with Tailwind CSS and shadcn/ui components
- 🌙 Dark mode support with theme persistence
- 📱 Responsive design optimized for all devices
- ⚡ Fast development with Vite and hot module replacement
- 🔍 SEO friendly with structured data and meta tags
- 📊 Syntax highlighting for code blocks with copy buttons
- 🎯 Type-safe development with TypeScript

### AI-Powered Content Creation

- 🤖 **Multi-AI Content Pipeline** - Automated blog post generation using Gemini and Claude
- 🧠 **Jonathan Voice Engine** - AI personality replication system with authentic voice characteristics
- 🎭 **Voice Validation System** - Authenticity scoring to ensure consistent voice and perspective
- 📋 **AI Orchestration** - Sophisticated workflow management for multi-agent content creation
- 🎯 **Framework Extraction** - Codified thinking patterns and strategic frameworks

## 🛠️ Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Routing:** React Router
- **State Management:** React Query
- **Form Handling:** React Hook Form
- **Markdown Processing:** marked, gray-matter
- **Code Highlighting:** highlight.js
- **Date Handling:** date-fns
- **Validation:** Zod
- **Package Manager:** Bun
- **Code Formatting:** Biome

## 📦 Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and configurations
├── pages/         # Page components
├── posts/         # Markdown blog posts
├── types/         # TypeScript type definitions
└── utils/         # Helper functions
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) (Latest version)
- Node.js (v18 or higher) - Required for some dependencies

### Installation

1. Access the repository (private repository):

   ```bash
   # Repository is not publicly available
   # Contact for access if needed for educational review
   ```

   _Note: This repository contains proprietary blog implementation and AI systems. The code is not publicly available and is not licensed for reuse or redistribution._

2. Install dependencies:

   ```bash
   bun install
   ```

3. Start the development server:

   ```bash
   bun run dev
   ```

4. Open [http://localhost:8080](http://localhost:8080) in your browser.

## 📝 Available Scripts

### Core Development

- `bun run dev` - Start development server (localhost:8080)
- `bun run build` - Build for production
- `bun run build:dev` - Build for development
- `bun run lint` - Lint and format with Biome
- `bun run lint:fix` - Auto-fix formatting issues with Biome
- `bun run typecheck` - TypeScript type checking
- `bun run preview` - Preview production build

### Blog Content Management

- `bun run new-post "Title"` - Create new blog post with interactive setup
- `bun run search "keyword"` - Search blog content with fuzzy matching
- `bun run publish "post title"` - Convert draft to published post
- `bun run generate-blog-images` - Generate social media images for all posts

### AI Content Creation

- `bun run new-post-with-coach "Title"` - Create new post with AI writing coach
- `bun run writing-coach post.md` - Analyze writing style and get feedback
- `bun run gemini new-draft "Topic"` - Generate structured blog post outline
- `bun run enhanced-pipeline run "Topic"` - End-to-end content generation
- `bun run ai-orchestrator workflow "Topic"` - Multi-agent content workflow

### Jonathan Voice Engine

- `bun run jonathan-voice respond "Question"` - Generate authentic response in Jonathan's voice
- `bun run jonathan-voice test` - Run voice authenticity validation tests
- `bun run jonathan-voice stats` - Show voice engine statistics
- `bun run jonathan-voice train` - Train voice model from blog corpus

### Quality Assurance

- `bun run lint:md` - Markdown linting with markdownlint-cli2
- `bun run spell` - Spell checking with custom dictionary
- `bun run check:links` - Validate all links in markdown files
- `bun run validate:seo` - SEO validation for all posts
- `bun run check:all` - Run comprehensive quality checks (TypeScript, Biome, Markdown, Spell, SEO, Links, Bundle Size, Analytics)

## 🤖 AI Systems Overview

This blog features cutting-edge AI integration for content creation and voice replication:

### Multi-AI Content Pipeline

A sophisticated system that combines multiple AI models for end-to-end content creation:

1. **Draft Generation** - Gemini creates structured outlines with title, description, tags
2. **Content Writing** - Full blog post generation from outlines (780+ words)
3. **Quality Validation** - Automated checks for frontmatter, structure, and quality
4. **Voice Consistency** - Ensures output matches Jonathan's authentic voice

```bash
# Generate complete blog post
bun run enhanced-pipeline run "AI Testing Strategies"

# Multi-agent orchestration workflow
bun run ai-orchestrator workflow "Security Best Practices"
```

### Jonathan Voice Engine

An AI personality replication system that generates authentic responses in Jonathan's voice:

- **Voice Profile Extraction** - Analysis of 50+ blog posts to extract writing patterns
- **Framework Codification** - 4 major strategic frameworks extracted from corpus
- **Authenticity Validation** - Scoring system to ensure voice consistency
- **Context-Aware Responses** - Adapts to audience, format, and topic domain

```bash
# Generate response in Jonathan's voice
bun run jonathan-voice respond "How should startups approach AI integration?"

# Test voice authenticity
bun run jonathan-voice test

# View voice profile statistics
bun run jonathan-voice stats
```

### Voice Profile Features

The system captures Jonathan's distinctive characteristics:

- **Tone**: Direct (90%), Contrarian (80%), Empathetic (70%), Pragmatic (95%)
- **Style**: Short paragraphs, heavy contractions, active voice, rhetorical questions
- **Perspectives**: Contrarian takes on equity, nuanced AI adoption views, anti-perfectionism
- **Frameworks**: Startup bargain analysis, strategic quality, AI integration, founder psychology

### AI Orchestration System

Sophisticated workflow management for multi-agent collaboration:

- **Task Distribution** - Intelligent work assignment across AI agents
- **Quality Assurance** - Multi-stage validation and error handling
- **Progress Tracking** - Real-time status monitoring and reporting
- **Conflict Resolution** - Handles competing AI approaches gracefully

## 🎨 Customization

### Adding New Blog Posts

#### Traditional Method

1. Create a new markdown file in the `src/posts` directory
2. Add frontmatter with title, date, and other metadata
3. Write your content in markdown format

#### AI-Assisted Method

```bash
# Interactive post creation
bun run new-post "Your Amazing Topic"

# AI-generated complete post
bun run enhanced-pipeline run "Your Amazing Topic"
```

### Styling

The project uses Tailwind CSS for styling. You can customize the theme in `tailwind.config.ts`.

## 📚 Contributing

_This is a private repository. Contributing guidelines are available to authorized collaborators only._

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Vite](https://vitejs.dev/) for the amazing build tool
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Bun](https://bun.sh) for the fast JavaScript runtime and package manager
