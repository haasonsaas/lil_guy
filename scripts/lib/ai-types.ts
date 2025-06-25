#!/usr/bin/env bun

// Shared types and interfaces for multi-AI system

export interface BlogPostOutline {
  title: string
  description: string
  tags: string[]
  outline: string
}

export interface BlogPostContent extends BlogPostOutline {
  content: string
}

export interface SocialMediaSnippets {
  twitter: string
  linkedin: string
}

export interface TitleSuggestions {
  titles: string[]
}

export interface TagSuggestions {
  tags: string[]
}

export interface SEOAnalysis {
  score: number
  issues: SEOIssue[]
  recommendations: string[]
  keywords: string[]
  readability: number
}

export interface SEOIssue {
  type:
    | 'title'
    | 'description'
    | 'headings'
    | 'keywords'
    | 'readability'
    | 'structure'
  severity: 'error' | 'warning' | 'info'
  message: string
  fix?: string
}

export interface ContentQuality {
  score: number
  metrics: {
    clarity: number
    engagement: number
    technical_accuracy: number
    completeness: number
  }
  feedback: string[]
  improvements: string[]
}

export interface PostFrontmatter {
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
  series?: {
    name: string
    part: number
  }
}

export interface AIResponse<T = unknown> {
  data: T
  metadata: {
    model: string
    tokens_used?: number
    processing_time: number
    cache_hit: boolean
  }
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

export interface WorkflowTask {
  id: string
  type:
    | 'content_generation'
    | 'seo_analysis'
    | 'quality_check'
    | 'social_media'
    | 'review'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  assigned_agent: string
  input: unknown
  output?: unknown
  error?: string
  created_at: Date
  updated_at: Date
  dependencies?: string[]
}

export interface WorkflowPipeline {
  id: string
  name: string
  description: string
  tasks: WorkflowTask[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: Date
  updated_at: Date
}

export interface AgentCapability {
  name: string
  description: string
  input_types: string[]
  output_types: string[]
  estimated_time: number // in seconds
  cost_estimate: number // relative cost
}

export interface AIAgent {
  id: string
  name: string
  model: string
  capabilities: AgentCapability[]
  status: 'available' | 'busy' | 'offline'
  current_task?: string
}

// Error types
export class AIError extends Error {
  constructor(
    message: string,
    public agent: string,
    public statusCode?: number,
    public response?: string
  ) {
    super(message)
    this.name = 'AIError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public agent?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public agent: string,
    public retryAfter?: number
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class WorkflowError extends Error {
  constructor(
    message: string,
    public workflowId: string,
    public taskId?: string
  ) {
    super(message)
    this.name = 'WorkflowError'
  }
}

// Utility types
export type AgentRole =
  | 'content_creator'
  | 'seo_optimizer'
  | 'quality_reviewer'
  | 'social_manager'

export interface ContentPipelineConfig {
  enableSEOAnalysis: boolean
  enableQualityCheck: boolean
  enableSocialGeneration: boolean
  requireHumanReview: boolean
  autoPublish: boolean
  qualityThreshold: number
  seoThreshold: number
}
