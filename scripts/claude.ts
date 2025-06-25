#!/usr/bin/env bun

import { parseArgs } from 'util'
import chalk from 'chalk'
import { promisify } from 'util'
import { exec } from 'child_process'
import matter from 'gray-matter'
import fs from 'fs/promises'
import path from 'path'
import {
  BlogPostOutline,
  BlogPostContent,
  SocialMediaSnippets,
  TitleSuggestions,
  TagSuggestions,
  SEOAnalysis,
  ContentQuality,
  PostFrontmatter,
  AIResponse,
  RetryConfig,
  AIError,
  ValidationError,
  RateLimitError,
} from './lib/ai-types.js'

const execAsync = promisify(exec)

// Enhanced configuration for Claude
const CONFIG = {
  API: {
    URL: 'https://api.anthropic.com/v1/messages',
    MODEL: 'claude-3-5-sonnet-20241022',
    TIMEOUT: 60000, // 60 seconds for Claude
    MAX_TOKENS: 4096,
    RETRY: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 15000,
      backoffFactor: 2,
    } as RetryConfig,
  },
  POSTS_DIR: path.join(process.cwd(), 'src', 'posts'),
  CONTENT_PREVIEW_LENGTH: 2000, // Claude can handle more context
  AUDIENCE_DESCRIPTION:
    'experienced product managers, senior software engineers, and technical founders. They are busy, skeptical, and value practical, actionable insights over fluff.',
  CACHE_TTL: 10 * 60 * 1000, // 10 minutes for Claude
} as const

// Enhanced JSON extraction for Claude responses
class JSONExtractor {
  static extract<T = unknown>(text: string): T {
    const extractionMethods = [
      this.extractFromCodeBlock.bind(this),
      this.extractFromThinkingTags.bind(this),
      this.extractFromRawObject.bind(this),
      this.extractFromWholeText.bind(this),
    ]

    let lastError: Error | null = null

    for (const method of extractionMethods) {
      try {
        const result = method(text)
        if (result !== null) {
          return result as T
        }
      } catch (error) {
        lastError = error as Error
        continue
      }
    }

    throw new ValidationError(
      `Failed to extract valid JSON: ${lastError?.message || 'Unknown error'}`,
      'json_extraction',
      'claude'
    )
  }

  private static extractFromCodeBlock(text: string): unknown | null {
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (!jsonMatch) return null

    const jsonText = jsonMatch[1].trim()
    if (!jsonText) return null

    return JSON.parse(jsonText)
  }

  private static extractFromThinkingTags(text: string): unknown | null {
    // Claude sometimes uses <thinking> tags
    const thinkingMatch = text.match(
      /<thinking>[\s\S]*?<\/thinking>\s*({[\s\S]*})/
    )
    if (!thinkingMatch) return null

    return JSON.parse(thinkingMatch[1])
  }

  private static extractFromRawObject(text: string): unknown | null {
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (!objectMatch) return null

    return JSON.parse(objectMatch[0])
  }

  private static extractFromWholeText(text: string): unknown | null {
    const trimmed = text.trim()
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null

    return JSON.parse(trimmed)
  }
}

// Enhanced environment loader
class EnvironmentLoader {
  private static loaded = false

  static async load(): Promise<void> {
    if (this.loaded) return

    try {
      const envPath = path.join(process.cwd(), '.env')

      try {
        await fs.access(envPath)
      } catch {
        console.warn(
          chalk.yellow(
            '⚠️  .env file not found, using system environment variables'
          )
        )
        this.loaded = true
        return
      }

      const envFile = await fs.readFile(envPath, 'utf-8')
      const envVars = envFile
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))

      for (const line of envVars) {
        const equalIndex = line.indexOf('=')
        if (equalIndex === -1) continue

        const key = line.slice(0, equalIndex).trim()
        const value = line.slice(equalIndex + 1).trim()

        if (key && value) {
          const unquotedValue = value.replace(/^["']|["']$/g, '')
          process.env[key] = unquotedValue
        }
      }

      this.loaded = true
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Failed to load .env file:'), error)
      this.loaded = true
    }
  }

  static validateRequiredEnvVars(): void {
    const required = ['ANTHROPIC_API_KEY']
    const missing = required.filter((key) => !process.env[key])

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      )
    }
  }
}

// Simple in-memory cache
class SimpleCache<T> {
  private cache = new Map<string, { value: T; expires: number }>()

  set(key: string, value: T, ttl: number = CONFIG.CACHE_TTL): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Claude API client
class ClaudeAIClient {
  private readonly apiKey: string
  private readonly cache = new SimpleCache<string>()
  private lastRequestTime = 0
  private readonly minRequestInterval = 200 // 200ms between requests for Claude

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Please add it to your .env file.'
      )
    }
    this.apiKey = apiKey
  }

  async generateContent(
    prompt: string,
    systemPrompt?: string
  ): Promise<AIResponse<string>> {
    const startTime = Date.now()

    // Check cache first
    const cacheKey = this.getCacheKey(prompt + (systemPrompt || ''))
    const cached = this.cache.get(cacheKey)
    if (cached) {
      console.log(chalk.gray('📋 Using cached result'))
      return {
        data: cached,
        metadata: {
          model: CONFIG.API.MODEL,
          processing_time: Date.now() - startTime,
          cache_hit: true,
        },
      }
    }

    // Rate limiting
    await this.enforceRateLimit()

    // Make request with retry logic
    const result = await this.makeRequestWithRetry(prompt, systemPrompt)

    // Cache the result
    this.cache.set(cacheKey, result)

    return {
      data: result,
      metadata: {
        model: CONFIG.API.MODEL,
        processing_time: Date.now() - startTime,
        cache_hit: false,
      },
    }
  }

  private getCacheKey(prompt: string): string {
    return Buffer.from(prompt).toString('base64').slice(0, 32)
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest
      await this.sleep(delay)
    }

    this.lastRequestTime = Date.now()
  }

  private async makeRequestWithRetry(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    const { maxRetries, baseDelay, maxDelay, backoffFactor } = CONFIG.API.RETRY
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.makeRequest(prompt, systemPrompt)
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) break

        // Don't retry on certain errors
        if (
          error instanceof ValidationError ||
          (error instanceof AIError && error.statusCode === 401)
        ) {
          break
        }

        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        )

        console.log(
          chalk.yellow(
            `⏳ Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`
          )
        )

        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  private async makeRequest(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT)

    try {
      const messages = [
        {
          role: 'user',
          content: prompt,
        },
      ]

      const requestBody: {
        model: string
        max_tokens: number
        messages: Array<{ role: string; content: string }>
        system?: string
      } = {
        model: CONFIG.API.MODEL,
        max_tokens: CONFIG.API.MAX_TOKENS,
        messages,
      }

      if (systemPrompt) {
        requestBody.system = systemPrompt
      }

      const response = await fetch(CONFIG.API.URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text()

        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after')
          throw new RateLimitError(
            'Rate limit exceeded',
            'claude',
            retryAfter ? parseInt(retryAfter) * 1000 : undefined
          )
        }

        throw new AIError(
          `API request failed: ${response.statusText}`,
          'claude',
          response.status,
          errorBody
        )
      }

      const data: {
        content?: Array<{ type: string; text?: string }>
      } = await response.json()
      return this.extractTextFromResponse(data)
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIError('Request timeout', 'claude', 408)
      }

      throw error
    }
  }

  private extractTextFromResponse(data: {
    content?: Array<{ type: string; text?: string }>
  }): string {
    if (
      !data.content ||
      !Array.isArray(data.content) ||
      data.content.length === 0
    ) {
      throw new ValidationError(
        'Invalid response structure',
        'content',
        'claude'
      )
    }

    const textContent = data.content.find(
      (item: { type: string; text?: string }) => item.type === 'text'
    )
    if (!textContent || !textContent.text) {
      throw new ValidationError('No text content in response', 'text', 'claude')
    }

    return textContent.text
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number } {
    return { size: this.cache.size() }
  }
}

// Enhanced file operations
class BlogFileManager {
  static async readPost(postSlug: string): Promise<{
    filePath: string
    frontmatter: PostFrontmatter
    content: string
  }> {
    if (!postSlug || typeof postSlug !== 'string') {
      throw new ValidationError('Invalid post slug', 'postSlug', 'claude')
    }

    const filePath = path.join(CONFIG.POSTS_DIR, `${postSlug}.md`)

    try {
      await fs.access(filePath)

      const fileContent = await fs.readFile(filePath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent)

      return { filePath, frontmatter: frontmatter as PostFrontmatter, content }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ValidationError(
          `Post file not found: ${postSlug}`,
          'file',
          'claude'
        )
      }
      throw error
    }
  }

  static async getStagedMarkdownFiles(): Promise<string[]> {
    try {
      const { stdout: stagedFilesOutput } = await execAsync(
        'git ls-files --cached'
      )
      const stagedFiles = stagedFilesOutput.trim().split('\n')
      return stagedFiles.filter(
        (file) => file.endsWith('.md') && file.startsWith('src/posts/')
      )
    } catch (error) {
      throw new Error(`Failed to get staged files: ${error}`)
    }
  }

  static async writePost(
    filePath: string,
    content: string,
    frontmatter: PostFrontmatter
  ): Promise<void> {
    if (!filePath || !content) {
      throw new ValidationError(
        'Invalid file path or content',
        undefined,
        'claude'
      )
    }

    try {
      const newFileContent = matter.stringify(content, frontmatter)
      await fs.writeFile(filePath, newFileContent, 'utf-8')
    } catch (error) {
      throw new Error(`Failed to write post: ${error}`)
    }
  }

  static async validatePostsDirectory(): Promise<void> {
    try {
      await fs.access(CONFIG.POSTS_DIR)
    } catch {
      throw new Error(`Posts directory not found: ${CONFIG.POSTS_DIR}`)
    }
  }
}

// Enhanced prompt templates for Claude
class PromptTemplates {
  static createBlogOutline(topic: string): string {
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      throw new ValidationError(
        'Topic must be at least 3 characters long',
        'topic',
        'claude'
      )
    }

    return `You are a world-class content strategist and writer for a top-tier technical blog.
Your audience consists of ${CONFIG.AUDIENCE_DESCRIPTION}

Your task is to generate a compelling, well-structured blog post outline for the following topic.

**Topic:** "${topic.trim()}"

Please provide your response in valid JSON format only, with no additional text or formatting:

{
  "title": "A catchy, SEO-friendly title (under 60 characters)",
  "description": "A meta description (120-160 characters) that summarizes the post and entices readers",
  "tags": [
    "tag-one",
    "tag-two", 
    "tag-three",
    "tag-four",
    "tag-five"
  ],
  "outline": "A detailed markdown outline starting with an H2 (##) for the introduction, having at least 3-4 main sections using H2s, and ending with an H2 for the conclusion. Provide 2-3 bullet points under each heading to guide the writing process."
}`
  }

  static analyzeSEO(
    title: string,
    description: string,
    content: string
  ): string {
    return `You are an expert SEO analyst for technical blogs. Analyze the following blog post content for SEO optimization opportunities.

**Title:** "${title}"
**Description:** "${description}"
**Content:**
${content.substring(0, CONFIG.CONTENT_PREVIEW_LENGTH)}...

Provide your analysis in valid JSON format:

{
  "score": 85,
  "issues": [
    {
      "type": "title",
      "severity": "warning",
      "message": "Title could be more descriptive",
      "fix": "Consider adding specific technical terms"
    }
  ],
  "recommendations": [
    "Add more relevant keywords naturally throughout the content",
    "Improve heading structure for better readability"
  ],
  "keywords": ["primary-keyword", "secondary-keyword"],
  "readability": 78
}`
  }

  static analyzeQuality(content: string): string {
    return `You are an expert content quality analyst for technical blogs. Analyze the following content for quality, clarity, engagement, and completeness.

**Content:**
${content.substring(0, CONFIG.CONTENT_PREVIEW_LENGTH)}...

Provide your analysis in valid JSON format:

{
  "score": 82,
  "metrics": {
    "clarity": 85,
    "engagement": 78,
    "technical_accuracy": 90,
    "completeness": 75
  },
  "feedback": [
    "Excellent technical depth and accuracy",
    "Could benefit from more practical examples"
  ],
  "improvements": [
    "Add code examples to illustrate key concepts",
    "Include more real-world use cases",
    "Consider adding a troubleshooting section"
  ]
}`
  }

  static createSocialMediaSnippets(
    title: string,
    description: string,
    contentSnippet: string
  ): string {
    return `You are a savvy social media strategist for a high-traffic technical blog.
Your audience consists of ${CONFIG.AUDIENCE_DESCRIPTION} on platforms like Twitter/X and LinkedIn.

Generate engaging social media snippets for this blog post:

**Title:** "${title}"
**Description:** "${description}"
**Content Snippet:**
${contentSnippet}

Provide your response in valid JSON format:

{
  "twitter": "A concise and compelling tweet (under 280 characters) that includes a hook, a key insight, and relevant hashtags",
  "linkedin": "A more detailed and professional LinkedIn post with a strong hook, brief summary, bullet points for key takeaways, and a question to encourage discussion. Include relevant hashtags."
}`
  }

  private static validateStringInputs(inputs: Record<string, string>): void {
    for (const [key, value] of Object.entries(inputs)) {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new ValidationError(`${key} cannot be empty`, key, 'claude')
      }
    }
  }
}

// Enhanced command handler
class CommandHandler {
  constructor(private aiClient: ClaudeAIClient) {}

  async newDraft(topic: string): Promise<void> {
    if (!topic?.trim()) {
      throw new ValidationError('Topic is required', 'topic', 'claude')
    }

    console.log(chalk.blue(`📝 Creating new draft for topic: "${topic}"\n`))

    try {
      console.log(
        chalk.yellow('🤖 Generating blog post outline with Claude...')
      )
      const prompt = PromptTemplates.createBlogOutline(topic)
      const response = await this.aiClient.generateContent(prompt)
      const parsedContent = JSONExtractor.extract<BlogPostOutline>(
        response.data
      )

      this.validateBlogPostOutline(parsedContent)

      const { title, description, tags, outline } = parsedContent

      console.log(chalk.yellow('\nCreating new post file...'))
      await this.createNewPostFile(title, description, tags, outline)

      console.log(chalk.green('\n✅ New draft created successfully!'))
      console.log(
        chalk.gray(`Processing time: ${response.metadata.processing_time}ms`)
      )
    } catch (error) {
      this.handleError(error, 'creating new draft')
    }
  }

  async analyzeSEO(postSlug: string): Promise<void> {
    if (!postSlug?.trim()) {
      throw new ValidationError('Post slug is required', 'postSlug', 'claude')
    }

    console.log(chalk.blue(`🔍 Analyzing SEO for post: "${postSlug}"\n`))

    try {
      const { frontmatter, content } = await BlogFileManager.readPost(postSlug)

      if (!frontmatter.title) {
        throw new ValidationError(
          'Post does not have a title.',
          'title',
          'claude'
        )
      }

      console.log(chalk.yellow('🤖 Analyzing SEO with Claude...'))
      const prompt = PromptTemplates.analyzeSEO(
        frontmatter.title,
        frontmatter.description || '',
        content
      )

      const response = await this.aiClient.generateContent(prompt)
      const analysis = JSONExtractor.extract<SEOAnalysis>(response.data)

      this.displaySEOAnalysis(analysis)
    } catch (error) {
      this.handleError(error, 'analyzing SEO')
    }
  }

  async analyzeQuality(postSlug: string): Promise<void> {
    if (!postSlug?.trim()) {
      throw new ValidationError('Post slug is required', 'postSlug', 'claude')
    }

    console.log(
      chalk.blue(`📊 Analyzing content quality for post: "${postSlug}"\n`)
    )

    try {
      const { content } = await BlogFileManager.readPost(postSlug)

      console.log(chalk.yellow('🤖 Analyzing content quality with Claude...'))
      const prompt = PromptTemplates.analyzeQuality(content)

      const response = await this.aiClient.generateContent(prompt)
      const analysis = JSONExtractor.extract<ContentQuality>(response.data)

      this.displayQualityAnalysis(analysis)
    } catch (error) {
      this.handleError(error, 'analyzing content quality')
    }
  }

  private displaySEOAnalysis(analysis: SEOAnalysis): void {
    console.log(chalk.green('🔍 SEO Analysis Results:\n'))
    console.log(chalk.cyan(`Overall Score: ${analysis.score}/100`))
    console.log(chalk.cyan(`Readability Score: ${analysis.readability}/100\n`))

    if (analysis.issues.length > 0) {
      console.log(chalk.yellow('Issues Found:'))
      analysis.issues.forEach((issue) => {
        const icon =
          issue.severity === 'error'
            ? '❌'
            : issue.severity === 'warning'
              ? '⚠️'
              : 'ℹ️'
        console.log(`  ${icon} ${issue.message}`)
        if (issue.fix) {
          console.log(chalk.gray(`     Fix: ${issue.fix}`))
        }
      })
      console.log()
    }

    if (analysis.recommendations.length > 0) {
      console.log(chalk.blue('Recommendations:'))
      analysis.recommendations.forEach((rec) => {
        console.log(`  • ${rec}`)
      })
      console.log()
    }

    if (analysis.keywords.length > 0) {
      console.log(chalk.magenta('Suggested Keywords:'))
      console.log(`  ${analysis.keywords.join(', ')}\n`)
    }
  }

  private displayQualityAnalysis(analysis: ContentQuality): void {
    console.log(chalk.green('📊 Content Quality Analysis:\n'))
    console.log(chalk.cyan(`Overall Score: ${analysis.score}/100\n`))

    console.log(chalk.blue('Quality Metrics:'))
    console.log(`  Clarity: ${analysis.metrics.clarity}/100`)
    console.log(`  Engagement: ${analysis.metrics.engagement}/100`)
    console.log(
      `  Technical Accuracy: ${analysis.metrics.technical_accuracy}/100`
    )
    console.log(`  Completeness: ${analysis.metrics.completeness}/100\n`)

    if (analysis.feedback.length > 0) {
      console.log(chalk.yellow('Feedback:'))
      analysis.feedback.forEach((feedback) => {
        console.log(`  • ${feedback}`)
      })
      console.log()
    }

    if (analysis.improvements.length > 0) {
      console.log(chalk.magenta('Suggested Improvements:'))
      analysis.improvements.forEach((improvement) => {
        console.log(`  • ${improvement}`)
      })
      console.log()
    }
  }

  // Validation methods
  private validateBlogPostOutline(
    data: unknown
  ): asserts data is BlogPostOutline {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid response format', 'response', 'claude')
    }

    const outline = data as Partial<BlogPostOutline>

    if (!outline.title || typeof outline.title !== 'string') {
      throw new ValidationError('Missing or invalid title', 'title', 'claude')
    }

    if (!outline.description || typeof outline.description !== 'string') {
      throw new ValidationError(
        'Missing or invalid description',
        'description',
        'claude'
      )
    }

    if (!Array.isArray(outline.tags) || outline.tags.length === 0) {
      throw new ValidationError(
        'Missing or invalid tags array',
        'tags',
        'claude'
      )
    }

    if (!outline.outline || typeof outline.outline !== 'string') {
      throw new ValidationError(
        'Missing or invalid outline',
        'outline',
        'claude'
      )
    }
  }

  // Helper methods
  private async createNewPostFile(
    title: string,
    description: string,
    tags: string[],
    content: string
  ): Promise<void> {
    const newPostArgs = [
      'bun',
      'run',
      'scripts/new-post.ts',
      title,
      '--tags',
      tags.join(','),
      '--description',
      description,
      '--content',
      content,
    ]

    try {
      const proc = Bun.spawn(newPostArgs, { stdout: 'pipe', stderr: 'pipe' })
      const output = await new Response(proc.stdout).text()
      const errorOutput = await new Response(proc.stderr).text()

      await proc.exited

      if (proc.exitCode !== 0) {
        throw new Error(`Post creation failed: ${errorOutput || output}`)
      }

      console.log(output)
    } catch (error) {
      throw new Error(`Failed to create post file: ${error}`)
    }
  }

  private handleError(error: unknown, operation: string): never {
    if (error instanceof ValidationError) {
      console.error(
        chalk.red(`❌ Validation error while ${operation}:`),
        error.message
      )
      if (error.field) {
        console.error(chalk.gray(`   Field: ${error.field}`))
      }
    } else if (error instanceof AIError) {
      console.error(
        chalk.red(`❌ Claude API error while ${operation}:`),
        error.message
      )
      if (error.statusCode) {
        console.error(chalk.gray(`   Status Code: ${error.statusCode}`))
      }
    } else if (error instanceof RateLimitError) {
      console.error(
        chalk.red(`❌ Rate limit exceeded while ${operation}:`),
        error.message
      )
      if (error.retryAfter) {
        console.error(chalk.gray(`   Retry after: ${error.retryAfter}ms`))
      }
    } else {
      console.error(
        chalk.red(`❌ An error occurred while ${operation}:`),
        error
      )
    }

    process.exit(1)
  }
}

// Enhanced CLI
class CLI {
  private commandHandler: CommandHandler | null = null

  async run(): Promise<void> {
    try {
      await this.initialize()
      await this.parseAndExecuteCommand()
    } catch (error) {
      this.handleFatalError(error)
    }
  }

  private async initialize(): Promise<void> {
    await EnvironmentLoader.load()
    EnvironmentLoader.validateRequiredEnvVars()
    await BlogFileManager.validatePostsDirectory()

    const aiClient = new ClaudeAIClient()
    this.commandHandler = new CommandHandler(aiClient)

    console.log(chalk.gray('🚀 Claude AI Assistant initialized'))
  }

  private async parseAndExecuteCommand(): Promise<void> {
    const { positionals } = parseArgs({
      args: Bun.argv,
      allowPositionals: true,
    })

    const command = positionals[2]
    const args = positionals.slice(3)

    if (!command) {
      this.showUsage()
      process.exit(1)
    }

    await this.executeCommand(command, args)
  }

  private async executeCommand(command: string, args: string[]): Promise<void> {
    if (!this.commandHandler) {
      throw new Error('Command handler not initialized')
    }

    const topic = args.join(' ')

    switch (command) {
      case 'new-draft':
        await this.commandHandler.newDraft(topic)
        break
      case 'analyze-seo':
        await this.commandHandler.analyzeSEO(topic)
        break
      case 'analyze-quality':
        await this.commandHandler.analyzeQuality(topic)
        break
      case 'status':
        this.showStatus()
        break
      default:
        console.error(chalk.red(`❌ Error: Unknown command "${command}"`))
        this.showUsage()
        process.exit(1)
    }
  }

  private showStatus(): void {
    console.log(chalk.blue('📊 Claude AI Assistant Status:'))
    console.log(chalk.gray(`  Posts Directory: ${CONFIG.POSTS_DIR}`))
    console.log(chalk.gray(`  Model: ${CONFIG.API.MODEL}`))
    console.log(chalk.gray(`  API Timeout: ${CONFIG.API.TIMEOUT}ms`))
    console.log(chalk.gray(`  Cache TTL: ${CONFIG.CACHE_TTL}ms`))
    console.log(chalk.gray(`  Max Retries: ${CONFIG.API.RETRY.maxRetries}`))
  }

  private showUsage(): void {
    console.error(chalk.red('❌ Error: Please provide a command.'))
    console.error('Usage: bun run claude <command> [args]')
    console.error('\nAvailable commands:')
    console.error(
      '  new-draft <topic>        - Create a new draft with outline'
    )
    console.error('  analyze-seo <post-slug>  - Analyze SEO for a post')
    console.error('  analyze-quality <post-slug> - Analyze content quality')
    console.error('  status                   - Show system status')
  }

  private handleFatalError(error: unknown): never {
    console.error(chalk.red('\n💥 Fatal error occurred:'))

    if (error instanceof ValidationError) {
      console.error(chalk.red(`Validation Error: ${error.message}`))
      if (error.field) {
        console.error(chalk.gray(`Field: ${error.field}`))
      }
    } else if (error instanceof AIError) {
      console.error(chalk.red(`Claude API Error: ${error.message}`))
      if (error.statusCode) {
        console.error(chalk.gray(`Status Code: ${error.statusCode}`))
      }
    } else if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`))
      if (process.env.NODE_ENV === 'development') {
        console.error(chalk.gray(error.stack))
      }
    } else {
      console.error(chalk.red('Unknown error:'), error)
    }

    console.error(chalk.yellow('\n💡 Troubleshooting tips:'))
    console.error('  • Check your .env file contains ANTHROPIC_API_KEY')
    console.error('  • Verify your internet connection')
    console.error('  • Check the posts directory exists')

    process.exit(1)
  }
}

// Main entry point
if (import.meta.main) {
  new CLI().run().catch(console.error)
}
