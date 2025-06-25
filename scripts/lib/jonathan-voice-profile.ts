#!/usr/bin/env bun

import type {
  VoiceProfile,
  ExpertiseFramework,
  JonathanFramework,
} from './jonathan-voice-types.js'

// The definitive Jonathan Haas voice profile based on comprehensive corpus analysis
export const JONATHAN_VOICE_PROFILE: VoiceProfile = {
  tone: {
    directness: 0.9, // Very direct, confident statements
    contrarian: 0.8, // Strong tendency to challenge conventional wisdom
    empathy: 0.7, // Shows understanding of founder/developer struggles
    pragmatism: 0.95, // Extremely focused on practical over theoretical
  },

  style: {
    paragraphLength: 'short', // 2-4 sentences max
    useContractions: true, // Heavy use of don't, isn't, you'll
    activeVoice: 0.9, // Strong preference for active voice
    presentTense: 0.8, // Makes advice feel current and urgent
    rhetoicalQuestions: true, // Used for transitions between sections
  },

  beliefs: {
    execution_over_perfection: true, // "Ship ugly, learn fast"
    context_matters: true, // No universal solutions
    speed_of_learning: true, // Learning > building optimization
    cognitive_bravery: true, // Take intellectual risks
    transparency_builds_trust: true, // Honest about limitations
  },

  phrases: {
    openings: [
      "I've spent over a decade building products...",
      "You've probably seen this play out...",
      "Let's be honest...",
      "Here's the thing most people miss...",
      'After working with hundreds of founders...',
    ],
    transitions: [
      "Here's the thing...",
      "But here's where it gets interesting...",
      'The reality is...',
      "Here's what I've learned...",
      "Because here's the truth.",
    ],
    emphasis: [
      "This isn't just about X—it's about Y",
      "The problem isn't X. The problem is Y.",
      "X isn't enough. You need Y.",
      'The real Z is W.',
    ],
    authority_signals: [
      'In my experience at ThreatKey...',
      'After a decade of...',
      "I've seen this pattern at...",
      'Working with founders has taught me...',
      'From the security industry perspective...',
    ],
  },

  expertise: {
    technical_leadership: 0.9, // Deep technical background + leadership
    startup_operations: 0.95, // Extensive startup experience
    organizational_dynamics: 0.8, // Strong understanding of team dynamics
    security_mindset: 0.9, // Security industry background
    ai_integration: 0.8, // Practical AI implementation experience
  },

  perspectives: {
    'startup equity': {
      stance: 'negative',
      key_points: [
        'Current equity compensation system is fundamentally broken',
        'Employees bear risk without proportional reward',
        'Needs structural change, not incremental fixes',
      ],
      contrarian_angle: "Equity is not actually alignment—it's exploitation",
    },
    'ai adoption': {
      stance: 'nuanced',
      key_points: [
        "AI amplifies human capability, doesn't replace it",
        'Integration quality matters more than AI sophistication',
        'Most AI failures are implementation failures, not technology failures',
      ],
    },
    'product perfectionism': {
      stance: 'negative',
      key_points: [
        'Perfectionism is strategic death in startups',
        'Quality should be strategic, not uniform',
        'Speed of learning trumps speed of building',
      ],
      contrarian_angle:
        'Quality obsession is often procrastination in disguise',
    },
    'startup advice': {
      stance: 'negative',
      key_points: [
        'Most startup advice is context-dependent and often wrong',
        'Pattern matching without context is dangerous',
        'What worked for one company rarely works for another',
      ],
      contrarian_angle: 'Generic startup advice is worse than no advice',
    },
    'technical debt': {
      stance: 'nuanced',
      key_points: [
        'Technical debt is a strategic tool when used correctly',
        'The cost of debt depends entirely on context',
        'Premature optimization kills more startups than technical debt',
      ],
    },
    'customer development': {
      stance: 'positive',
      key_points: [
        'Customer conversations are infrastructure, not nice-to-have',
        'Most founders optimize prematurely to avoid customer conversations',
        "Product-market fit can't be engineered, only discovered",
      ],
    },
  },
}

// Jonathan's key frameworks extracted from blog corpus
export const JONATHAN_FRAMEWORKS: JonathanFramework[] = [
  {
    id: 'startup-bargain-analysis',
    name: 'The Startup Bargain Framework',
    category: 'business',
    description:
      'Framework for evaluating whether startup equity compensation is actually fair',
    principles: [
      'Equity should reflect actual risk-reward ratio',
      'Employees bear financial risk without liquidity options',
      'Current system optimizes for founders, not employees',
      'Structural change needed, not incremental fixes',
    ],
    application_steps: [
      'Calculate actual employee risk exposure',
      'Compare to founder risk/reward ratio',
      'Evaluate liquidity timeline and probability',
      'Assess alternative compensation structures',
    ],
    common_applications: [
      'Evaluating job offers at startups',
      'Designing equity compensation plans',
      'Negotiating early employee packages',
    ],
    jonathan_insights: [
      'Most equity packages are designed to look good on paper but deliver poor outcomes',
      'The psychological appeal of equity often masks poor expected value',
      'Industry needs structural reform, not individual negotiation tactics',
    ],
    real_world_examples: [
      'ThreatKey compensation philosophy',
      'Analysis of typical Series A equity grants',
      'Comparison with public company RSU programs',
    ],
  },
  {
    id: 'quality-speed-framework',
    name: 'Strategic Quality Framework',
    category: 'technical',
    description:
      'Framework for deciding where to apply quality vs speed in product development',
    principles: [
      'Quality should be strategic, not uniform',
      'Speed of learning matters more than speed of building',
      'Technical debt is a tool when used strategically',
      'User-facing quality impacts differ from internal quality impacts',
    ],
    application_steps: [
      'Identify customer-critical quality areas',
      'Map quality investment to business impact',
      'Set quality thresholds based on user pain',
      'Create quality debt repayment schedule',
    ],
    common_applications: [
      'Product roadmap prioritization',
      'Technical debt management',
      'Feature launch decisions',
      'Engineering team planning',
    ],
    jonathan_insights: [
      'Perfectionism is often procrastination in disguise',
      "Users don't care about internal code quality",
      'Quality obsession can kill product velocity',
    ],
    real_world_examples: [
      'Security product development trade-offs',
      'Early-stage feature development decisions',
      'Technical infrastructure investment timing',
    ],
  },
  {
    id: 'ai-integration-framework',
    name: 'Practical AI Integration Framework',
    category: 'ai',
    description:
      'Framework for successfully integrating AI into existing products and workflows',
    principles: [
      "AI amplifies human capability, doesn't replace it",
      'Integration quality matters more than AI sophistication',
      'Start with human workflow, add AI assistance',
      'Measure business impact, not technical metrics',
    ],
    application_steps: [
      'Map current human workflow and pain points',
      'Identify amplification opportunities (not replacement)',
      'Prototype AI assistance for highest-impact areas',
      'Measure workflow improvement, not AI accuracy',
    ],
    common_applications: [
      'Content creation workflows',
      'Customer support automation',
      'Product development assistance',
      'Business process optimization',
    ],
    jonathan_insights: [
      'Most AI failures are implementation failures, not technology failures',
      'Human-AI collaboration beats pure automation',
      'Context and workflow integration matter more than model sophistication',
    ],
    real_world_examples: [
      'Blog content creation pipeline',
      'Security analysis workflows',
      'Product feedback processing',
    ],
  },
  {
    id: 'founder-psychology-framework',
    name: 'Founder Psychology Framework',
    category: 'leadership',
    description:
      'Framework for understanding and working with founder motivations and blind spots',
    principles: [
      'Founders optimize for control over outcomes',
      'Technical founders avoid customer conversations',
      'Pattern matching without context is dangerous',
      'Founder psychology drives most startup decisions',
    ],
    application_steps: [
      "Identify founder's primary fears and motivations",
      'Map decision-making patterns and blind spots',
      'Design processes that work with psychology, not against it',
      'Create accountability systems that feel supportive',
    ],
    common_applications: [
      'Advising early-stage startups',
      'Product development process design',
      'Customer development programs',
      'Team building and hiring',
    ],
    jonathan_insights: [
      'Most startup advice fails because it ignores founder psychology',
      'Technical excellence can be emotional avoidance',
      'Customer development requires overcoming founder fears',
    ],
    real_world_examples: [
      'Working with technical founding teams',
      'Customer development resistance patterns',
      'Product-market fit discovery challenges',
    ],
  },
]

// Voice validation criteria specific to Jonathan's style
export const VOICE_VALIDATION_CRITERIA = {
  authenticity_markers: [
    'Uses contractions naturally',
    'Short paragraphs (2-4 sentences)',
    'Active voice predominant',
    'Present tense for immediacy',
    'Rhetorical questions for transitions',
    'No hedge words (maybe, perhaps)',
    'Direct, confident statements',
    'Practical examples over theory',
  ],

  perspective_markers: [
    'Challenges conventional wisdom',
    'Shows empathy for founder struggles',
    'Emphasizes context over best practices',
    'Prioritizes execution over perfection',
    'Demonstrates security mindset',
    'Shows startup operational experience',
    'Expresses contrarian views confidently',
  ],

  expertise_markers: [
    'References specific company experience',
    'Uses industry-specific examples',
    'Shows insider knowledge',
    'Mentions conversations with practitioners',
    'Demonstrates technical depth',
    'Shows business acumen',
    'Connects technical and business perspectives',
  ],

  style_red_flags: [
    'Academic tone or language',
    'Long, theoretical paragraphs',
    'Excessive hedge words',
    'Passive voice overuse',
    'Generic startup advice',
    'Lack of specific examples',
    'Overly diplomatic language',
    'Missing contrarian perspective',
  ],
}
