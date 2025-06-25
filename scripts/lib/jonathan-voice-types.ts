#!/usr/bin/env bun

// Jonathan Voice Engine - Type definitions for personal AI scaling

export interface VoiceProfile {
  // Core voice characteristics
  tone: {
    directness: number // 0-1, how direct and confident
    contrarian: number // 0-1, tendency to challenge conventional wisdom
    empathy: number // 0-1, empathy for user struggles
    pragmatism: number // 0-1, focus on practical over theoretical
  }

  // Writing patterns
  style: {
    paragraphLength: 'short' | 'medium' | 'long'
    useContractions: boolean
    activeVoice: number // 0-1, preference for active voice
    presentTense: number // 0-1, preference for present tense
    rhetoicalQuestions: boolean
  }

  // Content philosophy
  beliefs: {
    execution_over_perfection: boolean
    context_matters: boolean
    speed_of_learning: boolean
    cognitive_bravery: boolean
    transparency_builds_trust: boolean
  }

  // Signature phrases and transitions
  phrases: {
    openings: string[]
    transitions: string[]
    emphasis: string[]
    authority_signals: string[]
  }

  // Expertise areas
  expertise: {
    technical_leadership: number // 0-1, confidence level
    startup_operations: number
    organizational_dynamics: number
    security_mindset: number
    ai_integration: number
  }

  // Industry perspectives and hot takes
  perspectives: {
    [topic: string]: {
      stance: 'positive' | 'negative' | 'nuanced'
      key_points: string[]
      contrarian_angle?: string
    }
  }
}

export interface VoiceContext {
  audience:
    | 'founders'
    | 'engineers'
    | 'product-managers'
    | 'investors'
    | 'general'
  format:
    | 'blog-post'
    | 'twitter-thread'
    | 'email'
    | 'speaking'
    | 'interview'
    | 'advice'
  topic_domain:
    | 'startup'
    | 'technical'
    | 'product'
    | 'ai'
    | 'security'
    | 'leadership'
  formality: 'casual' | 'professional' | 'expert'
  length: 'short' | 'medium' | 'long'
}

export interface VoiceResponse {
  content: string
  confidence: number // 0-1, how confident the AI is this sounds like Jonathan
  voice_markers: {
    signature_phrases_used: string[]
    perspective_alignment: number // 0-1
    style_consistency: number // 0-1
  }
  metadata: {
    processing_time: number
    voice_profile_version: string
    sources_referenced: string[]
  }
}

export interface ExpertiseFramework {
  name: string
  domain: string
  description: string
  key_principles: string[]
  application_contexts: string[]
  common_mistakes: string[]
  success_metrics: string[]
  jonathan_perspective: string
}

export interface VoiceTrainingData {
  source: 'blog-post' | 'comment' | 'interview' | 'social-media'
  content: string
  topic: string
  audience: string
  date: string
  engagement_metrics?: {
    views?: number
    shares?: number
    comments?: number
  }
  voice_markers: {
    signature_phrases: string[]
    perspective_expressed: string[]
    frameworks_used: string[]
  }
}

export interface PersonalityTrait {
  name: string
  strength: number // 0-1
  manifestations: string[] // How this trait shows up in writing
  contexts: string[] // When this trait is most prominent
}

export interface ThoughtPattern {
  pattern_type:
    | 'first-principles'
    | 'systems-thinking'
    | 'pattern-recognition'
    | 'contrarian-analysis'
  description: string
  typical_triggers: string[] // What topics/situations activate this pattern
  output_characteristics: string[] // How this thinking shows up in writing
  example_applications: string[]
}

export interface JonathanFramework {
  id: string
  name: string
  category: 'product' | 'technical' | 'business' | 'leadership' | 'ai'
  description: string
  principles: string[]
  application_steps: string[]
  common_applications: string[]
  jonathan_insights: string[]
  real_world_examples: string[]
}

export interface VoiceValidation {
  authenticity_score: number // 0-1, how authentic this sounds
  perspective_alignment: number // 0-1, how well it matches Jonathan's views
  style_consistency: number // 0-1, how consistent with writing patterns
  expertise_accuracy: number // 0-1, how accurate the expertise claims are

  validation_notes: {
    authentic_elements: string[]
    style_matches: string[]
    perspective_matches: string[]
    potential_issues: string[]
    improvement_suggestions: string[]
  }
}

export interface QuestionContext {
  question: string
  domain: string
  questioner_background?: string
  expected_response_length: 'tweet' | 'paragraph' | 'essay'
  urgency: 'low' | 'medium' | 'high'
  public_private: 'public' | 'private'
}

export interface ResponseStrategy {
  approach:
    | 'direct-answer'
    | 'framework-based'
    | 'story-example'
    | 'contrarian-take'
    | 'nuanced-analysis'
  key_points: string[]
  jonathan_angle: string
  supporting_evidence: string[]
  potential_counterarguments: string[]
}

// Error types for voice engine
export class VoiceEngineError extends Error {
  constructor(
    message: string,
    public operation: string,
    public confidence?: number
  ) {
    super(message)
    this.name = 'VoiceEngineError'
  }
}

export class AuthenticityError extends Error {
  constructor(
    message: string,
    public authenticity_score: number,
    public issues: string[]
  ) {
    super(message)
    this.name = 'AuthenticityError'
  }
}

export class ExpertiseError extends Error {
  constructor(
    message: string,
    public domain: string,
    public confidence_level: number
  ) {
    super(message)
    this.name = 'ExpertiseError'
  }
}
