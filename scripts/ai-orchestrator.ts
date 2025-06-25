#!/usr/bin/env bun

import { parseArgs } from 'util'
import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'
import {
  WorkflowTask,
  WorkflowPipeline,
  AIAgent,
  AgentCapability,
  ContentPipelineConfig,
  BlogPostOutline,
  BlogPostContent,
  SEOAnalysis,
  ContentQuality,
  SocialMediaSnippets,
  WorkflowError,
  ValidationError,
} from './lib/ai-types.js'

// Agent registry and capabilities
const AGENT_REGISTRY: Map<string, AIAgent> = new Map([
  [
    'gemini',
    {
      id: 'gemini',
      name: 'Google Gemini',
      model: 'gemini-1.5-flash',
      status: 'available',
      capabilities: [
        {
          name: 'content_generation',
          description: 'Generate blog posts, outlines, and content',
          input_types: ['topic', 'outline'],
          output_types: ['blog_post', 'outline', 'tags', 'titles'],
          estimated_time: 30,
          cost_estimate: 1,
        },
        {
          name: 'social_media',
          description: 'Generate social media snippets',
          input_types: ['blog_post'],
          output_types: ['social_snippets'],
          estimated_time: 15,
          cost_estimate: 0.5,
        },
      ],
    },
  ],
  [
    'claude',
    {
      id: 'claude',
      name: 'Anthropic Claude',
      model: 'claude-3-5-sonnet-20241022',
      status: 'available',
      capabilities: [
        {
          name: 'seo_analysis',
          description: 'Analyze and optimize content for SEO',
          input_types: ['blog_post'],
          output_types: ['seo_analysis'],
          estimated_time: 45,
          cost_estimate: 2,
        },
        {
          name: 'quality_review',
          description: 'Analyze content quality and provide feedback',
          input_types: ['blog_post'],
          output_types: ['quality_analysis'],
          estimated_time: 60,
          cost_estimate: 2.5,
        },
        {
          name: 'content_generation',
          description: 'Generate high-quality blog content',
          input_types: ['topic', 'outline'],
          output_types: ['blog_post', 'outline'],
          estimated_time: 90,
          cost_estimate: 3,
        },
      ],
    },
  ],
])

// Workflow orchestrator
class AIOrchestrator {
  private workflows: Map<string, WorkflowPipeline> = new Map()
  private taskQueue: WorkflowTask[] = []
  private isProcessing = false

  constructor(private config: ContentPipelineConfig) {}

  async createContentPipeline(
    topic: string,
    options: {
      preferredAgent?: string
      enableSEO?: boolean
      enableQuality?: boolean
      enableSocial?: boolean
    } = {}
  ): Promise<string> {
    const workflowId = this.generateWorkflowId()
    const tasks: WorkflowTask[] = []

    // Task 1: Generate outline
    const outlineTask: WorkflowTask = {
      id: this.generateTaskId(),
      type: 'content_generation',
      priority: 'high',
      status: 'pending',
      assigned_agent:
        options.preferredAgent || this.selectBestAgent('content_generation'),
      input: { topic, type: 'outline' },
      created_at: new Date(),
      updated_at: new Date(),
    }
    tasks.push(outlineTask)

    // Task 2: Generate full content
    const contentTask: WorkflowTask = {
      id: this.generateTaskId(),
      type: 'content_generation',
      priority: 'high',
      status: 'pending',
      assigned_agent:
        options.preferredAgent || this.selectBestAgent('content_generation'),
      input: { type: 'full_content' },
      dependencies: [outlineTask.id],
      created_at: new Date(),
      updated_at: new Date(),
    }
    tasks.push(contentTask)

    // Conditional tasks based on configuration
    if (options.enableSEO ?? this.config.enableSEOAnalysis) {
      const seoTask: WorkflowTask = {
        id: this.generateTaskId(),
        type: 'seo_analysis',
        priority: 'medium',
        status: 'pending',
        assigned_agent: this.selectBestAgent('seo_analysis'),
        input: { type: 'seo_analysis' },
        dependencies: [contentTask.id],
        created_at: new Date(),
        updated_at: new Date(),
      }
      tasks.push(seoTask)
    }

    if (options.enableQuality ?? this.config.enableQualityCheck) {
      const qualityTask: WorkflowTask = {
        id: this.generateTaskId(),
        type: 'quality_check',
        priority: 'medium',
        status: 'pending',
        assigned_agent: this.selectBestAgent('quality_review'),
        input: { type: 'quality_analysis' },
        dependencies: [contentTask.id],
        created_at: new Date(),
        updated_at: new Date(),
      }
      tasks.push(qualityTask)
    }

    if (options.enableSocial ?? this.config.enableSocialGeneration) {
      const socialTask: WorkflowTask = {
        id: this.generateTaskId(),
        type: 'social_media',
        priority: 'low',
        status: 'pending',
        assigned_agent: this.selectBestAgent('social_media'),
        input: { type: 'social_snippets' },
        dependencies: [contentTask.id],
        created_at: new Date(),
        updated_at: new Date(),
      }
      tasks.push(socialTask)
    }

    // Create workflow
    const workflow: WorkflowPipeline = {
      id: workflowId,
      name: `Content Pipeline: ${topic}`,
      description: `Automated content creation pipeline for topic: ${topic}`,
      tasks,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    }

    this.workflows.set(workflowId, workflow)

    console.log(chalk.blue(`🚀 Created content pipeline: ${workflowId}`))
    console.log(chalk.gray(`   Topic: ${topic}`))
    console.log(chalk.gray(`   Tasks: ${tasks.length}`))
    console.log(
      chalk.gray(
        `   Estimated time: ${this.estimateWorkflowTime(workflow)} seconds`
      )
    )

    return workflowId
  }

  async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new WorkflowError(`Workflow not found: ${workflowId}`, workflowId)
    }

    console.log(chalk.blue(`\n🔄 Executing workflow: ${workflow.name}`))
    workflow.status = 'running'
    workflow.updated_at = new Date()

    try {
      // Add all pending tasks to queue
      const pendingTasks = workflow.tasks.filter(
        (task) => task.status === 'pending'
      )
      this.taskQueue.push(...pendingTasks)

      // Process task queue
      await this.processTaskQueue()

      workflow.status = 'completed'
      workflow.updated_at = new Date()

      console.log(chalk.green(`\n✅ Workflow completed: ${workflow.name}`))
      await this.generateWorkflowReport(workflowId)
    } catch (error) {
      workflow.status = 'failed'
      workflow.updated_at = new Date()

      console.error(chalk.red(`\n❌ Workflow failed: ${workflow.name}`))
      console.error(error)
      throw error
    }
  }

  private async processTaskQueue(): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      while (this.taskQueue.length > 0) {
        // Find tasks that can be executed (no pending dependencies)
        const executableTasks = this.taskQueue.filter((task) =>
          this.areTaskDependenciesMet(task)
        )

        if (executableTasks.length === 0) {
          // Check for circular dependencies or incomplete workflows
          const pendingTasks = this.taskQueue.filter(
            (task) => task.status === 'pending'
          )
          if (pendingTasks.length > 0) {
            throw new WorkflowError(
              'No executable tasks found - possible circular dependency',
              'unknown'
            )
          }
          break
        }

        // Execute tasks in parallel based on priority
        const sortedTasks = executableTasks.sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })

        // Execute up to 2 tasks in parallel
        const tasksToExecute = sortedTasks.slice(0, 2)
        const promises = tasksToExecute.map((task) => this.executeTask(task))

        await Promise.all(promises)

        // Remove completed tasks from queue
        this.taskQueue = this.taskQueue.filter(
          (task) => !tasksToExecute.some((executed) => executed.id === task.id)
        )
      }
    } finally {
      this.isProcessing = false
    }
  }

  private async executeTask(task: WorkflowTask): Promise<void> {
    console.log(
      chalk.yellow(`\n🔧 Executing task: ${task.type} (${task.assigned_agent})`)
    )

    task.status = 'in_progress'
    task.updated_at = new Date()

    // Update agent status
    const agent = AGENT_REGISTRY.get(task.assigned_agent)
    if (agent) {
      agent.status = 'busy'
      agent.current_task = task.id
    }

    try {
      const startTime = Date.now()

      // Execute the actual task
      const output = await this.callAgent(
        task.assigned_agent,
        task.type,
        task.input
      )

      task.output = output
      task.status = 'completed'
      task.updated_at = new Date()

      const executionTime = Math.round((Date.now() - startTime) / 1000)
      console.log(chalk.green(`✅ Task completed in ${executionTime}s`))
    } catch (error) {
      task.status = 'failed'
      task.error = error instanceof Error ? error.message : String(error)
      task.updated_at = new Date()

      console.error(chalk.red(`❌ Task failed: ${task.error}`))
      throw error
    } finally {
      // Update agent status
      if (agent) {
        agent.status = 'available'
        agent.current_task = undefined
      }
    }
  }

  private async callAgent(
    agentId: string,
    taskType: string,
    input: unknown
  ): Promise<unknown> {
    const scriptMap: Record<string, string> = {
      gemini: 'scripts/gemini.ts',
      claude: 'scripts/claude.ts',
    }

    const scriptPath = scriptMap[agentId]
    if (!scriptPath) {
      throw new Error(`Unknown agent: ${agentId}`)
    }

    // Map task types to script commands
    const commandMap: Record<string, string> = {
      content_generation:
        input.type === 'outline' ? 'new-draft' : 'create-post',
      seo_analysis: 'analyze-seo',
      quality_check: 'analyze-quality',
      social_media: 'social',
    }

    const command = commandMap[taskType]
    if (!command) {
      throw new Error(`Unknown task type: ${taskType}`)
    }

    // Execute the actual script command
    const { promisify } = await import('util')
    const { exec } = await import('child_process')
    const execAsync = promisify(exec)

    try {
      // Build the actual command based on task type and input
      const topicArg = this.extractTopicFromInput(input)
      const fullCommand = `bun ${scriptPath} ${command} ${topicArg ? `"${topicArg}"` : ''}`

      const { stdout, stderr } = await execAsync(fullCommand)

      if (stderr) {
        console.warn(chalk.yellow('Agent warning:'), stderr)
      }

      // Parse the output based on task type
      return this.parseAgentOutput(stdout, taskType)
    } catch (error) {
      throw new Error(`Agent execution failed: ${error}`)
    }
  }

  private extractTopicFromInput(input: unknown): string | null {
    if (typeof input === 'object' && input !== null) {
      const inputObj = input as Record<string, unknown>
      if (typeof inputObj.topic === 'string') {
        return inputObj.topic
      }
    }
    return null
  }

  private parseAgentOutput(stdout: string, taskType: string): unknown {
    // Parse the actual output from the AI agents
    switch (taskType) {
      case 'content_generation': {
        // Extract filename and content from the output
        const filenameMatch = stdout.match(/📁 Path: ([^\n]+)/)
        const titleMatch = stdout.match(/📝 Title: ([^\n]+)/)

        return {
          filename: filenameMatch ? filenameMatch[1] : null,
          title: titleMatch ? titleMatch[1] : null,
          success: stdout.includes('✅'),
        }
      }

      case 'seo_analysis':
      case 'quality_check':
      case 'social_media':
        // For analysis tasks, extract the JSON output if present
        try {
          const jsonMatch = stdout.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
          }
        } catch {
          // If JSON parsing fails, return a summary based on the output
        }

        return {
          output: stdout,
          success: stdout.includes('✅'),
        }

      default:
        return {
          output: stdout,
          success: !stdout.includes('❌'),
        }
    }
  }

  private areTaskDependenciesMet(task: WorkflowTask): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true
    }

    // Find all tasks in all workflows (simplified - in real implementation, scope to workflow)
    const allTasks = Array.from(this.workflows.values()).flatMap(
      (workflow) => workflow.tasks
    )

    return task.dependencies.every((depId) => {
      const dependency = allTasks.find((t) => t.id === depId)
      return dependency && dependency.status === 'completed'
    })
  }

  private selectBestAgent(capability: string): string {
    const availableAgents = Array.from(AGENT_REGISTRY.values()).filter(
      (agent) =>
        agent.status === 'available' &&
        agent.capabilities.some((cap) => cap.name === capability)
    )

    if (availableAgents.length === 0) {
      throw new Error(`No available agents with capability: ${capability}`)
    }

    // Select agent with best capability match (lowest cost + time)
    const bestAgent = availableAgents.reduce((best, current) => {
      const bestCap = best.capabilities.find((cap) => cap.name === capability)!
      const currentCap = current.capabilities.find(
        (cap) => cap.name === capability
      )!

      const bestScore = bestCap.cost_estimate + bestCap.estimated_time / 10
      const currentScore =
        currentCap.cost_estimate + currentCap.estimated_time / 10

      return currentScore < bestScore ? current : best
    })

    return bestAgent.id
  }

  private estimateWorkflowTime(workflow: WorkflowPipeline): number {
    // Simple estimation - in real implementation, account for dependencies and parallelization
    return workflow.tasks.reduce((total, task) => {
      const agent = AGENT_REGISTRY.get(task.assigned_agent)
      const capability = agent?.capabilities.find(
        (cap) => cap.name === task.type
      )
      return total + (capability?.estimated_time || 30)
    }, 0)
  }

  private async generateWorkflowReport(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return

    console.log(chalk.blue('\n📊 Workflow Report:'))
    console.log(chalk.gray(`Workflow: ${workflow.name}`))
    console.log(chalk.gray(`Status: ${workflow.status}`))
    console.log(
      chalk.gray(
        `Duration: ${Math.round((workflow.updated_at.getTime() - workflow.created_at.getTime()) / 1000)}s`
      )
    )
    console.log(chalk.gray(`Tasks: ${workflow.tasks.length}`))

    const completedTasks = workflow.tasks.filter(
      (task) => task.status === 'completed'
    )
    const failedTasks = workflow.tasks.filter(
      (task) => task.status === 'failed'
    )

    console.log(chalk.green(`✅ Completed: ${completedTasks.length}`))
    if (failedTasks.length > 0) {
      console.log(chalk.red(`❌ Failed: ${failedTasks.length}`))
    }

    // Show task details
    console.log(chalk.blue('\nTask Details:'))
    workflow.tasks.forEach((task) => {
      const statusIcon =
        task.status === 'completed'
          ? '✅'
          : task.status === 'failed'
            ? '❌'
            : task.status === 'in_progress'
              ? '🔄'
              : '⏳'
      console.log(`  ${statusIcon} ${task.type} (${task.assigned_agent})`)

      if (task.error) {
        console.log(chalk.red(`    Error: ${task.error}`))
      }
    })
  }

  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public methods for CLI
  async listWorkflows(): Promise<void> {
    console.log(chalk.blue('📋 Active Workflows:'))

    if (this.workflows.size === 0) {
      console.log(chalk.gray('No workflows found'))
      return
    }

    Array.from(this.workflows.values()).forEach((workflow) => {
      const statusIcon =
        workflow.status === 'completed'
          ? '✅'
          : workflow.status === 'failed'
            ? '❌'
            : workflow.status === 'running'
              ? '🔄'
              : '⏳'

      console.log(`  ${statusIcon} ${workflow.id} - ${workflow.name}`)
      console.log(
        chalk.gray(
          `    Status: ${workflow.status} | Tasks: ${workflow.tasks.length}`
        )
      )
    })
  }

  async showAgentStatus(): Promise<void> {
    console.log(chalk.blue('🤖 Agent Status:'))

    Array.from(AGENT_REGISTRY.values()).forEach((agent) => {
      const statusIcon =
        agent.status === 'available'
          ? '🟢'
          : agent.status === 'busy'
            ? '🟡'
            : '🔴'

      console.log(`  ${statusIcon} ${agent.name} (${agent.model})`)
      console.log(chalk.gray(`    Status: ${agent.status}`))
      if (agent.current_task) {
        console.log(chalk.gray(`    Current Task: ${agent.current_task}`))
      }
      console.log(
        chalk.gray(
          `    Capabilities: ${agent.capabilities.map((c) => c.name).join(', ')}`
        )
      )
    })
  }
}

// CLI interface
class OrchestratorCLI {
  private orchestrator: AIOrchestrator

  constructor() {
    const defaultConfig: ContentPipelineConfig = {
      enableSEOAnalysis: true,
      enableQualityCheck: true,
      enableSocialGeneration: true,
      requireHumanReview: false,
      autoPublish: false,
      qualityThreshold: 75,
      seoThreshold: 70,
    }

    this.orchestrator = new AIOrchestrator(defaultConfig)
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
      console.error(chalk.red('❌ Command failed:'), error)
      process.exit(1)
    }
  }

  private async executeCommand(command: string, args: string[]): Promise<void> {
    switch (command) {
      case 'create':
        await this.createPipeline(args)
        break
      case 'execute':
        await this.executePipeline(args)
        break
      case 'create-and-run':
        await this.createAndRunPipeline(args)
        break
      case 'list':
        await this.orchestrator.listWorkflows()
        break
      case 'agents':
        await this.orchestrator.showAgentStatus()
        break
      case 'status':
        this.showStatus()
        break
      default:
        console.error(chalk.red(`❌ Unknown command: ${command}`))
        this.showUsage()
        process.exit(1)
    }
  }

  private async createPipeline(args: string[]): Promise<void> {
    const topic = args.join(' ')
    if (!topic) {
      throw new Error('Topic is required')
    }

    const workflowId = await this.orchestrator.createContentPipeline(topic)
    console.log(chalk.green(`✅ Pipeline created: ${workflowId}`))
  }

  private async executePipeline(args: string[]): Promise<void> {
    const workflowId = args[0]
    if (!workflowId) {
      throw new Error('Workflow ID is required')
    }

    await this.orchestrator.executeWorkflow(workflowId)
  }

  private async createAndRunPipeline(args: string[]): Promise<void> {
    const topic = args.join(' ')
    if (!topic) {
      throw new Error('Topic is required')
    }

    console.log(
      chalk.blue(`🚀 Creating and executing content pipeline for: "${topic}"`)
    )

    const workflowId = await this.orchestrator.createContentPipeline(topic)
    await this.orchestrator.executeWorkflow(workflowId)
  }

  private showStatus(): void {
    console.log(chalk.blue('📊 AI Orchestrator Status:'))
    console.log(chalk.gray('  System: Operational'))
    console.log(chalk.gray(`  Registered Agents: ${AGENT_REGISTRY.size}`))
    console.log(chalk.gray('  Available Capabilities:'))

    const allCapabilities = Array.from(AGENT_REGISTRY.values())
      .flatMap((agent) => agent.capabilities)
      .map((cap) => cap.name)

    const uniqueCapabilities = [...new Set(allCapabilities)]
    uniqueCapabilities.forEach((cap) => {
      console.log(chalk.gray(`    • ${cap}`))
    })
  }

  private showUsage(): void {
    console.error(chalk.red('❌ Please provide a command.'))
    console.error('Usage: bun run ai-orchestrator <command> [args]')
    console.error('\nCommands:')
    console.error('  create <topic>           - Create a content pipeline')
    console.error('  execute <workflow-id>    - Execute a specific workflow')
    console.error(
      '  create-and-run <topic>   - Create and immediately execute a pipeline'
    )
    console.error('  list                     - List all workflows')
    console.error('  agents                   - Show agent status')
    console.error('  status                   - Show system status')
    console.error('\nExamples:')
    console.error(
      '  bun run ai-orchestrator create-and-run "AI-Powered DevOps"'
    )
    console.error('  bun run ai-orchestrator agents')
  }
}

// Main entry point
if (import.meta.main) {
  new OrchestratorCLI().run().catch(console.error)
}
