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
bun run new-post-with-coach "Title" [-w]                       # Create post with AI writing coach
bun run writing-coach post.md [-w]                             # AI analysis of your writing style
bun run search "keyword" [-c] [-t] [--title] [-l N]            # Search blog content
bun run publish "post title" [-c] [-p]                         # Convert draft to published
bun run generate-blog-images                                   # Generate social media images for all posts
bun run watch:images                                           # Watch for new posts and auto-generate images
```

### AI Writing Coach

The AI Writing Coach analyzes your blog posts for style consistency, clarity, and engagement:

```bash
# Analyze a specific post
bun run writing-coach src/posts/my-post.md

# Watch mode - get real-time feedback as you write
bun run writing-coach -w src/posts/draft.md

# Create new post with automatic coaching
bun run new-post-with-coach "My New Post" -w
```

**Coach Features:**

- **Style Consistency**: Matches your established voice and patterns
- **Clarity Analysis**: Identifies complex sentences and suggests improvements
- **Engagement Scoring**: Evaluates hook effectiveness and reader retention
- **SEO Optimization**: Title and description analysis
- **Technical Accuracy**: Flags potential factual issues
- **Voice Matching**: Ensures consistency with your writing style
- **Structural Analysis**: Checks flow and organization
- **Prioritized Feedback**: High/medium/low priority improvements

### Quality Assurance & Linting

```bash
bun run lint             # ESLint with TypeScript support
bun run lint:md          # Markdown linting with markdownlint-cli2
bun run spell            # Spell checking with cspell (custom dictionary)
bun run check:links      # Validate all links in markdown files
```

### Analytics & Monitoring

```bash
bun scripts/agent-report.ts [-p 7d|14d|30d] [-f table|json|markdown]     # AI agent usage analytics
bun scripts/seo-audit.ts [-u URL] [-f table|json|markdown] [-d basic|comprehensive]  # SEO health audit
bun run stats [-p 7d|30d|90d|365d|all] [-f table|json|markdown]         # Personal writing statistics
bun run drafts [-s score|age|words|priority] [-f table|json|markdown]   # Analyze draft posts for completion
bun run ideas [-n 10] [-t sequel|deep-dive|practical-guide] [-f table|json|markdown]  # Generate content ideas
bun run momentum [-q] [-f table|minimal|json]                           # Writing momentum tracker with motivational nudges

# Personal productivity utilities use shared libraries in scripts/lib/ for consistency
```

### Automated Blog Generation

```bash
bun run setup:automation    # Setup automated blog generation pipeline
bun run test:automation     # Test automation pipeline locally
bun run test:automation -d  # Dry run test (no files created)
bun run test:automation -t "Custom Topic"  # Test with specific topic

# The automation runs via GitHub Actions:
# - Scheduled: Tuesdays and Fridays at 9 AM PST (17:00 UTC)
# - Manual: Via GitHub Actions UI with optional topic override
# - Quality: 70% auto-publish, 30% held as drafts for review
```

### Deployment & DevOps

```bash
bun run check:deploy         # Validate deployment readiness (CF Pages limits, env vars, etc.)
bun run preview:cf           # Preview build using Wrangler (matches CF Pages environment)
bun run setup:secrets        # Manage GitHub secrets for CI/CD (--check, --interactive)
```

### Git Workflow

When creating pull requests, use the `gh` CLI. For example:

`gh pr create --title "feat: add new feature" --body "This PR adds a new feature that does x, y, and z."`

### Pull Request Workflow

When merging a pull request, the agent should follow these steps:

1.  **Checkout the PR:** Use `gh pr checkout <pr-number>` to switch to the PR's branch.
2.  **Resolve Conflicts (if any):** If there are merge conflicts, resolve them and push the changes.
3.  **Merge the PR:** Use `gh pr merge <pr-number> --merge` to merge the pull request.
4.  **Switch to Main:** Use `git checkout main` to switch back to the main branch.
5.  **Pull Latest Changes:** Use `git pull` to update the local main branch.
6.  **Delete Local Branch:** Use `git branch -d <branch-name>` to delete the local feature branch.

### Autonomous Workflow

This workflow outlines the process Claude should follow to autonomously propose and implement new features or improvements.

**Phase 1: Autonomous Goal Identification & Planning**

- **Step 1: Propose High-Level Goal.** Based on its analysis of the project, Claude should identify and propose a high-level strategic goal (e.g., "Improve Site Performance," "Enhance Content Discovery").
- **Step 2: Analyze Current State.** Upon user approval of the goal, Claude should conduct a thorough analysis of the relevant codebase to understand the current implementation and identify specific areas for improvement.
- **Step 3: Formulate Detailed Plan.** Claude should create a detailed, step-by-step plan outlining the specific changes, new components, and the expected outcome.
- **Step 4: Present Plan for Approval.** Claude should present this detailed plan to the user for feedback and final approval before writing any code.

**Phase 2: Autonomous Implementation & Verification**

- **Step 5: Implement Changes.** Once the plan is approved, Claude should execute the plan by writing and modifying the necessary code and files.
- **Step 6: Run Local Verification Suite.** After implementation, Claude should run all relevant local checks, including linting, spell-checking, SEO validation, and any applicable tests. Claude must autonomously fix any issues that arise until all checks pass.
- **Step 7: Commit Changes.** Once all local checks pass, Claude should commit the changes to the local `main` branch with a clear, conventional commit message.

**Phase 3: Manual Review & Deployment**

- **Step 8: Request Manual Review (CRITICAL STOP).** After committing the changes locally, Claude must stop all further action. Claude will notify the user that the work is complete and ready for their review. **Claude will not proceed without explicit user approval.**
- **Step 9: Await User Approval.** Claude will wait for the user to manually review the local commit and provide their explicit approval to proceed.
- **Step 10: Push to Main.** Once Claude receives user approval, it will push the committed changes to the remote `main` branch.

### Blog Post Creation Workflow

### Autonomous Workflow

This workflow outlines the process for the agent to autonomously propose and implement new features or improvements.

**Phase 1: Autonomous Goal Identification & Planning**

- **Step 1: Propose High-Level Goal.** Based on my analysis of the project, I will identify and propose a high-level strategic goal (e.g., "Improve Site Performance," "Enhance Content Discovery").
- **Step 2: Analyze Current State.** Upon your approval of the goal, I will conduct a thorough analysis of the relevant codebase to understand the current implementation and identify specific areas for improvement.
- **Step 3: Formulate Detailed Plan.** I will create a detailed, step-by-step plan outlining the specific changes, new components, and the expected outcome.
- **Step 4: Present Plan for Approval.** I will present this detailed plan to you for feedback and final approval before any code is written.

**Phase 2: Autonomous Implementation & Verification**

- **Step 5: Implement Changes.** Once the plan is approved, I will execute the plan by writing and modifying the necessary code and files.
- **Step 6: Run Local Verification Suite.** After implementation, I will run all relevant local checks, including linting, spell-checking, SEO validation, and any applicable tests. I will autonomously fix any issues that arise until all checks pass.
- **Step 7: Commit Changes.** Once all local checks pass, I will commit the changes to the local `main` branch with a clear, conventional commit message.

**Phase 3: Manual Review & Deployment**

- **Step 8: Request Manual Review (CRITICAL STOP).** After committing the changes locally, I will stop all further action. I will notify you that the work is complete and ready for your review. **I will not proceed without your explicit approval.**
- **Step 9: Await User Approval.** I will wait for you to manually review the local commit and provide your explicit approval to proceed.
- **Step 10: Push to Main.** Once I receive your approval, I will push the committed changes to the remote `main` branch.

When asked to write a new blog post on a given topic, the agent should follow these steps:

1.  **Create the Draft:** Use the `gemini:new-draft "topic"` command to generate a structured outline, title, and tags.
2.  **Read the Draft:** Use the `read_file` tool to read the content of the newly created draft file.
3.  **Write the Full Post:** Based on the outline and topic, write a complete blog post, adhering to the style guidelines.
4.  **Save the Post:** Use the `write_file` tool to save the full content back to the markdown file.
5.  **Create a Branch:** Use `git checkout -b feat/blog-post-<slug>` to create a new branch for the post.
6.  **Commit the Changes:** Use `git add` and `git commit` to commit the new post with a conventional commit message (e.g., `feat: add blog post on 'topic'`).
7.  **Push to Remote:** Use `git push` to push the new branch to the remote repository.
8.  **Open a Pull Request:** Use the `gh pr create` command to open a new pull request for review.

### `gemini:write-blog-post "topic"`

**Action:** Researches a given topic, creates a new, well-structured blog post draft, and then writes the blog post.

- **Workflow:**
  1.  Uses the `gemini:new-draft` command to create a new blog post draft.
  2.  Reads the content of the newly created draft.
  3.  Uses the Google AI API to write the blog post based on the draft's outline.
  4.  Writes the generated content back to the file.
  5.  Creates a new branch, commits the changes, and creates a pull request.

- **Example:** `gemini:write-blog-post "The Orchestration Dance: Lessons from Working with Multiple AI Agents"`

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
   author: 'Jonathan Haas'
   pubDate: '2024-01-01'
   title: 'Your Post Title'
   description: 'Brief description (150-160 chars for SEO)'
   featured: false
   draft: true
   tags: ['tag1', 'tag2']
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

### Core Blog Features ✅ IMPLEMENTED

- **Search Functionality**: Full-text search across all blog posts with fuzzy matching
- **Analytics**: Cloudflare Web Analytics with comprehensive event tracking (page views, reading completion, social shares)
- **SEO**: Complete structured data (JSON-LD), XML sitemaps (216 URLs), meta tags, and validation tools
- **Related Posts**: Tag-based similarity algorithm using Jaccard similarity scoring
- **Reading Time**: Dynamic calculation (200 WPM) with word count, excludes code blocks
- **Social Sharing**: Twitter, LinkedIn, Hacker News + Web Share API with analytics tracking
- **Code Copy Buttons**: Hover-to-show copy buttons on all code blocks with language labels
- **Table of Contents**: Auto-generated TOC with active section highlighting
- **Reading Progress**: Enhanced progress bar with gradient, animations, and percentage indicator
- **Lazy Image Loading**: Intersection Observer with SVG placeholders and error handling
- **Print Optimization**: Comprehensive print stylesheet removing nav/interactive elements

### Performance & Optimization ✅ IMPLEMENTED

- **Bundle Optimization**: Sophisticated code splitting with manual chunks (vendor-react, vendor-ui, blog-utils, etc.)
- **Tree Shaking**: Enabled via Vite build configuration
- **Image Generation**: Automated social media images (1200x630, 800x384) for all posts
- **Content Validation**: SEO validation + frontmatter validation with scoring system

### Email & Subscriptions ⚠️ PARTIALLY WORKING

- **Email Automation**: Subscription system with welcome series (deployment configuration needs fixing)

### Missing Features (VALID TO SUGGEST)

- **Service Worker**: Offline reading and caching (not implemented)
- **Post Series Navigation**: Multi-part content navigation (not implemented)
- **Bookmark/Favorites**: Local storage favorites system (not implemented)
- **Modern Image Formats**: WebP/AVIF conversion (lazy loading exists, format optimization missing)
- **Core Web Vitals**: Performance monitoring beyond basic analytics (partially implemented)
- **Interactive Demos**: Embedded React components for calculators, simulators, and visualizations (not implemented)

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

### Interactive Components & Demos

#### Quick Start

```bash
# Generate a new interactive component with boilerplate
bun run new-interactive ComponentName -n "Display Name" -d "Description"

# Example:
bun run new-interactive ROICalculator -n "ROI Calculator" -d "Calculate return on investment"
```

#### Component Structure Pattern

All interactive components should follow this pattern:

1. **Multiple Tabs**: Setup → Analysis → Insights/Results
2. **Real-time Calculations**: Use `useMemo` for derived state
3. **Visual Feedback**: Charts, progress bars, or metric cards
4. **Educational Value**: Include insights, recommendations, or explanations
5. **Business Context**: Connect to real-world scenarios

#### VS Code Snippets Available

- `icstate` - Interactive component state setup
- `ictab` - Add a new tab section
- `icmetric` - Create a metric display
- `icslider` - Add a slider input
- `icchart` - Add a chart visualization

When creating blog posts, consider adding **interactive demos** to enhance engagement:

**Types of Interactive Demos to Create:**

- **SaaS Metrics Calculators**: Unit economics, LTV/CAC, growth projections
- **Technical Visualizations**: Algorithm demos, performance comparisons, architectural diagrams
- **Business Simulations**: Pricing strategy, A/B testing results, market scenarios
- **Product Demos**: Feature workflows, user experience flows, decision trees

**Implementation Guidelines:**

- Create React components in `src/components/` following existing patterns
- Register new components in `MarkdownRenderer.tsx` component registry
- Embed using custom tags: `<component-name prop="value" />`
- Keep demos focused and lightweight (avoid complex state management)
- Ensure demos work across devices and are accessible
- Include fallback text for non-JS environments

**Best Practices:**

- Match demos to post content (unit economics post = calculator demo)
- Use interactive elements that directly illustrate the concepts being discussed
- Provide clear value - demos should enhance understanding, not just be flashy
- Consider mobile responsiveness and touch interactions
- Add loading states and error handling

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

## Production Application Guidelines

### CRITICAL: No Mock Data Policy

**THIS IS A REAL PRODUCTION APPLICATION - MOCK DATA IS NEVER ALLOWED**

- **NEVER return mock data, fake responses, or placeholder content**
- All AI scripts must make real API calls to actual AI services
- All analysis functions must return real data from actual processing
- Mock data violates production application requirements
- If an API call fails, handle the error properly rather than returning fake data
- All outputs must be genuine results from the AI models

### Implementation Requirements

- Use real API endpoints (Anthropic Claude, Google Gemini)
- Parse actual AI responses, not simulated outputs
- Handle API errors gracefully with proper error messages
- Cache real responses, never fake data
- All scoring and analysis must be based on actual AI evaluation

## Content Protection and Destructive Action Guidelines

### CRITICAL: Content Preservation Rules

- **NEVER delete user content without explicit permission** - blog posts, code, configuration files are valuable work
- When user expresses frustration with technical issues, fix the problem, don't eliminate the content
- Distinguish between "I'm frustrated with this bug" vs "I want to delete this thing"
- Always preserve user work - treat all content as irreplaceable

### Before Any Destructive Action, Ask:

1. **What is the user's actual goal?** (Usually fixing a problem, not removing content)
2. **What would they lose if I do this?** (Hours of work, valuable content, configuration)
3. **Did they explicitly ask for this specific action?** (Must be clear and direct)
4. **Are there less destructive alternatives?** (Always try fixes before removal)

### When Users Express Frustration:

- **"I don't care anymore"** usually means "I'm tired of debugging" NOT "destroy my work"
- **"It's still broken"** means try different approaches, not give up and delete
- **"This isn't working"** means investigate root cause, not eliminate the thing
- Offer multiple solutions and alternatives before suggesting removal

### Required Confirmations for Destructive Actions:

- Deleting files: Get explicit "delete this file" or "remove this content"
- Removing features: Get clear confirmation they want functionality removed
- Reverting changes: Only if specifically requested
- State exactly what will be lost before taking action

### Reward Hacking Prevention:

- Don't optimize for making error messages disappear
- Don't treat "no errors" as success if functionality is lost
- The goal is working solutions, not eliminated problems
- Always consider what the user actually wants to achieve

## Blog Writing Style Guidelines

When creating or editing blog posts for Jonathan Haas, follow these specific style guidelines based on analysis of existing posts:

### Voice and Tone

- **Direct and conversational**: Address the reader as "you" throughout
- **Confident and authoritative**: Make bold statements backed by experience
- **Slightly irreverent**: Challenge conventional wisdom when appropriate
- **Practical over theoretical**: Focus on real-world application, not abstract concepts
- **No-nonsense approach**: Get straight to the point without unnecessary preamble

### Content Structure

#### Introductions

- Start with a **hook**: Personal anecdote, bold claim, or provocative statement
- **Problem-first approach**: Identify the pain point before offering solutions
- **Immediate value proposition**: Tell readers what they'll learn upfront
- Create **tension**: Set up contrast between common belief and reality

#### Body Content

- **Short paragraphs**: 2-4 sentences maximum, single-idea focus
- **Varied sentence rhythm**: Mix short, punchy sentences with longer explanatory ones
- **Strategic fragments**: Use incomplete sentences for emphasis
- **Visual breathing room**: Use spacing effectively between ideas

#### Transitions

- Use **rhetorical questions** to move between sections
- **Clear section headers**: ## for main sections, ### for subsections
- **Summary statements**: Wrap up one idea before moving to the next
- Ensure **logical flow**: Each section builds on the previous one

### Writing Patterns

#### Language Characteristics

- **Active voice** predominant
- **Present tense** for immediacy
- **Contractions** for conversational feel (don't, isn't, you'll)
- **Imperative mood** for advice ("Start shipping. Start learning.")

#### Examples and Evidence

- **Concrete scenarios**: "Scenario A vs Scenario B" comparisons
- **Specific numbers**: Use exact metrics and timeframes
- **Real-world references**: Draw from actual developer experiences
- **Physics/science metaphors**: When explaining abstract concepts

#### Code Integration

- **Context first**: Explain why the code matters before showing it
- **Minimal examples**: Show just enough code to make the point
- **Before/after patterns**: "Instead of X, do Y" structure
- **Practical focus**: Code that readers might actually encounter

### Formatting Preferences

- **Bold** for emphasis on key phrases and important concepts
- _Italics_ for subtle emphasis or voice modulation
- Numbered lists for processes or steps
- Bullet points for characteristics or examples
- Block quotes for important principles or standout ideas

### Emotional Intelligence

- **Acknowledge challenges**: Validate reader's frustrations first
- **Show empathy**: "I've been there" without being condescending
- **Balance criticism**: Always provide constructive alternatives
- **Encourage action**: End sections with clear next steps

### Call-to-Action Patterns

- **Soft CTAs**: "I'd love to hear how you've approached it"
- **Action-oriented conclusions**: Provide clear next steps
- **Encourage reflection**: Ask readers to think about their own situation
- **Community building**: Invite dialogue and shared experiences

### What to Avoid

- Long, academic paragraphs
- Excessive jargon without context
- Theoretical discussions without practical application
- Hedge words ("maybe", "perhaps", "might consider")
- Passive voice unless absolutely necessary
- Over-explaining simple concepts
- Unnecessary apologies or qualifiers

### Example Opening Pattern

```
I've [personal experience that sets up the problem].

[Bold statement that challenges conventional wisdom.]

[What the reader will learn/gain from this post.]
```

### Example Closing Pattern

```
[Summary of key insight]

[Clear action step]

[Soft invitation for engagement]
```
