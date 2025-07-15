#!/usr/bin/env bun

import { parseArgs } from 'util'
import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { GoogleGenerativeAI } from '@google/generative-ai'
import ora from 'ora'

interface WritingFeedback {
  overall_score: number
  style_consistency: {
    score: number
    issues: string[]
    suggestions: string[]
  }
  clarity: {
    score: number
    complex_sentences: string[]
    suggestions: string[]
  }
  engagement: {
    score: number
    hook_effectiveness: number
    suggestions: string[]
  }
  seo_optimization: {
    score: number
    title_analysis: string
    description_analysis: string
    suggestions: string[]
  }
  technical_accuracy: {
    score: number
    potential_issues: string[]
    fact_check_needed: string[]
  }
  voice_match: {
    score: number
    deviations: string[]
    suggestions: string[]
  }
  structure: {
    score: number
    flow_issues: string[]
    suggestions: string[]
  }
  actionable_improvements: {
    priority: 'high' | 'medium' | 'low'
    task: string
    reason: string
  }[]
}

// Your writing style characteristics (learned from existing posts)
const JONATHAN_STYLE = {
  voice: {
    tone: 'direct, conversational, confident',
    perspective: 'first-person with authority',
    approach: 'contrarian with evidence',
  },
  patterns: {
    openings: ['personal anecdote', 'bold claim', 'provocative question'],
    paragraph_length: '2-4 sentences',
    sentence_variety: 'mix short punchy with longer explanatory',
    transitions: 'rhetorical questions, clear headers',
  },
  vocabulary: {
    avoid: ['maybe', 'perhaps', 'might consider', 'it seems'],
    prefer: ["here's", 'let me', 'the truth is', 'actually'],
  },
  structure: {
    ideal_word_count: '800-1200',
    sections: '5-8 with clear headers',
    conclusion: 'actionable with clear next steps',
  },
}

async function analyzeWritingStyle(
  content: string,
  frontmatter: Record<string, unknown>
): Promise<WritingFeedback> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
You are an expert writing coach analyzing a blog post draft. The author's established style is:

${JSON.stringify(JONATHAN_STYLE, null, 2)}

Analyze this blog post and provide detailed feedback:

Title: ${frontmatter.title}
Description: ${frontmatter.description}

Content:
${content}

Provide your analysis in this exact JSON format:
{
  "overall_score": <0-100>,
  "style_consistency": {
    "score": <0-100>,
    "issues": ["specific style deviations"],
    "suggestions": ["how to fix each issue"]
  },
  "clarity": {
    "score": <0-100>,
    "complex_sentences": ["sentences that are too complex"],
    "suggestions": ["simpler alternatives"]
  },
  "engagement": {
    "score": <0-100>,
    "hook_effectiveness": <0-100>,
    "suggestions": ["ways to increase engagement"]
  },
  "seo_optimization": {
    "score": <0-100>,
    "title_analysis": "is it too long/short, compelling?",
    "description_analysis": "is it 150-160 chars, compelling?",
    "suggestions": ["specific improvements"]
  },
  "technical_accuracy": {
    "score": <0-100>,
    "potential_issues": ["statements that might be incorrect"],
    "fact_check_needed": ["claims that need verification"]
  },
  "voice_match": {
    "score": <0-100>,
    "deviations": ["where it doesn't sound like the author"],
    "suggestions": ["how to match voice better"]
  },
  "structure": {
    "score": <0-100>,
    "flow_issues": ["where the flow breaks"],
    "suggestions": ["how to improve structure"]
  },
  "actionable_improvements": [
    {
      "priority": "high|medium|low",
      "task": "specific thing to fix",
      "reason": "why it matters"
    }
  ]
}

Focus on:
1. Does it match the author's established voice and style?
2. Is it clear and engaging?
3. Does it follow the structural patterns?
4. Are there any weak arguments or unsupported claims?
5. Will it resonate with developers and technical leaders?
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error analyzing writing:', error)
    throw error
  }
}

function formatFeedback(feedback: WritingFeedback): void {
  console.log('\n' + chalk.bold('📝 AI Writing Coach Analysis'))
  console.log('='.repeat(50))

  // Overall Score with color coding
  const scoreColor =
    feedback.overall_score >= 80
      ? chalk.green
      : feedback.overall_score >= 60
        ? chalk.yellow
        : chalk.red
  console.log(chalk.bold('\nOverall Score: ') + scoreColor(`${feedback.overall_score}/100`))

  // Category Scores
  console.log(chalk.bold('\n📊 Category Breakdown:'))
  const categories = [
    {
      name: 'Style Consistency',
      score: feedback.style_consistency.score,
      emoji: '🎨',
    },
    { name: 'Clarity', score: feedback.clarity.score, emoji: '💡' },
    { name: 'Engagement', score: feedback.engagement.score, emoji: '🎯' },
    {
      name: 'SEO Optimization',
      score: feedback.seo_optimization.score,
      emoji: '🔍',
    },
    {
      name: 'Technical Accuracy',
      score: feedback.technical_accuracy.score,
      emoji: '🔧',
    },
    { name: 'Voice Match', score: feedback.voice_match.score, emoji: '🗣️' },
    { name: 'Structure', score: feedback.structure.score, emoji: '🏗️' },
  ]

  categories.forEach((cat) => {
    const color = cat.score >= 80 ? chalk.green : cat.score >= 60 ? chalk.yellow : chalk.red
    console.log(`  ${cat.emoji} ${cat.name}: ${color(cat.score + '/100')}`)
  })

  // High Priority Improvements
  const highPriority = feedback.actionable_improvements.filter((i) => i.priority === 'high')
  if (highPriority.length > 0) {
    console.log(chalk.bold.red('\n🚨 High Priority Improvements:'))
    highPriority.forEach((improvement, i) => {
      console.log(chalk.red(`  ${i + 1}. ${improvement.task}`))
      console.log(chalk.gray(`     → ${improvement.reason}`))
    })
  }

  // Detailed Feedback by Category
  if (feedback.style_consistency.issues.length > 0) {
    console.log(chalk.bold('\n🎨 Style Issues:'))
    feedback.style_consistency.issues.forEach((issue, i) => {
      console.log(chalk.yellow(`  • ${issue}`))
      if (feedback.style_consistency.suggestions[i]) {
        console.log(chalk.gray(`    → ${feedback.style_consistency.suggestions[i]}`))
      }
    })
  }

  if (feedback.clarity.complex_sentences.length > 0) {
    console.log(chalk.bold('\n💡 Clarity Issues:'))
    console.log(chalk.yellow('  Complex sentences found:'))
    feedback.clarity.complex_sentences.slice(0, 3).forEach((sentence) => {
      console.log(chalk.gray(`  • "${sentence.substring(0, 80)}..."`))
    })
  }

  if (feedback.seo_optimization.score < 80) {
    console.log(chalk.bold('\n🔍 SEO Optimization:'))
    console.log(chalk.yellow(`  Title: ${feedback.seo_optimization.title_analysis}`))
    console.log(chalk.yellow(`  Description: ${feedback.seo_optimization.description_analysis}`))
  }

  if (feedback.technical_accuracy.fact_check_needed.length > 0) {
    console.log(chalk.bold('\n🔧 Fact Check Needed:'))
    feedback.technical_accuracy.fact_check_needed.forEach((fact) => {
      console.log(chalk.yellow(`  • ${fact}`))
    })
  }

  // Medium Priority Improvements
  const mediumPriority = feedback.actionable_improvements.filter((i) => i.priority === 'medium')
  if (mediumPriority.length > 0) {
    console.log(chalk.bold('\n⚡ Suggested Improvements:'))
    mediumPriority.forEach((improvement, i) => {
      console.log(chalk.yellow(`  ${i + 1}. ${improvement.task}`))
    })
  }

  // Summary
  console.log(chalk.bold('\n📋 Summary:'))
  if (feedback.overall_score >= 80) {
    console.log(chalk.green('  ✅ This post is ready to publish with minor tweaks!'))
  } else if (feedback.overall_score >= 60) {
    console.log(chalk.yellow('  ⚠️  This post needs some work before publishing.'))
  } else {
    console.log(chalk.red('  ❌ This post needs significant revision.'))
  }

  console.log('\n' + '='.repeat(50) + '\n')
}

async function watchForChanges(filePath: string): Promise<void> {
  console.log(chalk.blue(`\n👀 Watching ${path.basename(filePath)} for changes...`))
  console.log(chalk.gray('Press Ctrl+C to stop\n'))

  let lastAnalysis = Date.now()
  const DEBOUNCE_MS = 3000 // Wait 3 seconds after last change

  const watcher = fs.watch(filePath)

  for await (const event of watcher) {
    if (event.eventType === 'change') {
      const now = Date.now()
      if (now - lastAnalysis > DEBOUNCE_MS) {
        lastAnalysis = now
        console.log(chalk.gray('\n🔄 File changed, analyzing...\n'))

        try {
          const content = await fs.readFile(filePath, 'utf-8')
          const { data: frontmatter, content: body } = matter(content)

          if (body.trim().length < 100) {
            console.log(chalk.gray('Post too short to analyze (< 100 chars). Keep writing!'))
            continue
          }

          const spinner = ora('Analyzing your writing...').start()
          const feedback = await analyzeWritingStyle(body, frontmatter)
          spinner.succeed('Analysis complete!')

          formatFeedback(feedback)
        } catch (error) {
          console.error(chalk.red('Error analyzing file:'), error)
        }
      }
    }
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      watch: { type: 'boolean', short: 'w', default: false },
      file: { type: 'string', short: 'f' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: false,
    allowPositionals: true,
  })

  if (values.help) {
    console.log(`
${chalk.bold('AI Writing Coach for Blog Posts')}

${chalk.bold('Usage:')}
  bun run writing-coach [options] [file]

${chalk.bold('Options:')}
  -f, --file <path>    Analyze a specific blog post file
  -w, --watch          Watch file for changes and provide real-time feedback
  -h, --help           Show this help message

${chalk.bold('Examples:')}
  bun run writing-coach post.md              # Analyze post.md once
  bun run writing-coach -w draft.md          # Watch draft.md for changes
  bun run writing-coach -f src/posts/new.md  # Analyze specific file

${chalk.bold('Features:')}
  • Analyzes writing style consistency
  • Checks clarity and readability
  • Evaluates engagement and hook effectiveness
  • Provides SEO optimization tips
  • Ensures voice matches your established style
  • Suggests structural improvements
  • Gives prioritized action items
`)
    process.exit(0)
  }

  // Check for API key
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.error(chalk.red('❌ GOOGLE_AI_API_KEY environment variable not set'))
    console.log(chalk.yellow('Add it to your .env file or export it:'))
    console.log(chalk.gray('export GOOGLE_AI_API_KEY="your-api-key"'))
    process.exit(1)
  }

  // Get file path
  const filePath = values.file || positionals[0]
  if (!filePath) {
    console.error(chalk.red('❌ Please provide a file to analyze'))
    console.log(chalk.gray('Run with --help for usage information'))
    process.exit(1)
  }

  // Check if file exists
  try {
    await fs.access(filePath)
  } catch {
    console.error(chalk.red(`❌ File not found: ${filePath}`))
    process.exit(1)
  }

  // Read and analyze file
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const { data: frontmatter, content: body } = matter(content)

    if (body.trim().length < 100) {
      console.error(chalk.red('❌ Post too short to analyze (< 100 characters)'))
      process.exit(1)
    }

    const spinner = ora('Analyzing your writing...').start()
    const feedback = await analyzeWritingStyle(body, frontmatter)
    spinner.succeed('Analysis complete!')

    formatFeedback(feedback)

    // Watch mode
    if (values.watch) {
      await watchForChanges(filePath)
    }
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error)
    process.exit(1)
  }
}

main().catch(console.error)
