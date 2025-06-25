#!/usr/bin/env bun

import { parseArgs } from 'util'
import chalk from 'chalk'
import { promisify } from 'util'
import { exec } from 'child_process'
import matter from 'gray-matter'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

// Types for better type safety
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
  [key: string]: unknown
}

// Configuration constants
const CONFIG = {
  API_URL:
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  POSTS_DIR: path.join(process.cwd(), 'src', 'posts'),
  CONTENT_PREVIEW_LENGTH: 1500,
  AUDIENCE_DESCRIPTION:
    'experienced product managers, senior software engineers, and technical founders. They are busy, skeptical, and value practical, actionable insights over fluff.',
} as const

// Core utilities
class JSONExtractor {
  static extract<T = unknown>(text: string): T {
    // Try to find JSON within markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim())
    }

    // Try to find raw JSON object
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      return JSON.parse(objectMatch[0])
    }

    // Last resort: try parsing the whole text
    return JSON.parse(text)
  }
}

class EnvironmentLoader {
  static async load(): Promise<void> {
    try {
      const envPath = path.join(process.cwd(), '.env')
      const envFile = await fs.readFile(envPath, 'utf-8')
      const envVars = envFile
        .split('\n')
        .filter((line) => line.trim() !== '' && !line.startsWith('#'))

      for (const line of envVars) {
        const [key, value] = line.split('=')
        if (key && value) {
          process.env[key.trim()] = value.trim()
        }
      }
    } catch (error) {
      // .env file not found, but that's okay
    }
  }
}

// API client for Google AI
class GoogleAIClient {
  private readonly apiKey: string

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not set in your .env file')
    }
    this.apiKey = apiKey
  }

  async generateContent(prompt: string): Promise<string> {
    const apiURL = `${CONFIG.API_URL}?key=${this.apiKey}`

    try {
      const response = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(
          `API request failed with status ${response.status}: ${errorBody}`
        )
      }

      const data = await response.json()
      return data.candidates[0].content.parts[0].text
    } catch (error) {
      console.error(chalk.red('❌ Error calling Google AI API:'), error)
      throw error
    }
  }
}

// File operations
class BlogFileManager {
  static async readPost(postSlug: string): Promise<{
    filePath: string
    frontmatter: PostFrontmatter
    content: string
  }> {
    const filePath = path.join(CONFIG.POSTS_DIR, `${postSlug}.md`)
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const { data: frontmatter, content } = matter(fileContent)

    return { filePath, frontmatter, content }
  }

  static async getStagedMarkdownFiles(): Promise<string[]> {
    const { stdout: stagedFilesOutput } = await execAsync(
      'git ls-files --cached'
    )
    const stagedFiles = stagedFilesOutput.trim().split('\n')
    return stagedFiles.filter(
      (file) => file.endsWith('.md') && file.startsWith('src/posts/')
    )
  }

  static async writePost(
    filePath: string,
    content: string,
    frontmatter: PostFrontmatter
  ): Promise<void> {
    const newFileContent = matter.stringify(content, frontmatter)
    await fs.writeFile(filePath, newFileContent)
  }
}

// Prompt templates
class PromptTemplates {
  static createBlogOutline(topic: string): string {
    return `
      You are a world-class content strategist and writer for a top-tier technical blog.
      Your audience consists of ${CONFIG.AUDIENCE_DESCRIPTION}

      Your task is to generate a compelling, well-structured blog post outline for the following topic.

      **Topic:** "${topic}"

      Please provide the following in a clear, structured JSON format. Do not include any text outside of the JSON object.

      {
        "title": "A catchy, SEO-friendly title (under 60 characters).",
        "description": "A meta description (120-160 characters) that summarizes the post and entices readers.",
        "tags": [
          "tag-one",
          "tag-two",
          "tag-three",
          "tag-four",
          "tag-five"
        ],
        "outline": "A detailed markdown outline. It must start with an H2 (##) for the introduction, have at least 3-4 main sections using H2s, and end with an H2 for the conclusion. Provide 2-3 bullet points under each heading to guide the writing process."
      }
    `
  }

  static createSocialMediaSnippets(
    title: string,
    description: string,
    contentSnippet: string
  ): string {
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
    `
  }

  static improveContent(content: string): string {
    return `
      You are an expert copy editor for a technical blog.
      Your task is to improve the following blog post by fixing grammar and spelling, improving clarity and flow, and suggesting better word choices. 
      Do not change the markdown formatting. Only return the improved content.

      **Content:**
      ${content}
    `
  }

  static proposeTitles(topic: string): string {
    return `
      You are a world-class content strategist and writer for a top-tier technical blog.
      Your audience consists of ${CONFIG.AUDIENCE_DESCRIPTION}

      Your task is to generate a list of 5-10 compelling, SEO-friendly titles for the following topic.
      Each title should be under 60 characters.

      **Topic:** "${topic}"

      Please provide the following in a clear, structured JSON format. Do not include any text outside of the JSON object.

      {
        "titles": [
          "A catchy, SEO-friendly title (under 60 characters).",
          "Another catchy, SEO-friendly title (under 60 characters).",
          "And so on..."
        ]
      }
    `
  }

  static suggestTags(
    title: string,
    description: string,
    contentSnippet: string
  ): string {
    return `
      You are a world-class content strategist and writer for a top-tier technical blog.
      Your audience consists of ${CONFIG.AUDIENCE_DESCRIPTION}

      Your task is to generate a list of 5-10 relevant tags for the following blog post.

      **Title:** "${title}"
      **Description:** "${description}"
      **Content Snippet:**
      ${contentSnippet}

      Please provide the following in a clear, structured JSON format. Do not include any text outside of the JSON object.

      {
        "tags": [
          "tag-one",
          "tag-two",
          "tag-three",
          "tag-four",
          "tag-five"
        ]
      }
    `
  }

  static createFullPost(topic: string): string {
    return `
      You are a world-class content strategist and writer for a top-tier technical blog.
      Your audience consists of ${CONFIG.AUDIENCE_DESCRIPTION}

      Your task is to generate a compelling, well-structured blog post for the following topic.

      **Topic:** "${topic}"

      Please provide the following in a clear, structured JSON format. Do not include any text outside of the JSON object.

      {
        "title": "A catchy, SEO-friendly title (under 60 characters).",
        "description": "A meta description (120-160 characters) that summarizes the post and entices readers.",
        "tags": [
          "tag-one",
          "tag-two",
          "tag-three",
          "tag-four",
          "tag-five"
        ],
        "content": "The full blog post in markdown format. It should be well-structured, with a clear introduction, main body, and conclusion. Use markdown for formatting."
      }
    `
  }

  static writeFromOutline(
    title: string,
    description: string,
    outline: string
  ): string {
    return `
      You are a world-class content strategist and writer for a top-tier technical blog.
      Your audience consists of ${CONFIG.AUDIENCE_DESCRIPTION}

      Your task is to write a complete, high-quality blog post based on the following outline.
      The tone should be professional yet engaging, and the content should be detailed and insightful.

      **Title:** "${title}"
      **Description:** "${description}"
      **Outline:**
      ${outline}

      Please write the full blog post in markdown format. Do not include the title, description, or tags in the output. Only return the full blog post content.
    `
  }
}

// Command implementations
class CommandHandler {
  constructor(private aiClient: GoogleAIClient) {}

  async newDraft(topic: string): Promise<void> {
    if (!topic.trim()) {
      throw new Error('Topic is required')
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

      const { title, description, tags, outline } = parsedContent

      console.log(chalk.yellow('\nCreating new post file...'))
      await this.createNewPostFile(title, description, tags, outline)

      console.log(chalk.green('\n✅ New draft created successfully!'))
    } catch (error) {
      console.error(
        chalk.red('❌ An error occurred while creating the new draft:'),
        error
      )
      process.exit(1)
    }
  }

  async social(postSlug: string): Promise<void> {
    if (!postSlug.trim()) {
      throw new Error('Post slug is required')
    }

    console.log(
      chalk.blue(
        `🐦 Generating social media snippets for post: "${postSlug}"\n`
      )
    )

    try {
      const { frontmatter, content } = await BlogFileManager.readPost(postSlug)

      if (!frontmatter.title) {
        throw new Error('Post does not have a title.')
      }

      console.log(
        chalk.yellow('🤖 Generating social media snippets with Google AI...')
      )
      const contentSnippet =
        content.substring(0, CONFIG.CONTENT_PREVIEW_LENGTH) + '...'
      const prompt = PromptTemplates.createSocialMediaSnippets(
        frontmatter.title as string,
        (frontmatter.description as string) || '',
        contentSnippet
      )

      const generatedContent = await this.aiClient.generateContent(prompt)
      const parsedContent =
        JSONExtractor.extract<SocialMediaSnippets>(generatedContent)

      console.log(chalk.green('✨ Here are your social media snippets:\n'))
      console.log(chalk.cyan('--- Twitter/X ---'))
      console.log(parsedContent.twitter + '\n')
      console.log(chalk.cyan('--- LinkedIn ---'))
      console.log(parsedContent.linkedin + '\n')
    } catch (error) {
      console.error(
        chalk.red(
          '❌ An error occurred while generating social media snippets:'
        ),
        error
      )
      process.exit(1)
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
      console.error(
        chalk.red('❌ An error occurred during the audit process:'),
        error
      )
      process.exit(1)
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
      console.error(
        chalk.red('❌ An error occurred during the improvement process:'),
        error
      )
      process.exit(1)
    }
  }

  async proposeTitles(topic: string): Promise<void> {
    if (!topic.trim()) {
      throw new Error('Topic is required')
    }

    console.log(chalk.blue(`📝 Proposing titles for topic: "${topic}"\n`))

    try {
      console.log(chalk.yellow('🤖 Generating titles with Google AI...'))
      const prompt = PromptTemplates.proposeTitles(topic)
      const generatedContent = await this.aiClient.generateContent(prompt)
      const parsedContent =
        JSONExtractor.extract<TitleSuggestions>(generatedContent)

      console.log(chalk.green('✨ Here are your title suggestions:\n'))
      parsedContent.titles.forEach((title: string) => {
        console.log(chalk.cyan(`- ${title}`))
      })
    } catch (error) {
      console.error(
        chalk.red('❌ An error occurred while proposing titles:'),
        error
      )
      process.exit(1)
    }
  }

  async suggestTags(postSlug: string): Promise<void> {
    if (!postSlug.trim()) {
      throw new Error('Post slug is required')
    }

    console.log(chalk.blue(`📝 Suggesting tags for post: "${postSlug}"\n`))

    try {
      const { frontmatter, content } = await BlogFileManager.readPost(postSlug)

      if (!frontmatter.title) {
        throw new Error('Post does not have a title.')
      }

      console.log(chalk.yellow('🤖 Generating tags with Google AI...'))
      const contentSnippet =
        content.substring(0, CONFIG.CONTENT_PREVIEW_LENGTH) + '...'
      const prompt = PromptTemplates.suggestTags(
        frontmatter.title as string,
        (frontmatter.description as string) || '',
        contentSnippet
      )

      const generatedContent = await this.aiClient.generateContent(prompt)
      const parsedContent =
        JSONExtractor.extract<TagSuggestions>(generatedContent)

      console.log(chalk.green('✨ Here are your tag suggestions:\n'))
      parsedContent.tags.forEach((tag: string) => {
        console.log(chalk.cyan(`- ${tag}`))
      })
    } catch (error) {
      console.error(
        chalk.red('❌ An error occurred while suggesting tags:'),
        error
      )
      process.exit(1)
    }
  }

  async createPost(topic: string): Promise<void> {
    if (!topic.trim()) {
      throw new Error('Topic is required')
    }

    console.log(chalk.blue(`📝 Creating new post for topic: "${topic}"\n`))

    try {
      console.log(chalk.yellow('🤖 Generating blog post with Google AI...'))
      const prompt = PromptTemplates.createFullPost(topic)
      const generatedContent = await this.aiClient.generateContent(prompt)
      const parsedContent =
        JSONExtractor.extract<BlogPostContent>(generatedContent)

      const { title, description, tags, content } = parsedContent

      console.log(chalk.yellow('\nCreating new post file...'))
      await this.createNewPostFile(title, description, tags, content)

      console.log(chalk.green('\n✅ New post created successfully!'))
    } catch (error) {
      console.error(
        chalk.red('❌ An error occurred while creating the new post:'),
        error
      )
      process.exit(1)
    }
  }

  async writeBlogPost(postSlug: string): Promise<void> {
    if (!postSlug.trim()) {
      throw new Error('Post slug is required')
    }

    console.log(chalk.blue(`📝 Writing full blog post for: "${postSlug}"\n`))

    try {
      const { filePath, frontmatter, content } =
        await BlogFileManager.readPost(postSlug)

      if (!frontmatter.title) {
        throw new Error('Post does not have a title.')
      }

      console.log(
        chalk.yellow('🤖 Generating full blog post with Google AI...')
      )
      const prompt = PromptTemplates.writeFromOutline(
        frontmatter.title as string,
        (frontmatter.description as string) || '',
        content
      )

      const generatedContent = await this.aiClient.generateContent(prompt)

      await BlogFileManager.writePost(filePath, generatedContent, frontmatter)
      console.log(
        chalk.green(`✅ Successfully wrote full blog post to ${filePath}`)
      )
    } catch (error) {
      console.error(
        chalk.red('❌ An error occurred while writing the blog post:'),
        error
      )
      process.exit(1)
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

    const proc = Bun.spawn(newPostArgs, { stdout: 'pipe' })
    const output = await new Response(proc.stdout).text()
    console.log(output)
    await proc.exited
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
    const fileContent = await fs.readFile(file, 'utf-8')
    const { data: frontmatter, content } = matter(fileContent)

    const prompt = PromptTemplates.improveContent(content)
    const improvedContent = await this.aiClient.generateContent(prompt)

    await BlogFileManager.writePost(file, improvedContent, frontmatter)
    console.log(chalk.green(`✅ Improved ${file}\n`))
  }
}

// CLI setup
class CLI {
  private commandHandler: CommandHandler

  constructor() {
    this.commandHandler = new CommandHandler(new GoogleAIClient())
  }

  async run(): Promise<void> {
    await EnvironmentLoader.load()

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

    try {
      await this.executeCommand(command, args)
    } catch (error) {
      console.error(chalk.red('❌ Command failed:'), error)
      process.exit(1)
    }
  }

  private async executeCommand(command: string, args: string[]): Promise<void> {
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
      default:
        console.error(chalk.red(`❌ Error: Unknown command "${command}"`))
        this.showUsage()
        process.exit(1)
    }
  }

  private showUsage(): void {
    console.error(chalk.red('❌ Error: Please provide a command.'))
    console.error('Usage: bun run gemini <command> [args]')
    console.error('\nAvailable commands:')
    console.error('  new-draft <topic>     - Create a new draft with outline')
    console.error('  social <post-slug>    - Generate social media snippets')
    console.error('  audit                 - Audit staged markdown files')
    console.error('  improve               - Improve staged markdown files')
    console.error('  propose-titles <topic> - Suggest titles for a topic')
    console.error('  suggest-tags <post-slug> - Suggest tags for a post')
    console.error('  create-post <topic>   - Create a complete post')
    console.error('  write-blog-post <post-slug> - Write content from outline')
  }
}

// Main entry point
if (import.meta.main) {
  new CLI().run().catch(console.error)
}
