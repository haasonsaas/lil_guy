#!/usr/bin/env bun

import chalk from 'chalk'

async function demoMultiAISystem() {
  console.log(chalk.blue('🚀 Multi-AI Content System Demo\n'))

  console.log(chalk.cyan('Available Commands:\n'))

  console.log(chalk.yellow('1. Individual AI Agents:'))
  console.log(
    '  bun run gemini new-draft "Topic"       - Generate content with Gemini'
  )
  console.log(
    '  bun run gemini social post-slug        - Generate social snippets'
  )
  console.log(
    '  bun run gemini propose-titles "Topic"  - Get title suggestions'
  )
  console.log('  bun run gemini status                  - Show Gemini status\n')

  console.log(
    '  bun run claude new-draft "Topic"       - Generate content with Claude'
  )
  console.log(
    '  bun run claude analyze-seo post-slug   - Analyze SEO with Claude'
  )
  console.log('  bun run claude analyze-quality post-slug - Analyze quality')
  console.log('  bun run claude status                  - Show Claude status\n')

  console.log(chalk.yellow('2. AI Orchestrator (Multi-Agent Workflows):'))
  console.log(
    '  bun run ai-orchestrator create-and-run "Topic"  - Full automated pipeline'
  )
  console.log(
    '  bun run ai-orchestrator create "Topic"          - Create workflow'
  )
  console.log(
    '  bun run ai-orchestrator execute <workflow-id>   - Execute workflow'
  )
  console.log(
    '  bun run ai-orchestrator agents                  - Show agent status'
  )
  console.log(
    '  bun run ai-orchestrator list                    - List workflows\n'
  )

  console.log(chalk.yellow('3. Enhanced Content Pipeline:'))
  console.log('  bun run enhanced-pipeline create "Topic" --agent claude')
  console.log(
    '  bun run enhanced-pipeline create "Topic" --skip-seo --output file'
  )
  console.log('  bun run enhanced-pipeline analyze existing-post.md')
  console.log('  bun run enhanced-pipeline config\n')

  console.log(chalk.green('🎯 Key Features:'))
  console.log(
    '  ✅ Dual AI agents (Gemini + Claude) with specialized capabilities'
  )
  console.log('  ✅ Automated workflow orchestration and task distribution')
  console.log('  ✅ AI-powered SEO analysis and optimization recommendations')
  console.log('  ✅ Content quality scoring and improvement suggestions')
  console.log('  ✅ Social media content generation')
  console.log('  ✅ Comprehensive error handling and retry logic')
  console.log('  ✅ Caching system for improved performance')
  console.log('  ✅ Rate limiting and API management')
  console.log('  ✅ Flexible pipeline configuration\n')

  console.log(chalk.magenta('🔧 Configuration:'))
  console.log('  Add ANTHROPIC_API_KEY to your .env file for Claude')
  console.log('  GOOGLE_AI_API_KEY is already configured for Gemini\n')

  console.log(chalk.blue('🚀 Try the enhanced pipeline:'))
  console.log(
    chalk.white(
      '  bun run enhanced-pipeline create "Building Multi-AI Systems" --agent claude\n'
    )
  )
}

if (import.meta.main) {
  demoMultiAISystem()
}
