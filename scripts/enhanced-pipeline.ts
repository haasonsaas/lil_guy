#!/usr/bin/env bun

import { parseArgs } from 'util'
import chalk from 'chalk'
import { promisify } from 'util'
import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import {
  BlogPostContent,
  SEOAnalysis,
  ContentQuality,
  SocialMediaSnippets,
  PostFrontmatter,
  ContentPipelineConfig,
  ValidationError,
} from './lib/ai-types.js'

const execAsync = promisify(exec)

// Enhanced content pipeline configuration
const PIPELINE_CONFIG: ContentPipelineConfig = {
  enableSEOAnalysis: true,
  enableQualityCheck: true,
  enableSocialGeneration: true,
  requireHumanReview: true,
  autoPublish: false,
  qualityThreshold: 75,
  seoThreshold: 70,
}

interface PipelineResult {
  content: BlogPostContent
  seoAnalysis?: SEOAnalysis
  qualityAnalysis?: ContentQuality
  socialSnippets?: SocialMediaSnippets
  filename: string
  recommendations: string[]
  passed: boolean
  score: number
}

interface PipelineStep {
  name: string
  description: string
  agent: 'gemini' | 'claude'
  command: string
  required: boolean
  threshold?: number
}

class EnhancedContentPipeline {
  private readonly postsDir = path.join(process.cwd(), 'src', 'posts')
  private readonly outputDir = path.join(process.cwd(), 'output', 'pipeline')

  constructor(private config: ContentPipelineConfig = PIPELINE_CONFIG) {}

  async createContent(
    topic: string,
    options: {
      preferredAgent?: 'gemini' | 'claude'
      skipSEO?: boolean
      skipQuality?: boolean
      skipSocial?: boolean
      outputFormat?: 'console' | 'file' | 'both'
    } = {}
  ): Promise<PipelineResult> {
    console.log(
      chalk.blue(`🚀 Starting enhanced content pipeline for: "${topic}"`)
    )
    console.log(
      chalk.gray(
        `Configuration: SEO=${!options.skipSEO}, Quality=${!options.skipQuality}, Social=${!options.skipSocial}\n`
      )
    )

    const startTime = Date.now()
    const result: Partial<PipelineResult> = {
      recommendations: [],
      passed: false,
      score: 0,
    }

    try {
      // Step 1: Generate initial content
      console.log(chalk.yellow('📝 Step 1: Generating content...'))
      const agent = options.preferredAgent || 'gemini'
      result.content = await this.generateContent(topic, agent)
      result.filename = this.generateFilename(result.content.title)

      console.log(
        chalk.green(`✅ Content generated: "${result.content.title}"`)
      )

      // Create temporary file for analysis
      const tempFile = await this.createTempFile(
        result.content,
        result.filename
      )

      // Step 2: SEO Analysis
      if (!options.skipSEO && this.config.enableSEOAnalysis) {
        console.log(chalk.yellow('\n🔍 Step 2: SEO Analysis...'))
        result.seoAnalysis = await this.runSEOAnalysis(tempFile)

        const seoScore = result.seoAnalysis.score
        console.log(chalk.cyan(`SEO Score: ${seoScore}/100`))

        if (seoScore < this.config.seoThreshold) {
          result.recommendations.push(
            `SEO score (${seoScore}) below threshold (${this.config.seoThreshold})`
          )
          result.recommendations.push(...result.seoAnalysis.recommendations)
        }
      }

      // Step 3: Quality Analysis
      if (!options.skipQuality && this.config.enableQualityCheck) {
        console.log(chalk.yellow('\n📊 Step 3: Quality Analysis...'))
        result.qualityAnalysis = await this.runQualityAnalysis(tempFile)

        const qualityScore = result.qualityAnalysis.score
        console.log(chalk.cyan(`Quality Score: ${qualityScore}/100`))

        if (qualityScore < this.config.qualityThreshold) {
          result.recommendations.push(
            `Quality score (${qualityScore}) below threshold (${this.config.qualityThreshold})`
          )
          result.recommendations.push(...result.qualityAnalysis.improvements)
        }
      }

      // Step 4: Social Media Generation
      if (!options.skipSocial && this.config.enableSocialGeneration) {
        console.log(
          chalk.yellow('\n🐦 Step 4: Generating social media content...')
        )
        result.socialSnippets = await this.generateSocialContent(tempFile)
        console.log(chalk.green('✅ Social media snippets generated'))
      }

      // Step 5: Calculate overall score and determine if pipeline passed
      result.score = this.calculateOverallScore(result)
      result.passed = this.evaluatePassingCriteria(result)

      // Step 6: Generate recommendations
      await this.generateRecommendations(result as PipelineResult)

      // Step 7: Output results
      await this.outputResults(
        result as PipelineResult,
        options.outputFormat || 'console'
      )

      // Cleanup
      await fs.unlink(tempFile)

      const duration = Math.round((Date.now() - startTime) / 1000)
      console.log(chalk.blue(`\n🎉 Pipeline completed in ${duration}s`))

      if (result.passed) {
        console.log(chalk.green('✅ Content meets all quality criteria'))
      } else {
        console.log(
          chalk.yellow('⚠️  Content requires improvements before publication')
        )
      }

      return result as PipelineResult
    } catch (error) {
      console.error(chalk.red('\n❌ Pipeline failed:'), error)
      throw error
    }
  }

  private async generateContent(
    topic: string,
    agent: 'gemini' | 'claude'
  ): Promise<BlogPostContent> {
    try {
      const command = `bun scripts/${agent}.ts new-draft "${topic}"`
      const { stdout, stderr } = await execAsync(command)

      if (stderr) {
        console.warn(chalk.yellow('Warning:'), stderr)
      }

      // Extract filename from output
      const filenameMatch = stdout.match(/📁 Path: ([^\n]+)/)
      if (!filenameMatch) {
        throw new Error('Could not extract filename from agent output')
      }

      const filename = filenameMatch[1]

      // Read the generated file
      const fileContent = await fs.readFile(filename, 'utf-8')
      const matter = await import('gray-matter')
      const { data: frontmatter, content } = matter.default(fileContent)

      return {
        title: frontmatter.title || topic,
        description: frontmatter.description || '',
        tags: frontmatter.tags || [],
        outline: '', // Not needed for full content
        content: content,
      }
    } catch (error) {
      throw new Error(`Content generation failed: ${error}`)
    }
  }

  private async runSEOAnalysis(filename: string): Promise<SEOAnalysis> {
    try {
      const postSlug = path.basename(filename, '.md')
      const command = `bun scripts/claude.ts analyze-seo "${postSlug}"`

      const { stdout, stderr } = await execAsync(command)

      if (stderr) {
        console.warn(chalk.yellow('SEO Analysis warning:'), stderr)
      }

      // Parse Claude's actual output for SEO analysis
      try {
        // Look for JSON in the output
        const jsonMatch = stdout.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0])

          // Validate the structure matches SEOAnalysis interface
          if (
            typeof analysis.score === 'number' &&
            Array.isArray(analysis.recommendations)
          ) {
            return analysis as SEOAnalysis
          }
        }
      } catch (parseError) {
        console.warn(
          'Failed to parse SEO analysis JSON, using default structure'
        )
      }

      // Fallback: extract key metrics from text output
      const scoreMatch = stdout.match(/Score[:\s]*(\d+)/i)
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 75

      return {
        score,
        issues: [],
        recommendations: ['Run detailed SEO analysis for more insights'],
        keywords: [],
        readability: 75,
      }
    } catch (error) {
      throw new Error(`SEO analysis failed: ${error}`)
    }
  }

  private async runQualityAnalysis(filename: string): Promise<ContentQuality> {
    try {
      const postSlug = path.basename(filename, '.md')
      const command = `bun scripts/claude.ts analyze-quality "${postSlug}"`

      const { stdout, stderr } = await execAsync(command)

      if (stderr) {
        console.warn(chalk.yellow('Quality Analysis warning:'), stderr)
      }

      // Parse Claude's actual output for quality analysis
      try {
        // Look for JSON in the output
        const jsonMatch = stdout.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0])

          // Validate the structure matches ContentQuality interface
          if (typeof analysis.score === 'number' && analysis.metrics) {
            return analysis as ContentQuality
          }
        }
      } catch (parseError) {
        console.warn(
          'Failed to parse quality analysis JSON, using default structure'
        )
      }

      // Fallback: extract key metrics from text output
      const scoreMatch = stdout.match(/Score[:\s]*(\d+)/i)
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 75

      return {
        score,
        metrics: {
          clarity: 75,
          engagement: 75,
          technical_accuracy: 80,
          completeness: 70,
        },
        feedback: ['Analysis completed - check output for details'],
        improvements: [
          'Run detailed quality analysis for specific recommendations',
        ],
      }
    } catch (error) {
      throw new Error(`Quality analysis failed: ${error}`)
    }
  }

  private async generateSocialContent(
    filename: string
  ): Promise<SocialMediaSnippets> {
    try {
      const postSlug = path.basename(filename, '.md')
      const command = `bun scripts/gemini.ts social "${postSlug}"`

      const { stdout, stderr } = await execAsync(command)

      if (stderr) {
        console.warn(chalk.yellow('Social Media generation warning:'), stderr)
      }

      // Parse Gemini's actual output for social media snippets
      try {
        // Look for JSON in the output
        const jsonMatch = stdout.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const snippets = JSON.parse(jsonMatch[0])

          // Validate the structure matches SocialMediaSnippets interface
          if (snippets.twitter && snippets.linkedin) {
            return snippets as SocialMediaSnippets
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse social media JSON, extracting from text')
      }

      // Fallback: extract snippets from text output
      const twitterMatch = stdout.match(
        /--- Twitter\/X ---\s*\n(.*?)(?:\n---|$)/s
      )
      const linkedinMatch = stdout.match(
        /--- LinkedIn ---\s*\n(.*?)(?:\n---|$)/s
      )

      return {
        twitter: twitterMatch
          ? twitterMatch[1].trim()
          : 'Social media snippet generated - check output for details',
        linkedin: linkedinMatch
          ? linkedinMatch[1].trim()
          : 'LinkedIn post generated - check output for details',
      }
    } catch (error) {
      throw new Error(`Social content generation failed: ${error}`)
    }
  }

  private async createTempFile(
    content: BlogPostContent,
    filename: string
  ): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp')
    await fs.mkdir(tempDir, { recursive: true })

    const tempFile = path.join(tempDir, filename)
    const matter = await import('gray-matter')

    const frontmatter = {
      title: content.title,
      description: content.description,
      tags: content.tags,
      author: 'AI Pipeline',
      draft: true,
      pubDate: new Date().toISOString().split('T')[0],
    }

    const fileContent = matter.default.stringify(content.content, frontmatter)
    await fs.writeFile(tempFile, fileContent)

    return tempFile
  }

  private generateFilename(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100) + '.md'
    )
  }

  private calculateOverallScore(result: Partial<PipelineResult>): number {
    let totalScore = 0
    let weights = 0

    if (result.seoAnalysis) {
      totalScore += result.seoAnalysis.score * 0.3
      weights += 0.3
    }

    if (result.qualityAnalysis) {
      totalScore += result.qualityAnalysis.score * 0.5
      weights += 0.5
    }

    if (result.socialSnippets) {
      totalScore += 85 * 0.2 // Assume social generation is successful if completed
      weights += 0.2
    }

    return weights > 0 ? Math.round(totalScore / weights) : 0
  }

  private evaluatePassingCriteria(result: Partial<PipelineResult>): boolean {
    const checks = []

    if (result.seoAnalysis) {
      checks.push(result.seoAnalysis.score >= this.config.seoThreshold)
    }

    if (result.qualityAnalysis) {
      checks.push(result.qualityAnalysis.score >= this.config.qualityThreshold)
    }

    // Content must exist
    checks.push(!!result.content)

    return checks.length > 0 && checks.every((check) => check)
  }

  private async generateRecommendations(result: PipelineResult): Promise<void> {
    // Add specific recommendations based on analysis
    if (result.seoAnalysis) {
      if (result.seoAnalysis.score < 80) {
        result.recommendations.push(
          'Consider running additional SEO optimization'
        )
      }

      if (result.seoAnalysis.readability < 70) {
        result.recommendations.push(
          'Improve content readability with shorter sentences and simpler language'
        )
      }
    }

    if (result.qualityAnalysis) {
      if (result.qualityAnalysis.metrics.engagement < 75) {
        result.recommendations.push(
          'Add more engaging elements like examples, stories, or interactive content'
        )
      }

      if (result.qualityAnalysis.metrics.completeness < 80) {
        result.recommendations.push(
          'Expand content with more comprehensive coverage of the topic'
        )
      }
    }

    // Add content-specific recommendations
    const wordCount = result.content.content.split(/\s+/).length
    if (wordCount < 1000) {
      result.recommendations.push(
        'Consider expanding content - current length may be too short for comprehensive coverage'
      )
    }

    if (wordCount > 3000) {
      result.recommendations.push(
        'Consider breaking content into multiple parts or adding more subheadings for better readability'
      )
    }
  }

  private async outputResults(
    result: PipelineResult,
    format: 'console' | 'file' | 'both'
  ): Promise<void> {
    const reportContent = this.generateReport(result)

    if (format === 'console' || format === 'both') {
      console.log(reportContent)
    }

    if (format === 'file' || format === 'both') {
      await fs.mkdir(this.outputDir, { recursive: true })
      const reportFile = path.join(
        this.outputDir,
        `pipeline-report-${Date.now()}.md`
      )
      await fs.writeFile(reportFile, reportContent)
      console.log(chalk.gray(`📄 Report saved to: ${reportFile}`))
    }
  }

  private generateReport(result: PipelineResult): string {
    let report = chalk.blue('\n📊 Content Pipeline Report\n')
    report += chalk.gray('='.repeat(50)) + '\n\n'

    report += chalk.cyan('📝 Content Details:\n')
    report += `  Title: ${result.content.title}\n`
    report += `  Description: ${result.content.description}\n`
    report += `  Tags: ${result.content.tags.join(', ')}\n`
    report += `  Word Count: ${result.content.content.split(/\s+/).length}\n`
    report += `  Filename: ${result.filename}\n\n`

    if (result.seoAnalysis) {
      report += chalk.cyan('🔍 SEO Analysis:\n')
      report += `  Score: ${result.seoAnalysis.score}/100\n`
      report += `  Readability: ${result.seoAnalysis.readability}/100\n`
      report += `  Keywords: ${result.seoAnalysis.keywords.join(', ')}\n`

      if (result.seoAnalysis.issues.length > 0) {
        report += '  Issues:\n'
        result.seoAnalysis.issues.forEach((issue) => {
          report += `    • ${issue.message}\n`
        })
      }
      report += '\n'
    }

    if (result.qualityAnalysis) {
      report += chalk.cyan('📊 Quality Analysis:\n')
      report += `  Overall Score: ${result.qualityAnalysis.score}/100\n`
      report += `  Clarity: ${result.qualityAnalysis.metrics.clarity}/100\n`
      report += `  Engagement: ${result.qualityAnalysis.metrics.engagement}/100\n`
      report += `  Technical Accuracy: ${result.qualityAnalysis.metrics.technical_accuracy}/100\n`
      report += `  Completeness: ${result.qualityAnalysis.metrics.completeness}/100\n\n`
    }

    if (result.socialSnippets) {
      report += chalk.cyan('🐦 Social Media Content:\n')
      report += `  Twitter: ${result.socialSnippets.twitter.substring(0, 100)}...\n`
      report += `  LinkedIn: ${result.socialSnippets.linkedin.substring(0, 100)}...\n\n`
    }

    report += chalk.cyan('🎯 Overall Assessment:\n')
    report += `  Score: ${result.score}/100\n`
    report += `  Status: ${result.passed ? chalk.green('✅ PASSED') : chalk.yellow('⚠️  NEEDS IMPROVEMENT')}\n\n`

    if (result.recommendations.length > 0) {
      report += chalk.cyan('💡 Recommendations:\n')
      result.recommendations.forEach((rec) => {
        report += `  • ${rec}\n`
      })
      report += '\n'
    }

    return report
  }

  async runExistingContentAnalysis(filename: string): Promise<PipelineResult> {
    console.log(chalk.blue(`🔍 Analyzing existing content: ${filename}`))

    const filePath = path.join(this.postsDir, filename)

    try {
      await fs.access(filePath)
    } catch {
      throw new ValidationError(`File not found: ${filename}`)
    }

    const fileContent = await fs.readFile(filePath, 'utf-8')
    const matter = await import('gray-matter')
    const { data: frontmatter, content } = matter.default(fileContent)

    const blogContent: BlogPostContent = {
      title: frontmatter.title || 'Untitled',
      description: frontmatter.description || '',
      tags: frontmatter.tags || [],
      outline: '',
      content: content,
    }

    const result: Partial<PipelineResult> = {
      content: blogContent,
      filename,
      recommendations: [],
      passed: false,
      score: 0,
    }

    // Run analyses
    if (this.config.enableSEOAnalysis) {
      result.seoAnalysis = await this.runSEOAnalysis(filePath)
    }

    if (this.config.enableQualityCheck) {
      result.qualityAnalysis = await this.runQualityAnalysis(filePath)
    }

    if (this.config.enableSocialGeneration) {
      result.socialSnippets = await this.generateSocialContent(filePath)
    }

    result.score = this.calculateOverallScore(result)
    result.passed = this.evaluatePassingCriteria(result)
    await this.generateRecommendations(result as PipelineResult)

    return result as PipelineResult
  }
}

// CLI interface
class PipelineCLI {
  private pipeline: EnhancedContentPipeline

  constructor() {
    this.pipeline = new EnhancedContentPipeline()
  }

  async run(): Promise<void> {
    const { positionals, values } = parseArgs({
      args: Bun.argv,
      allowPositionals: true,
      options: {
        agent: { type: 'string', short: 'a' },
        'skip-seo': { type: 'boolean' },
        'skip-quality': { type: 'boolean' },
        'skip-social': { type: 'boolean' },
        output: { type: 'string', short: 'o' },
      },
    })

    const command = positionals[2]
    const args = positionals.slice(3)

    if (!command) {
      this.showUsage()
      process.exit(1)
    }

    try {
      await this.executeCommand(command, args, values)
    } catch (error) {
      console.error(chalk.red('❌ Command failed:'), error)
      process.exit(1)
    }
  }

  private async executeCommand(
    command: string,
    args: string[],
    options: Record<string, unknown>
  ): Promise<void> {
    switch (command) {
      case 'create':
        await this.createContent(args, options)
        break
      case 'analyze':
        await this.analyzeContent(args, options)
        break
      case 'config':
        this.showConfig()
        break
      default:
        console.error(chalk.red(`❌ Unknown command: ${command}`))
        this.showUsage()
        process.exit(1)
    }
  }

  private async createContent(
    args: string[],
    options: Record<string, unknown>
  ): Promise<void> {
    const topic = args.join(' ')
    if (!topic) {
      throw new Error('Topic is required')
    }

    const pipelineOptions = {
      preferredAgent: options.agent as 'gemini' | 'claude',
      skipSEO: options['skip-seo'],
      skipQuality: options['skip-quality'],
      skipSocial: options['skip-social'],
      outputFormat: options.output as 'console' | 'file' | 'both',
    }

    await this.pipeline.createContent(topic, pipelineOptions)
  }

  private async analyzeContent(
    args: string[],
    options: Record<string, unknown>
  ): Promise<void> {
    const filename = args[0]
    if (!filename) {
      throw new Error('Filename is required')
    }

    const result = await this.pipeline.runExistingContentAnalysis(filename)
    console.log(`\n📊 Analysis complete for: ${filename}`)
  }

  private showConfig(): void {
    console.log(chalk.blue('⚙️  Pipeline Configuration:'))
    console.log(
      `  SEO Analysis: ${PIPELINE_CONFIG.enableSEOAnalysis ? '✅' : '❌'}`
    )
    console.log(
      `  Quality Check: ${PIPELINE_CONFIG.enableQualityCheck ? '✅' : '❌'}`
    )
    console.log(
      `  Social Generation: ${PIPELINE_CONFIG.enableSocialGeneration ? '✅' : '❌'}`
    )
    console.log(
      `  Human Review Required: ${PIPELINE_CONFIG.requireHumanReview ? '✅' : '❌'}`
    )
    console.log(`  Auto Publish: ${PIPELINE_CONFIG.autoPublish ? '✅' : '❌'}`)
    console.log(`  Quality Threshold: ${PIPELINE_CONFIG.qualityThreshold}`)
    console.log(`  SEO Threshold: ${PIPELINE_CONFIG.seoThreshold}`)
  }

  private showUsage(): void {
    console.error(chalk.red('❌ Please provide a command.'))
    console.error('Usage: bun run enhanced-pipeline <command> [options]')
    console.error('\nCommands:')
    console.error(
      '  create <topic>     - Create content through the full pipeline'
    )
    console.error('  analyze <filename> - Analyze existing content')
    console.error('  config             - Show pipeline configuration')
    console.error('\nOptions:')
    console.error('  -a, --agent <name>    - Preferred agent (gemini|claude)')
    console.error('  --skip-seo            - Skip SEO analysis')
    console.error('  --skip-quality        - Skip quality analysis')
    console.error('  --skip-social         - Skip social media generation')
    console.error('  -o, --output <format> - Output format (console|file|both)')
    console.error('\nExamples:')
    console.error(
      '  bun run enhanced-pipeline create "AI-Powered DevOps" --agent claude'
    )
    console.error('  bun run enhanced-pipeline analyze my-post.md')
  }
}

// Main entry point
if (import.meta.main) {
  new PipelineCLI().run().catch(console.error)
}
