#!/usr/bin/env bun

/**
 * Test script for the automated blog generation pipeline
 * This simulates what the GitHub Action will do
 */

import { parseArgs } from 'util'
import chalk from 'chalk'
import { promisify } from 'util'
import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    topic: {
      type: 'string',
      short: 't',
    },
    'dry-run': {
      type: 'boolean',
      short: 'd',
      default: false,
    },
    help: {
      type: 'boolean',
      short: 'h',
    },
  },
  strict: true,
  allowPositionals: true,
})

if (values.help) {
  console.log(`
${chalk.bold('Test Automated Blog Generation')}

${chalk.bold('Usage:')} bun scripts/test-auto-blog.ts [options]

${chalk.bold('Options:')}
  -t, --topic     Specific topic to test with
  -d, --dry-run   Don't actually create files, just show what would happen
  -h, --help      Show this help message

${chalk.bold('Examples:')}
  bun scripts/test-auto-blog.ts                    # Test with auto-generated topic
  bun scripts/test-auto-blog.ts -t "AI Testing"    # Test with specific topic
  bun scripts/test-auto-blog.ts -d                 # Dry run (no files created)
  `)
  process.exit(0)
}

interface TestResult {
  success: boolean
  topic: string
  postSlug?: string
  wordCount?: number
  qualityScore?: number
  errors: string[]
  warnings: string[]
}

class AutoBlogTester {
  private isDryRun: boolean
  private result: TestResult

  constructor(isDryRun: boolean = false) {
    this.isDryRun = isDryRun
    this.result = {
      success: false,
      topic: '',
      errors: [],
      warnings: [],
    }
  }

  async run(): Promise<TestResult> {
    try {
      console.log(chalk.blue('🧪 Testing Automated Blog Generation Pipeline\n'))

      if (this.isDryRun) {
        console.log(
          chalk.yellow('🏃 DRY RUN MODE - No files will be created\n')
        )
      }

      // Step 1: Test environment
      await this.testEnvironment()

      // Step 2: Generate or use provided topic
      const topic = await this.generateTestTopic()
      this.result.topic = topic

      // Step 3: Test blog generation
      if (!this.isDryRun) {
        const postSlug = await this.testBlogGeneration(topic)
        this.result.postSlug = postSlug

        // Step 4: Test quality validation
        await this.testQualityValidation(postSlug)

        // Step 5: Test cleanup (remove test post)
        await this.cleanup(postSlug)
      }

      this.result.success = this.result.errors.length === 0
      this.printResults()

      return this.result
    } catch (error) {
      this.result.errors.push(`Fatal error: ${error}`)
      this.result.success = false
      this.printResults()
      return this.result
    }
  }

  private async testEnvironment(): Promise<void> {
    console.log(chalk.yellow('🔧 Testing environment...'))

    // Check for API key
    if (!process.env.GOOGLE_AI_API_KEY) {
      this.result.errors.push('GOOGLE_AI_API_KEY environment variable not set')
    } else {
      console.log(chalk.green('  ✅ Google AI API key found'))
    }

    // Check required scripts
    const requiredScripts = ['gemini.ts', 'content-ideas.ts']
    for (const script of requiredScripts) {
      try {
        await fs.access(path.join(process.cwd(), 'scripts', script))
        console.log(chalk.green(`  ✅ ${script} found`))
      } catch {
        this.result.errors.push(`Required script missing: ${script}`)
      }
    }

    // Check posts directory
    try {
      await fs.access(path.join(process.cwd(), 'src', 'posts'))
      console.log(chalk.green('  ✅ Posts directory found'))
    } catch {
      this.result.errors.push('Posts directory not found')
    }

    console.log()
  }

  private async generateTestTopic(): Promise<string> {
    console.log(chalk.yellow('💡 Generating test topic...'))

    if (values.topic) {
      console.log(chalk.blue(`  Using provided topic: "${values.topic}"`))
      return values.topic
    }

    try {
      const { stdout } = await execAsync(
        'bun run ideas -n 3 -t practical-guide -f json'
      )
      const ideas = JSON.parse(stdout.trim())

      if (ideas.length > 0) {
        const topic = ideas[0].title
        console.log(chalk.green(`  ✅ Generated topic: "${topic}"`))
        return topic
      }
    } catch (error) {
      this.result.warnings.push(
        `Could not generate topic automatically: ${error}`
      )
    }

    // Fallback
    const fallbackTopic = 'Testing Automated Blog Generation: A Meta Experiment'
    console.log(chalk.yellow(`  ⚠️  Using fallback topic: "${fallbackTopic}"`))
    return fallbackTopic
  }

  private async testBlogGeneration(topic: string): Promise<string> {
    console.log(chalk.yellow('📝 Testing blog generation...'))

    try {
      // Generate the post
      const { stdout } = await execAsync(
        `bun scripts/gemini.ts new-draft "${topic}"`
      )

      // Extract slug from output
      const slugMatch = stdout.match(/🔗 Slug: ([^\n]+)/)
      if (!slugMatch) {
        throw new Error('Could not extract post slug from generation output')
      }

      const slug = slugMatch[1].trim()
      console.log(chalk.green(`  ✅ Draft created: ${slug}`))

      // Write full content
      await execAsync(`bun scripts/gemini.ts write-post "${slug}"`)
      console.log(chalk.green(`  ✅ Full post written`))

      return slug
    } catch (error) {
      this.result.errors.push(`Blog generation failed: ${error}`)
      throw error
    }
  }

  private async testQualityValidation(postSlug: string): Promise<void> {
    console.log(chalk.yellow('🔍 Testing quality validation...'))

    try {
      const postPath = path.join(
        process.cwd(),
        'src',
        'posts',
        `${postSlug}.md`
      )
      const content = await fs.readFile(postPath, 'utf-8')

      // Word count
      const wordCount = content.split(/\s+/).length
      this.result.wordCount = wordCount

      if (wordCount < 800) {
        this.result.warnings.push(
          `Post is short: ${wordCount} words (recommended: 800+)`
        )
      } else {
        console.log(chalk.green(`  ✅ Word count: ${wordCount} words`))
      }

      // Structure check
      const hasHeadings = content.includes('##')
      if (!hasHeadings) {
        this.result.warnings.push('Post lacks proper heading structure')
      } else {
        console.log(chalk.green('  ✅ Has proper heading structure'))
      }

      // Placeholder check
      const hasPlaceholders = /TODO|PLACEHOLDER|Lorem ipsum/i.test(content)
      if (hasPlaceholders) {
        this.result.warnings.push('Post contains placeholder content')
      } else {
        console.log(chalk.green('  ✅ No placeholder content detected'))
      }

      // Calculate quality score
      let score = 100
      if (wordCount < 800) score -= 20
      if (!hasHeadings) score -= 15
      if (hasPlaceholders) score -= 25
      if (this.result.warnings.length > 0) score -= 10

      this.result.qualityScore = Math.max(0, score)
      console.log(
        chalk.green(`  ✅ Quality score: ${this.result.qualityScore}/100`)
      )
    } catch (error) {
      this.result.errors.push(`Quality validation failed: ${error}`)
    }
  }

  private async cleanup(postSlug: string): Promise<void> {
    console.log(chalk.yellow('🧹 Cleaning up test files...'))

    try {
      const postPath = path.join(
        process.cwd(),
        'src',
        'posts',
        `${postSlug}.md`
      )
      await fs.unlink(postPath)
      console.log(chalk.green('  ✅ Test post removed'))
    } catch (error) {
      this.result.warnings.push(`Could not clean up test post: ${error}`)
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60))
    console.log(chalk.bold.blue('📊 TEST RESULTS'))
    console.log('='.repeat(60))

    console.log(
      `${chalk.bold('Status:')} ${this.result.success ? chalk.green('✅ PASS') : chalk.red('❌ FAIL')}`
    )
    console.log(`${chalk.bold('Topic:')} "${this.result.topic}"`)

    if (this.result.postSlug) {
      console.log(`${chalk.bold('Generated Post:')} ${this.result.postSlug}`)
    }

    if (this.result.wordCount) {
      console.log(`${chalk.bold('Word Count:')} ${this.result.wordCount}`)
    }

    if (this.result.qualityScore !== undefined) {
      const scoreColor =
        this.result.qualityScore >= 80
          ? chalk.green
          : this.result.qualityScore >= 60
            ? chalk.yellow
            : chalk.red
      console.log(
        `${chalk.bold('Quality Score:')} ${scoreColor(this.result.qualityScore + '/100')}`
      )
    }

    if (this.result.errors.length > 0) {
      console.log(`\n${chalk.red.bold('❌ ERRORS:')}`)
      this.result.errors.forEach((error) => {
        console.log(chalk.red(`  • ${error}`))
      })
    }

    if (this.result.warnings.length > 0) {
      console.log(`\n${chalk.yellow.bold('⚠️  WARNINGS:')}`)
      this.result.warnings.forEach((warning) => {
        console.log(chalk.yellow(`  • ${warning}`))
      })
    }

    if (this.result.success) {
      console.log(
        chalk.green('\n🎉 Automated blog generation is working correctly!')
      )
      console.log(
        chalk.blue('💡 You can now enable the GitHub Action workflow.')
      )
    } else {
      console.log(
        chalk.red(
          '\n🚨 Issues detected in the automated blog generation pipeline.'
        )
      )
      console.log(
        chalk.yellow('⚡ Fix the errors above before enabling automation.')
      )
    }

    console.log('\n' + '='.repeat(60))
  }
}

// Run the test
const tester = new AutoBlogTester(values['dry-run'])
const result = await tester.run()

// Exit with appropriate code
process.exit(result.success ? 0 : 1)
