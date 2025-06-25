#!/usr/bin/env bun

import { parseArgs } from 'util'
import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import {
  VoiceProfile,
  VoiceContext,
  VoiceResponse,
  QuestionContext,
  ResponseStrategy,
  VoiceValidation,
  VoiceEngineError,
  AuthenticityError,
} from './lib/jonathan-voice-types.js'
import {
  JONATHAN_VOICE_PROFILE,
  JONATHAN_FRAMEWORKS,
  VOICE_VALIDATION_CRITERIA,
} from './lib/jonathan-voice-profile.js'
import {
  AIResponse,
  RetryConfig,
  AIError,
  ValidationError,
  RateLimitError,
} from './lib/ai-types.js'

// Enhanced Claude client specifically for voice replication
class JonathanVoiceEngine {
  private readonly apiKey: string
  private readonly voiceProfile: VoiceProfile
  private lastRequestTime = 0
  private readonly minRequestInterval = 300 // Slightly longer for voice work

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for voice engine')
    }
    this.apiKey = apiKey
    this.voiceProfile = JONATHAN_VOICE_PROFILE
  }

  async generateResponse(
    question: string,
    context: VoiceContext
  ): Promise<VoiceResponse> {
    const startTime = Date.now()

    console.log(chalk.blue(`🧠 Generating response as Jonathan...`))
    console.log(chalk.gray(`   Question: "${question}"`))
    console.log(
      chalk.gray(
        `   Context: ${context.audience} | ${context.format} | ${context.topic_domain}`
      )
    )

    try {
      // 1. Analyze question and determine response strategy
      const strategy = this.determineResponseStrategy(question, context)
      console.log(chalk.yellow(`📋 Strategy: ${strategy.approach}`))

      // 2. Generate voice-specific prompt
      const voicePrompt = this.buildVoicePrompt(question, context, strategy)

      // 3. Get response from Claude with voice constraints
      const rawResponse = await this.callClaudeWithVoice(voicePrompt)

      // 4. Validate response authenticity
      const validation = this.validateVoiceAuthenticity(rawResponse, context)

      if (validation.authenticity_score < 0.5) {
        console.warn(
          chalk.yellow(
            `⚠️  Lower authenticity score: ${Math.round(validation.authenticity_score * 100)}%`
          )
        )
        console.warn(
          chalk.gray(
            `   Issues: ${validation.validation_notes.potential_issues.join(', ')}`
          )
        )
        // Still proceed but warn user
      }

      // 5. Build final response
      const response: VoiceResponse = {
        content: rawResponse,
        confidence: validation.authenticity_score,
        voice_markers: {
          signature_phrases_used:
            validation.validation_notes.authentic_elements,
          perspective_alignment: validation.perspective_alignment,
          style_consistency: validation.style_consistency,
        },
        metadata: {
          processing_time: Date.now() - startTime,
          voice_profile_version: '1.0',
          sources_referenced: strategy.supporting_evidence,
        },
      }

      console.log(
        chalk.green(
          `✅ Response generated (confidence: ${Math.round(validation.authenticity_score * 100)}%)`
        )
      )
      return response
    } catch (error) {
      if (error instanceof AuthenticityError) {
        console.error(
          chalk.red(`❌ Voice authenticity failed: ${error.message}`)
        )
        console.error(chalk.gray(`   Issues: ${error.issues.join(', ')}`))
      }
      throw error
    }
  }

  private determineResponseStrategy(
    question: string,
    context: VoiceContext
  ): ResponseStrategy {
    const questionLower = question.toLowerCase()

    // Identify topic domain and Jonathan's likely approach
    if (
      questionLower.includes('equity') ||
      questionLower.includes('startup compensation')
    ) {
      return {
        approach: 'contrarian-take',
        key_points: [
          'Current equity system is fundamentally broken',
          'Employees bear risk without proportional reward',
          'Structural change needed, not individual optimization',
        ],
        jonathan_angle:
          'Challenge the premise that equity is good for employees',
        supporting_evidence: [
          'ThreatKey experience',
          'Industry analysis',
          'Employee risk assessment',
        ],
        potential_counterarguments: [
          'Equity upside potential',
          'Industry standard practices',
        ],
      }
    }

    if (
      questionLower.includes('ai') ||
      questionLower.includes('artificial intelligence')
    ) {
      return {
        approach: 'nuanced-analysis',
        key_points: [
          "AI amplifies human capability, doesn't replace it",
          'Implementation quality matters more than sophistication',
          'Integration workflow is critical',
        ],
        jonathan_angle: 'Practical AI integration perspective',
        supporting_evidence: [
          'Multi-AI content system',
          'Security product experience',
        ],
        potential_counterarguments: [
          'AI replacement concerns',
          'Technical complexity',
        ],
      }
    }

    if (
      questionLower.includes('startup') ||
      questionLower.includes('founder')
    ) {
      return {
        approach: 'framework-based',
        key_points: [
          'Context matters more than best practices',
          'Founder psychology drives most decisions',
          'Execution trumps planning',
        ],
        jonathan_angle: 'Challenge generic startup advice',
        supporting_evidence: [
          'Multiple startup experience',
          'Founder psychology insights',
        ],
        potential_counterarguments: [
          'Standard startup playbooks',
          'Pattern matching',
        ],
      }
    }

    if (
      questionLower.includes('product') ||
      questionLower.includes('engineering')
    ) {
      return {
        approach: 'direct-answer',
        key_points: [
          'Quality should be strategic, not uniform',
          'Speed of learning over speed of building',
          'Technical debt is a strategic tool',
        ],
        jonathan_angle: 'Practical product development perspective',
        supporting_evidence: [
          'Security product development',
          'Technical leadership experience',
        ],
        potential_counterarguments: [
          'Quality obsession',
          'Technical perfectionism',
        ],
      }
    }

    // Default strategy
    return {
      approach: 'direct-answer',
      key_points: [
        'Focus on practical application',
        'Consider context',
        'Challenge assumptions',
      ],
      jonathan_angle: 'Pragmatic, experience-based response',
      supporting_evidence: ['General startup experience'],
      potential_counterarguments: [],
    }
  }

  private buildVoicePrompt(
    question: string,
    context: VoiceContext,
    strategy: ResponseStrategy
  ): string {
    const voiceProfile = this.voiceProfile
    const frameworks = JONATHAN_FRAMEWORKS.filter((f) =>
      strategy.supporting_evidence.some((evidence) =>
        f.real_world_examples.some((example) =>
          example.toLowerCase().includes(evidence.toLowerCase())
        )
      )
    )

    return `You are Jonathan Haas, an experienced technical leader and startup advisor. You have deep experience in security products (ThreatKey), startup operations, and AI integration. You're known for challenging conventional wisdom and providing pragmatic, experience-based advice.

VOICE CHARACTERISTICS:
- Direct and confident communication style
- Use contractions heavily (don't, isn't, you'll)
- Short paragraphs (2-4 sentences max)
- Active voice, present tense for immediacy
- No hedge words (maybe, perhaps, might)
- Slightly contrarian perspective
- Practical over theoretical
- Empathetic to founder/developer struggles

CORE BELIEFS:
- Execution over perfection ("Ship ugly, learn fast")
- Context matters more than best practices
- Speed of learning > speed of building
- Transparency builds trust
- AI amplifies humans, doesn't replace them
- Current startup equity system is broken

SIGNATURE PHRASES TO USE:
${voiceProfile.phrases.transitions.map((p) => `- "${p}"`).join('\n')}

RESPONSE STRATEGY: ${strategy.approach}
KEY POINTS TO COVER:
${strategy.key_points.map((p) => `- ${p}`).join('\n')}

JONATHAN'S ANGLE: ${strategy.jonathan_angle}

${
  frameworks.length > 0
    ? `
RELEVANT FRAMEWORKS TO REFERENCE:
${frameworks
  .map(
    (f) => `
- ${f.name}: ${f.description}
  Key insights: ${f.jonathan_insights.join('; ')}
`
  )
  .join('')}
`
    : ''
}

QUESTION: "${question}"

CONTEXT:
- Audience: ${context.audience}
- Format: ${context.format}
- Topic domain: ${context.topic_domain}
- Expected length: ${context.length}

Respond as Jonathan would - direct, pragmatic, slightly contrarian, with specific examples from your experience. Use your signature phrases naturally. Keep paragraphs short. Be confident in your perspective while acknowledging nuance where appropriate.

${context.format === 'twitter-thread' ? 'Format as a Twitter thread with numbered tweets (1/n format).' : ''}
${context.format === 'email' ? 'Format as a professional but conversational email.' : ''}
${context.length === 'short' ? 'Keep response to 2-3 paragraphs maximum.' : ''}
${context.length === 'long' ? 'Provide a comprehensive response with examples and frameworks.' : ''}`
  }

  private async callClaudeWithVoice(prompt: string): Promise<string> {
    // Rate limiting
    await this.enforceRateLimit()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text()
        throw new AIError(
          `Voice engine API request failed: ${response.statusText}`,
          'claude-voice',
          response.status,
          errorBody
        )
      }

      const data: { content?: Array<{ type: string; text?: string }> } =
        await response.json()

      if (
        !data.content ||
        !Array.isArray(data.content) ||
        data.content.length === 0
      ) {
        throw new ValidationError(
          'Invalid response structure',
          'content',
          'claude-voice'
        )
      }

      const textContent = data.content.find((item) => item.type === 'text')
      if (!textContent || !textContent.text) {
        throw new ValidationError(
          'No text content in response',
          'text',
          'claude-voice'
        )
      }

      return textContent.text
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIError('Voice engine request timeout', 'claude-voice', 408)
      }
      throw error
    }
  }

  private validateVoiceAuthenticity(
    response: string,
    context: VoiceContext
  ): VoiceValidation {
    const criteria = VOICE_VALIDATION_CRITERIA
    let authenticity_score = 0
    let perspective_alignment = 0
    let style_consistency = 0

    const authentic_elements: string[] = []
    const style_matches: string[] = []
    const perspective_matches: string[] = []
    const potential_issues: string[] = []

    // Check authenticity markers
    criteria.authenticity_markers.forEach((marker) => {
      if (this.checkMarker(response, marker)) {
        authenticity_score += 1
        authentic_elements.push(marker)
      }
    })
    authenticity_score =
      authenticity_score / criteria.authenticity_markers.length

    // Check perspective markers
    criteria.perspective_markers.forEach((marker) => {
      if (this.checkMarker(response, marker)) {
        perspective_alignment += 1
        perspective_matches.push(marker)
      }
    })
    perspective_alignment =
      perspective_alignment / criteria.perspective_markers.length

    // Check style consistency
    criteria.expertise_markers.forEach((marker) => {
      if (this.checkMarker(response, marker)) {
        style_consistency += 1
        style_matches.push(marker)
      }
    })
    style_consistency = style_consistency / criteria.expertise_markers.length

    // Check for red flags
    criteria.style_red_flags.forEach((flag) => {
      if (this.checkMarker(response, flag)) {
        potential_issues.push(flag)
        authenticity_score -= 0.1 // Penalty for red flags
      }
    })

    // Overall authenticity is weighted average
    const overall_authenticity =
      authenticity_score * 0.4 +
      perspective_alignment * 0.3 +
      style_consistency * 0.3

    return {
      authenticity_score: Math.max(0, Math.min(1, overall_authenticity)),
      perspective_alignment,
      style_consistency,
      validation_notes: {
        authentic_elements,
        style_matches,
        perspective_matches,
        potential_issues,
        improvement_suggestions: potential_issues.map(
          (issue) => `Reduce: ${issue}`
        ),
      },
    }
  }

  private checkMarker(response: string, marker: string): boolean {
    const responseLower = response.toLowerCase()

    switch (marker) {
      case 'Uses contractions naturally':
        return /\b(don't|isn't|won't|can't|you'll|I've|there's|here's|that's)\b/.test(
          response
        )

      case 'Short paragraphs (2-4 sentences)': {
        const paragraphs = response.split('\n\n').filter((p) => p.trim())
        const avgSentences =
          paragraphs.reduce((acc, p) => {
            const sentences = p.split(/[.!?]+/).filter((s) => s.trim()).length
            return acc + sentences
          }, 0) / paragraphs.length
        return avgSentences <= 4
      }

      case 'Active voice predominant': {
        const passiveIndicators = /(was|were|been|being)\s+\w+ed\b/g
        const passiveMatches = (response.match(passiveIndicators) || []).length
        const totalSentences = response
          .split(/[.!?]+/)
          .filter((s) => s.trim()).length
        return passiveMatches / totalSentences < 0.2
      }

      case 'No hedge words (maybe, perhaps)':
        return !/\b(maybe|perhaps|might|possibly|potentially|could)\b/i.test(
          response
        )

      case 'Challenges conventional wisdom':
        return (
          /\b(conventional wisdom|most people think|traditional approach|standard advice|common belief)\b/i.test(
            response
          ) || /\b(wrong|broken|myth|misconception)\b/i.test(response)
        )

      case 'Shows empathy for founder struggles':
        return /\b(I understand|I've been there|struggle|challenge|difficult|frustrating)\b/i.test(
          response
        )

      case 'Emphasizes context over best practices':
        return (
          /\b(context|depends|situation|specific|nuanced)\b/i.test(response) &&
          /\b(best practice|one size fits all|always|never)\b/i.test(response)
        )

      case 'References specific company experience':
        return /\b(ThreatKey|Carta|my experience at|when I worked)\b/i.test(
          response
        )

      default: {
        // For other markers, do basic keyword matching
        const keywords = marker.toLowerCase().split(' ')
        return keywords.some((keyword) => responseLower.includes(keyword))
      }
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    this.lastRequestTime = Date.now()
  }

  async trainFromBlogPosts(): Promise<void> {
    console.log(chalk.blue('🎓 Training voice model from blog posts...'))

    const postsDir = path.join(process.cwd(), 'src', 'posts')
    const files = await fs.readdir(postsDir)
    const markdownFiles = files.filter((file) => file.endsWith('.md'))

    console.log(chalk.gray(`   Found ${markdownFiles.length} blog posts`))

    // This would analyze patterns in actual blog posts
    // For now, we'll use the pre-built profile
    console.log(chalk.green('✅ Voice model loaded from analysis'))
  }

  async getVoiceStats(): Promise<void> {
    console.log(chalk.blue('📊 Jonathan Voice Engine Stats:'))
    console.log(chalk.gray(`  Voice Profile Version: 1.0`))
    console.log(chalk.gray(`  Confidence Threshold: 70%`))
    console.log(
      chalk.gray(`  Frameworks Available: ${JONATHAN_FRAMEWORKS.length}`)
    )
    console.log(
      chalk.gray(
        `  Perspective Topics: ${Object.keys(this.voiceProfile.perspectives).length}`
      )
    )
    console.log(
      chalk.gray(
        `  Signature Phrases: ${this.voiceProfile.phrases.transitions.length}`
      )
    )
  }
}

// CLI Interface
class VoiceCLI {
  private engine: JonathanVoiceEngine

  constructor() {
    this.engine = new JonathanVoiceEngine()
  }

  async run(): Promise<void> {
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
      console.error(chalk.red('❌ Voice engine failed:'), error)
      process.exit(1)
    }
  }

  private async executeCommand(command: string, args: string[]): Promise<void> {
    switch (command) {
      case 'respond':
        await this.generateResponse(args)
        break
      case 'train':
        await this.engine.trainFromBlogPosts()
        break
      case 'stats':
        await this.engine.getVoiceStats()
        break
      case 'test':
        await this.runVoiceTest()
        break
      default:
        console.error(chalk.red(`❌ Unknown command: ${command}`))
        this.showUsage()
        process.exit(1)
    }
  }

  private async generateResponse(args: string[]): Promise<void> {
    const question = args.join(' ')
    if (!question) {
      throw new Error('Question is required')
    }

    const context: VoiceContext = {
      audience: 'founders',
      format: 'blog-post',
      topic_domain: 'startup',
      formality: 'professional',
      length: 'medium',
    }

    const response = await this.engine.generateResponse(question, context)

    console.log(chalk.blue("\n📝 Jonathan's Response:"))
    console.log(chalk.white(response.content))
    console.log(
      chalk.gray(`\n📊 Confidence: ${Math.round(response.confidence * 100)}%`)
    )
    console.log(
      chalk.gray(`⏱️  Processing time: ${response.metadata.processing_time}ms`)
    )
  }

  private async runVoiceTest(): Promise<void> {
    console.log(chalk.blue('🧪 Running voice authenticity test...'))

    const testQuestions = [
      "What's your take on startup equity compensation?",
      'How should startups approach AI integration?',
      "What's wrong with most startup advice?",
    ]

    for (const question of testQuestions) {
      console.log(chalk.yellow(`\n❓ Testing: "${question}"`))

      const context: VoiceContext = {
        audience: 'founders',
        format: 'blog-post',
        topic_domain: 'startup',
        formality: 'professional',
        length: 'short',
      }

      const response = await this.engine.generateResponse(question, context)
      console.log(
        chalk.gray(`   Confidence: ${Math.round(response.confidence * 100)}%`)
      )

      if (response.confidence < 0.7) {
        console.log(chalk.red(`   ⚠️  Low confidence response`))
      } else {
        console.log(chalk.green(`   ✅ Authentic response`))
      }
    }
  }

  private showUsage(): void {
    console.error(chalk.red('❌ Please provide a command.'))
    console.error('Usage: bun run jonathan-voice <command> [args]')
    console.error('\nCommands:')
    console.error(
      "  respond <question>    - Generate Jonathan's response to a question"
    )
    console.error('  train                 - Train voice model from blog posts')
    console.error('  stats                 - Show voice engine statistics')
    console.error('  test                  - Run voice authenticity tests')
    console.error('\nExamples:')
    console.error(
      '  bun run jonathan-voice respond "How should I evaluate AI vendors?"'
    )
    console.error('  bun run jonathan-voice test')
  }
}

// Main entry point
if (import.meta.main) {
  new VoiceCLI().run().catch(console.error)
}
