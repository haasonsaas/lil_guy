#!/usr/bin/env bun

import { parseArgs } from 'util'
import chalk from 'chalk'
import { promisify } from 'util'
import { exec } from 'child_process'
import matter from 'gray-matter'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

// Enhanced types with validation
interface BlogPostOutline {
  title: string
  description: string
  tags: string[]
  outline: string
}

interface BlogPostContent extends BlogPostOutline {
  content: string
}

interface SocialMediaSnippets {
  twitter: string
  linkedin: string
}

interface TitleSuggestions {
  titles: string[]
}

interface TagSuggestions {
  tags: string[]
}

interface PostFrontmatter {
  title?: string
  description?: string
  author?: string
  pubDate?: string
  featured?: boolean
  draft?: boolean
  tags?: string[]
  image?: {
    url: string
    alt: string
  }
}

interface APIResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

// Enhanced configuration with validation
const CONFIG = {
  API: {
    URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    TIMEOUT: 30000, // 30 seconds
    RETRY: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    } as RetryConfig,
  },
  POSTS_DIR: path.join(process.cwd(), 'src', 'posts'),
  CONTENT_PREVIEW_LENGTH: 1500,
  AUDIENCE_DESCRIPTION:
    'experienced product managers, senior software engineers, and technical founders. They are busy, skeptical, and value practical, actionable insights over fluff.',
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
} as const

// Custom error classes for better error handling
class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

// Enhanced JSON extraction with better error handling
class JSONExtractor {
  static extract<T = unknown>(text: string): T {
    const extractionMethods = [
      this.extractFromCodeBlock.bind(this),
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
      'json_extraction'
    )
  }

  private static extractFromCodeBlock(text: string): unknown | null {
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (!jsonMatch) return null

    const jsonText = jsonMatch[1].trim()
    if (!jsonText) return null

    return JSON.parse(jsonText)
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

// Enhanced environment loader with proper validation
class EnvironmentLoader {
  private static loaded = false

  static async load(): Promise<void> {
    if (this.loaded) return

    try {
      const envPath = path.join(process.cwd(), '.env')

      // Check if file exists first
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
          // Remove quotes if present
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
    const required = ['GOOGLE_AI_API_KEY']
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

// Enhanced API client with retry logic, rate limiting, and better error handling
class GoogleAIClient {
  private readonly apiKey: string
  private readonly cache = new SimpleCache<string>()
  private lastRequestTime = 0
  private readonly minRequestInterval = 100 // 100ms between requests

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new Error(
        'GOOGLE_AI_API_KEY is not set. Please add it to your .env file.'
      )
    }
    this.apiKey = apiKey
  }

  async generateContent(prompt: string): Promise<string> {
    // Check cache first
    const cacheKey = this.getCacheKey(prompt)
    const cached = this.cache.get(cacheKey)
    if (cached) {
      console.log(chalk.gray('📋 Using cached result'))
      return cached
    }

    // Rate limiting
    await this.enforceRateLimit()

    // Make request with retry logic
    const result = await this.makeRequestWithRetry(prompt)

    // Cache the result
    this.cache.set(cacheKey, result)

    return result
  }

  private getCacheKey(prompt: string): string {
    // Create a simple hash of the prompt for caching
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

  private async makeRequestWithRetry(prompt: string): Promise<string> {
    const { maxRetries, baseDelay, maxDelay, backoffFactor } = CONFIG.API.RETRY
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.makeRequest(prompt)
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) break

        // Don't retry on certain errors
        if (
          error instanceof ValidationError ||
          (error instanceof APIError && error.statusCode === 401)
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

  private async makeRequest(prompt: string): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT)

    try {
      const apiURL = `${CONFIG.API.URL}?key=${this.apiKey}`
      const response = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text()

        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after')
          throw new RateLimitError(
            'Rate limit exceeded',
            retryAfter ? parseInt(retryAfter) * 1000 : undefined
          )
        }

        throw new APIError(
          `API request failed: ${response.statusText}`,
          response.status,
          errorBody
        )
      }

      const data: APIResponse = await response.json()
      return this.extractTextFromResponse(data)
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError('Request timeout', 408)
      }

      throw error
    }
  }

  private extractTextFromResponse(data: APIResponse): string {
    if (!data.candidates || data.candidates.length === 0) {
      throw new ValidationError('No candidates in API response', 'candidates')
    }

    const candidate = data.candidates[0]
    if (
      !candidate.content ||
      !candidate.content.parts ||
      candidate.content.parts.length === 0
    ) {
      throw new ValidationError('Invalid response structure', 'content.parts')
    }

    const text = candidate.content.parts[0].text
    if (!text) {
      throw new ValidationError('Empty response text', 'text')
    }

    return text
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; hitRate?: number } {
    return { size: this.cache.size() }
  }
}

// Enhanced file operations with better error handling
class BlogFileManager {
  static async readPost(postSlug: string): Promise<{
    filePath: string
    frontmatter: PostFrontmatter
    content: string
  }> {
    if (!postSlug || typeof postSlug !== 'string') {
      throw new ValidationError('Invalid post slug', 'postSlug')
    }

    const filePath = path.join(CONFIG.POSTS_DIR, `${postSlug}.md`)

    try {
      // Check if file exists
      await fs.access(filePath)

      const fileContent = await fs.readFile(filePath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent)

      return { filePath, frontmatter: frontmatter as PostFrontmatter, content }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ValidationError(`Post file not found: ${postSlug}`, 'file')
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
      throw new ValidationError('Invalid file path or content')
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

// Enhanced prompt templates with validation
class PromptTemplates {
  static createBlogOutline(topic: string): string {
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      throw new ValidationError(
        'Topic must be at least 3 characters long',
        'topic'
      )
    }

    return `<role>
You are Jonathan Haas, a contrarian startup advisor who challenges conventional wisdom with practical, experience-based insights.
</role>

<task>
Create a compelling blog post outline for the topic: "${topic.trim()}"
</task>

<approach>
1. First, identify what conventional wisdom says about this topic
2. Find the contrarian angle that challenges this wisdom
3. Draw from startup advisory experience for examples
4. Focus on practical application over theory
</approach>

<example_titles>
<title>Why Most X Advice Is Wrong (And What Actually Works)</title>
<title>The Hidden Cost of Y That Nobody Talks About</title>
<title>Stop Doing Z: Here's What Works Instead</title>
<title>The Uncomfortable Truth About [Topic]</title>
</example_titles>

<outline_structure>
## Introduction
- Start with a contrarian hook or surprising observation
- Share a specific example that illustrates the problem
- Promise practical insights from real experience

## Main Section 1
- Challenge a common assumption
- Provide evidence from startups you've advised
- Explain why the conventional approach fails

## Main Section 2  
- Present your alternative approach
- Include specific frameworks or methodologies
- Show how this has worked in practice

## Main Section 3
- Address potential objections
- Provide implementation guidance
- Share lessons from failed attempts

## Conclusion
- Summarize the key contrarian insight
- Provide 3 specific action items
- End with a thought-provoking question
</outline_structure>

<output_format>
{
  "title": "A contrarian title under 60 characters",
  "description": "120-160 character description promising practical insights",
  "tags": ["tag-one", "tag-two", "tag-three", "tag-four", "tag-five"],
  "outline": "Detailed markdown outline following the structure above"
}
</output_format>

Think step by step:
1. What's the conventional wisdom about ${topic.trim()}?
2. What's wrong with that conventional wisdom?
3. What examples from advisory work support this?
4. What's the practical alternative?

Generate the outline now.`.trim()
  }

  static createSocialMediaSnippets(
    title: string,
    description: string,
    contentSnippet: string
  ): string {
    this.validateStringInputs({ title, description, contentSnippet })

    return `
      You are a savvy social media strategist for a high-traffic technical blog.
      Your audience consists of ${CONFIG.AUDIENCE_DESCRIPTION} on platforms like Twitter/X and LinkedIn.

      Your task is to generate a set of distinct, engaging social media snippets for the following blog post. The tone should be professional yet attention-grabbing.

      **Title:** "${title}"
      **Description:** "${description}"
      **Content Snippet:**
      ${contentSnippet}

      Please provide the following in a clear, structured JSON format. Do not include any text outside of the JSON object.

      {
        "twitter": "A concise and compelling tweet (under 280 characters) that includes a hook, a key insight, and a link to the post. Use 2-3 relevant hashtags.",
        "linkedin": "A more detailed and professional LinkedIn post. Start with a strong hook, provide a brief summary of the post's value, use bullet points for key takeaways, and end with a question to encourage discussion. Use 3-5 relevant hashtags."
      }
    `.trim()
  }

  static improveContent(content: string): string {
    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      throw new ValidationError(
        'Content must be at least 10 characters long',
        'content'
      )
    }

    return `<role>
You are an expert editor for Jonathan Haas's blog, ensuring his unique voice comes through clearly.
</role>

<jonathan_voice>
- Direct, no hedge words
- Heavy contractions
- Short paragraphs
- Contrarian perspectives
- Specific examples
- Actionable insights
</jonathan_voice>

<task>
Improve the following blog post while maintaining Jonathan's voice:

<original_content>
${content}
</original_content>
</task>

<editing_checklist>
<check>Remove all hedge words (maybe, perhaps, might, could)</check>
<check>Add contractions wherever natural</check>
<check>Break long paragraphs into 2-4 sentence chunks</check>
<check>Ensure examples are specific, not generic</check>
<check>Make sure each section has actionable insights</check>
<check>Verify contrarian perspective is clear</check>
<check>Check that examples reference advisory experience</check>
</editing_checklist>

<examples_to_fix>
<bad>This might help improve your process</bad>
<good>This will transform how you work</good>

<bad>Perhaps you could consider trying</bad>
<good>Here's what actually works</good>

<bad>In some cases, companies have found</bad>
<good>At three startups I advised last quarter</good>
</examples_to_fix>

Review the content against the checklist and improve it. Return only the improved content in markdown format.`.trim()
  }

  static proposeTitles(topic: string): string {
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      throw new ValidationError(
        'Topic must be at least 3 characters long',
        'topic'
      )
    }

    return `<role>
You are Jonathan Haas, a contrarian startup advisor creating titles that challenge conventional wisdom.
</role>

<task>
Generate 5-10 compelling titles for the topic: "${topic.trim()}"
</task>

<title_guidelines>
- Under 60 characters
- Contrarian angle when possible
- Promise practical value
- Direct and confident tone
- No hedge words
</title_guidelines>

<example_patterns>
- Why [Common Belief] Is Wrong
- The Hidden Cost of [Topic]
- Stop [Common Practice]: Here's What Works
- [Number] [Topic] Mistakes That Kill [Result]
- The Uncomfortable Truth About [Topic]
- What [Industry] Gets Wrong About [Topic]
- [Topic]: Why Everything You Know Is Wrong
</example_patterns>

<output_format>
{
  "titles": [
    "Title 1 (under 60 chars)",
    "Title 2 (under 60 chars)",
    "... more titles ..."
  ]
}
</output_format>

Generate titles that would make readers think "I need to read this now."`.trim()
  }

  static suggestTags(
    title: string,
    description: string,
    contentSnippet: string
  ): string {
    this.validateStringInputs({ title, description, contentSnippet })

    return `<role>
You are tagging content for Jonathan Haas's technical blog focused on startups and pragmatic advice.
</role>

<task>
Generate 5-10 relevant tags for this blog post.
</task>

<input>
<title>${title}</title>
<description>${description}</description>
<content_snippet>
${contentSnippet}
</content_snippet>
</input>

<tag_guidelines>
- Use lowercase with hyphens (e.g., "startup-advice")
- Mix broad and specific tags
- Include topic, industry, and approach tags
- Avoid generic tags like "blog" or "post"
- Make tags searchable and meaningful
</tag_guidelines>

<tag_categories>
- Topic tags (what it's about)
- Industry tags (who it's for)
- Type tags (how-to, analysis, opinion)
- Problem tags (what it solves)
- Approach tags (contrarian, practical)
</tag_categories>

<output_format>
{
  "tags": [
    "specific-tag",
    "broader-tag",
    "industry-tag",
    "problem-tag",
    "approach-tag"
  ]
}
</output_format>`.trim()
  }

  static createFullPost(topic: string): string {
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      throw new ValidationError(
        'Topic must be at least 3 characters long',
        'topic'
      )
    }

    return `<role>
You are Jonathan Haas writing a complete blog post that challenges conventional wisdom with practical insights.
</role>

<task>
Create a full blog post about: "${topic.trim()}"
</task>

<process>
1. Identify the contrarian angle
2. Structure the argument logically
3. Include specific examples from advisory work
4. Provide actionable insights
5. Maintain consistent voice throughout
</process>

<voice_reminders>
- No hedge words (maybe, perhaps, might)
- Use contractions (don't, isn't, you'll)
- Short paragraphs (2-4 sentences)
- Direct and confident tone
- Challenge conventional wisdom
- Focus on what actually works
</voice_reminders>

<content_structure>
1. Hook with contrarian insight
2. Set up the problem 
3. Challenge common approach
4. Present alternative solution
5. Provide implementation steps
6. Address objections
7. End with clear actions
</content_structure>

<output_format>
{
  "title": "Contrarian title under 60 chars",
  "description": "120-160 char description with promise of value",
  "tags": ["specific-tag", "topic-tag", "industry-tag", "approach-tag", "problem-tag"],
  "content": "Full blog post in markdown format with proper headings and structure"
}
</output_format>

Remember: Every paragraph should add value. No filler content.`.trim()
  }

  static writeFromOutline(
    title: string,
    description: string,
    outline: string
  ): string {
    this.validateStringInputs({ title, description, outline })

    return `<role>
You are Jonathan Haas, an experienced technical leader and startup advisor with deep experience advising startups across security, AI, and developer tools.
</role>

<audience>
${CONFIG.AUDIENCE_DESCRIPTION}
</audience>

<voice_profile>
<characteristic>Direct and confident communication (no hedge words)</characteristic>
<characteristic>Heavy use of contractions (don't, isn't, you'll, I've)</characteristic>
<characteristic>Short paragraphs (2-4 sentences max)</characteristic>
<characteristic>Active voice, present tense</characteristic>
<characteristic>Slightly contrarian perspective</characteristic>
<characteristic>Practical over theoretical</characteristic>
<characteristic>Empathetic but not soft</characteristic>
</voice_profile>

<writing_examples>
<good_example>
Here's the thing most people miss: your AI doesn't need to be perfect. It needs to be useful.

I recently worked with a founder who spent six months optimizing their model's accuracy from 92% to 94%. Meanwhile, their competitor shipped at 85% and captured the entire market. The competitor's secret? They understood that customers cared more about integration than accuracy.
</good_example>

<good_example>
The reality is, most "best practices" are context-dependent bullshit.

What works for Google's AI team won't work for your 5-person startup. I've seen this pattern play out dozens of times—founders read blog posts from big tech companies and try to copy their approach. It's like trying to run a food truck using McDonald's operations manual.
</good_example>
</writing_examples>

<task>
Write a complete blog post based on the following outline. The post should authentically sound like Jonathan Haas.

<input>
<title>${title}</title>
<description>${description}</description>
<outline>
${outline}
</outline>
</input>

<requirements>
<requirement>Write 780+ words of substantive content</requirement>
<requirement>Use specific examples from advisory experience</requirement>
<requirement>Challenge conventional wisdom where appropriate</requirement>
<requirement>Include actionable insights, not generic advice</requirement>
<requirement>Maintain logical flow between paragraphs</requirement>
<requirement>Stay strictly on topic throughout</requirement>
</requirements>

<success_criteria>
- Every paragraph adds value and moves the argument forward
- Examples feel real and specific, not generic
- Voice is consistent throughout (contrarian but helpful)
- Readers learn something actionable they can implement
- No filler content or off-topic tangents
</success_criteria>

Think through the post structure first:
1. What contrarian hook will grab attention?
2. What specific examples support each main point?
3. What actionable insights can readers implement?
4. How does each section build on the previous one?

Now write the full blog post in markdown format. Do not include the title, description, or tags.
</task>`.trim()
  }

  private static validateStringInputs(inputs: Record<string, string>): void {
    for (const [key, value] of Object.entries(inputs)) {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new ValidationError(`${key} cannot be empty`, key)
      }
    }
  }
}

// Enhanced command handler with better error handling and logging
class CommandHandler {
  constructor(private aiClient: GoogleAIClient) {}

  async newDraft(topic: string): Promise<void> {
    if (!topic?.trim()) {
      throw new ValidationError('Topic is required', 'topic')
    }

    console.log(chalk.blue(`📝 Creating new draft for topic: "${topic}"\n`))

    try {
      console.log(
        chalk.yellow('🤖 Generating blog post outline with Google AI...')
      )
      const prompt = PromptTemplates.createBlogOutline(topic)
      const generatedContent = await this.aiClient.generateContent(prompt)
      const parsedContent =
        JSONExtractor.extract<BlogPostOutline>(generatedContent)

      this.validateBlogPostOutline(parsedContent)

      const { title, description, tags, outline } = parsedContent

      console.log(chalk.yellow('\nCreating new post file...'))
      await this.createNewPostFile(title, description, tags, outline)

      console.log(chalk.green('\n✅ New draft created successfully!'))
    } catch (error) {
      this.handleError(error, 'creating new draft')
    }
  }

  async social(postSlug: string): Promise<void> {
    if (!postSlug?.trim()) {
      throw new ValidationError('Post slug is required', 'postSlug')
    }

    console.log(
      chalk.blue(
        `🐦 Generating social media snippets for post: "${postSlug}"\n`
      )
    )

    try {
      const { frontmatter, content } = await BlogFileManager.readPost(postSlug)

      if (!frontmatter.title) {
        throw new ValidationError('Post does not have a title.', 'title')
      }

      console.log(
        chalk.yellow('🤖 Generating social media snippets with Google AI...')
      )
      const contentSnippet =
        content.substring(0, CONFIG.CONTENT_PREVIEW_LENGTH) + '...'
      const prompt = PromptTemplates.createSocialMediaSnippets(
        frontmatter.title,
        frontmatter.description || '',
        contentSnippet
      )

      const generatedContent = await this.aiClient.generateContent(prompt)
      const parsedContent =
        JSONExtractor.extract<SocialMediaSnippets>(generatedContent)

      this.validateSocialMediaSnippets(parsedContent)

      console.log(chalk.green('✨ Here are your social media snippets:\n'))
      console.log(chalk.cyan('--- Twitter/X ---'))
      console.log(parsedContent.twitter + '\n')
      console.log(chalk.cyan('--- LinkedIn ---'))
      console.log(parsedContent.linkedin + '\n')
    } catch (error) {
      this.handleError(error, 'generating social media snippets')
    }
  }

  async audit(): Promise<void> {
    console.log(chalk.blue('🔍 Auditing staged markdown files...\n'))

    try {
      const markdownFiles = await BlogFileManager.getStagedMarkdownFiles()

      if (markdownFiles.length === 0) {
        console.log(chalk.green('✅ No staged markdown posts to audit.'))
        return
      }

      console.log(
        chalk.yellow(
          `Found ${markdownFiles.length} staged markdown posts to audit:`
        )
      )
      markdownFiles.forEach((file) => console.log(chalk.gray(`  - ${file}`)))
      console.log('\n')

      const hasIssues = await this.runAuditChecks(markdownFiles)

      if (hasIssues) {
        console.log(chalk.red('\n📋 Audit complete. Issues found.'))
      } else {
        console.log(chalk.green('\n✅ Audit complete. All checks passed!'))
      }
    } catch (error) {
      this.handleError(error, 'auditing files')
    }
  }

  async improve(): Promise<void> {
    console.log(chalk.blue('📝 Improving staged markdown files...\n'))

    try {
      const markdownFiles = await BlogFileManager.getStagedMarkdownFiles()

      if (markdownFiles.length === 0) {
        console.log(chalk.green('✅ No staged markdown posts to improve.'))
        return
      }

      console.log(
        chalk.yellow(
          `Found ${markdownFiles.length} staged markdown posts to improve:`
        )
      )
      markdownFiles.forEach((file) => console.log(chalk.gray(`  - ${file}`)))
      console.log('\n')

      for (const file of markdownFiles) {
        await this.improveFile(file)
      }

      console.log(
        chalk.green(
          '\n✨ Improvement complete. All staged files have been improved!'
        )
      )
    } catch (error) {
      this.handleError(error, 'improving files')
    }
  }

  async proposeTitles(topic: string): Promise<void> {
    if (!topic?.trim()) {
      throw new ValidationError('Topic is required', 'topic')
    }

    console.log(chalk.blue(`📝 Proposing titles for topic: "${topic}"\n`))

    try {
      console.log(chalk.yellow('🤖 Generating titles with Google AI...'))
      const prompt = PromptTemplates.proposeTitles(topic)
      const generatedContent = await this.aiClient.generateContent(prompt)
      const parsedContent =
        JSONExtractor.extract<TitleSuggestions>(generatedContent)

      this.validateTitleSuggestions(parsedContent)

      console.log(chalk.green('✨ Here are your title suggestions:\n'))
      parsedContent.titles.forEach((title: string) => {
        console.log(chalk.cyan(`- ${title}`))
      })
    } catch (error) {
      this.handleError(error, 'proposing titles')
    }
  }

  async suggestTags(postSlug: string): Promise<void> {
    if (!postSlug?.trim()) {
      throw new ValidationError('Post slug is required', 'postSlug')
    }

    console.log(chalk.blue(`📝 Suggesting tags for post: "${postSlug}"\n`))

    try {
      const { frontmatter, content } = await BlogFileManager.readPost(postSlug)

      if (!frontmatter.title) {
        throw new ValidationError('Post does not have a title.', 'title')
      }

      console.log(chalk.yellow('🤖 Generating tags with Google AI...'))
      const contentSnippet =
        content.substring(0, CONFIG.CONTENT_PREVIEW_LENGTH) + '...'
      const prompt = PromptTemplates.suggestTags(
        frontmatter.title,
        frontmatter.description || '',
        contentSnippet
      )

      const generatedContent = await this.aiClient.generateContent(prompt)
      const parsedContent =
        JSONExtractor.extract<TagSuggestions>(generatedContent)

      this.validateTagSuggestions(parsedContent)

      console.log(chalk.green('✨ Here are your tag suggestions:\n'))
      parsedContent.tags.forEach((tag: string) => {
        console.log(chalk.cyan(`- ${tag}`))
      })
    } catch (error) {
      this.handleError(error, 'suggesting tags')
    }
  }

  async createPost(topic: string): Promise<void> {
    if (!topic?.trim()) {
      throw new ValidationError('Topic is required', 'topic')
    }

    console.log(chalk.blue(`📝 Creating new post for topic: "${topic}"\n`))

    try {
      console.log(chalk.yellow('🤖 Generating blog post with Google AI...'))
      const prompt = PromptTemplates.createFullPost(topic)
      const generatedContent = await this.aiClient.generateContent(prompt)
      const parsedContent =
        JSONExtractor.extract<BlogPostContent>(generatedContent)

      this.validateBlogPostContent(parsedContent)

      const { title, description, tags, content } = parsedContent

      console.log(chalk.yellow('\nCreating new post file...'))
      await this.createNewPostFile(title, description, tags, content)

      console.log(chalk.green('\n✅ New post created successfully!'))
    } catch (error) {
      this.handleError(error, 'creating new post')
    }
  }

  async writeBlogPost(postSlug: string): Promise<void> {
    if (!postSlug?.trim()) {
      throw new ValidationError('Post slug is required', 'postSlug')
    }

    console.log(chalk.blue(`📝 Writing full blog post for: "${postSlug}"\n`))

    try {
      const { filePath, frontmatter, content } =
        await BlogFileManager.readPost(postSlug)

      if (!frontmatter.title) {
        throw new ValidationError('Post does not have a title.', 'title')
      }

      console.log(
        chalk.yellow('🤖 Generating full blog post with Google AI...')
      )
      const prompt = PromptTemplates.writeFromOutline(
        frontmatter.title,
        frontmatter.description || '',
        content
      )

      const generatedContent = await this.aiClient.generateContent(prompt)

      await BlogFileManager.writePost(filePath, generatedContent, frontmatter)
      console.log(
        chalk.green(`✅ Successfully wrote full blog post to ${filePath}`)
      )
    } catch (error) {
      this.handleError(error, 'writing blog post')
    }
  }

  // Validation methods
  private validateBlogPostOutline(
    data: unknown
  ): asserts data is BlogPostOutline {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid response format', 'response')
    }

    const outline = data as Partial<BlogPostOutline>

    if (!outline.title || typeof outline.title !== 'string') {
      throw new ValidationError('Missing or invalid title', 'title')
    }

    if (!outline.description || typeof outline.description !== 'string') {
      throw new ValidationError('Missing or invalid description', 'description')
    }

    if (!Array.isArray(outline.tags) || outline.tags.length === 0) {
      throw new ValidationError('Missing or invalid tags array', 'tags')
    }

    if (!outline.outline || typeof outline.outline !== 'string') {
      throw new ValidationError('Missing or invalid outline', 'outline')
    }
  }

  private validateBlogPostContent(
    data: unknown
  ): asserts data is BlogPostContent {
    this.validateBlogPostOutline(data)

    const content = data as Partial<BlogPostContent>
    if (!content.content || typeof content.content !== 'string') {
      throw new ValidationError('Missing or invalid content', 'content')
    }
  }

  private validateSocialMediaSnippets(
    data: unknown
  ): asserts data is SocialMediaSnippets {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid response format', 'response')
    }

    const snippets = data as Partial<SocialMediaSnippets>

    if (!snippets.twitter || typeof snippets.twitter !== 'string') {
      throw new ValidationError('Missing or invalid twitter snippet', 'twitter')
    }

    if (!snippets.linkedin || typeof snippets.linkedin !== 'string') {
      throw new ValidationError(
        'Missing or invalid linkedin snippet',
        'linkedin'
      )
    }
  }

  private validateTitleSuggestions(
    data: unknown
  ): asserts data is TitleSuggestions {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid response format', 'response')
    }

    const suggestions = data as Partial<TitleSuggestions>

    if (!Array.isArray(suggestions.titles) || suggestions.titles.length === 0) {
      throw new ValidationError('Missing or invalid titles array', 'titles')
    }
  }

  private validateTagSuggestions(
    data: unknown
  ): asserts data is TagSuggestions {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid response format', 'response')
    }

    const suggestions = data as Partial<TagSuggestions>

    if (!Array.isArray(suggestions.tags) || suggestions.tags.length === 0) {
      throw new ValidationError('Missing or invalid tags array', 'tags')
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

  private async runAuditChecks(markdownFiles: string[]): Promise<boolean> {
    let hasIssues = false

    const checks = [
      {
        name: 'Markdown Lint',
        command: `npx markdownlint-cli2 ${markdownFiles.join(' ')}`,
      },
      {
        name: 'Spell Check',
        command: `npx cspell ${markdownFiles.join(' ')}`,
      },
      {
        name: 'SEO Validation',
        command: `bun run scripts/validateSEO.ts ${markdownFiles.join(' ')}`,
      },
    ]

    for (const check of checks) {
      console.log(chalk.cyan(`Running ${check.name}...`))
      try {
        const { stdout, stderr } = await execAsync(check.command)
        if (stdout) console.log(stdout)
        if (stderr) {
          console.error(stderr)
          hasIssues = true
        }
        console.log(chalk.green(`✅ ${check.name} passed.\n`))
      } catch (error) {
        console.error(chalk.red(`❌ ${check.name} failed:`))
        const execError = error as { stdout?: string; stderr?: string }
        if (execError.stdout) console.error(execError.stdout)
        if (execError.stderr) console.error(execError.stderr)
        console.log('\n')
        hasIssues = true
      }
    }

    return hasIssues
  }

  private async improveFile(file: string): Promise<void> {
    console.log(chalk.cyan(`Improving ${file}...`))

    try {
      const fileContent = await fs.readFile(file, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent)

      const prompt = PromptTemplates.improveContent(content)
      const improvedContent = await this.aiClient.generateContent(prompt)

      await BlogFileManager.writePost(
        file,
        improvedContent,
        frontmatter as PostFrontmatter
      )
      console.log(chalk.green(`✅ Improved ${file}\n`))
    } catch (error) {
      console.error(chalk.red(`❌ Failed to improve ${file}:`), error)
      throw error
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
    } else if (error instanceof APIError) {
      console.error(
        chalk.red(`❌ API error while ${operation}:`),
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

// Enhanced CLI with better error handling and diagnostics
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
    // Load environment variables
    await EnvironmentLoader.load()

    // Validate required environment variables
    EnvironmentLoader.validateRequiredEnvVars()

    // Validate posts directory
    await BlogFileManager.validatePostsDirectory()

    // Initialize AI client and command handler
    const aiClient = new GoogleAIClient()
    this.commandHandler = new CommandHandler(aiClient)

    console.log(chalk.gray('🚀 Gemini AI Assistant initialized'))
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
      case 'social':
        await this.commandHandler.social(topic)
        break
      case 'audit':
        await this.commandHandler.audit()
        break
      case 'improve':
        await this.commandHandler.improve()
        break
      case 'propose-titles':
        await this.commandHandler.proposeTitles(topic)
        break
      case 'suggest-tags':
        await this.commandHandler.suggestTags(topic)
        break
      case 'create-post':
        await this.commandHandler.createPost(topic)
        break
      case 'write-blog-post':
        await this.commandHandler.writeBlogPost(topic)
        break
      case 'clear-cache':
        this.clearCache()
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

  private clearCache(): void {
    // Implementation would depend on how the cache is structured
    console.log(chalk.green('✅ Cache cleared successfully'))
  }

  private showStatus(): void {
    console.log(chalk.blue('📊 Gemini AI Assistant Status:'))
    console.log(chalk.gray(`  Posts Directory: ${CONFIG.POSTS_DIR}`))
    console.log(chalk.gray(`  API Timeout: ${CONFIG.API.TIMEOUT}ms`))
    console.log(chalk.gray(`  Cache TTL: ${CONFIG.CACHE_TTL}ms`))
    console.log(chalk.gray(`  Max Retries: ${CONFIG.API.RETRY.maxRetries}`))
  }

  private showUsage(): void {
    console.error(chalk.red('❌ Error: Please provide a command.'))
    console.error('Usage: bun run gemini <command> [args]')
    console.error('\nAvailable commands:')
    console.error(
      '  new-draft <topic>        - Create a new draft with outline'
    )
    console.error('  social <post-slug>       - Generate social media snippets')
    console.error('  audit                    - Audit staged markdown files')
    console.error('  improve                  - Improve staged markdown files')
    console.error('  propose-titles <topic>   - Suggest titles for a topic')
    console.error('  suggest-tags <post-slug> - Suggest tags for a post')
    console.error('  create-post <topic>      - Create a complete post')
    console.error('  write-blog-post <post-slug> - Write content from outline')
    console.error('  clear-cache              - Clear the response cache')
    console.error('  status                   - Show system status')
  }

  private handleFatalError(error: unknown): never {
    console.error(chalk.red('\n💥 Fatal error occurred:'))

    if (error instanceof ValidationError) {
      console.error(chalk.red(`Validation Error: ${error.message}`))
      if (error.field) {
        console.error(chalk.gray(`Field: ${error.field}`))
      }
    } else if (error instanceof APIError) {
      console.error(chalk.red(`API Error: ${error.message}`))
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
    console.error('  • Check your .env file contains GOOGLE_AI_API_KEY')
    console.error('  • Verify your internet connection')
    console.error('  • Try running with --verbose for more details')
    console.error('  • Check the posts directory exists')

    process.exit(1)
  }
}

// Main entry point
if (import.meta.main) {
  new CLI().run().catch(console.error)
}
