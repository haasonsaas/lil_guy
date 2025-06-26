---
author: Jonathan Haas
pubDate: '2025-06-25'
title: 'The Orchestration Dance: What I Learned Building a Multi-AI Content System'
description: >-
  I built a system that combines Gemini and Claude to generate 780+ word blog posts automatically. Here's what actually worked, what didn't, and why most teams are overcomplicating AI orchestration.
featured: false
draft: true
tags:
  - AI
  - multi-ai
  - content-orchestration
  - ai-agents
  - developer-experience
image:
  url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643'
  alt: 'The Orchestration Dance: What I Learned Building a Multi-AI Content System'
---

I just spent a week building something that sounds impressive on paper: a multi-AI content orchestration system that automatically generates full blog posts by combining multiple AI models.

Here's what actually happened: I learned that most of what people call "AI orchestration" is just well-disguised complexity porn. The hard parts aren't the AI models—they're the boring workflow problems that everyone skips over.

This post breaks down what I built, what worked, what failed spectacularly, and why your team is probably overcomplicating their AI stack.

## The System: Gemini + Claude = Full Blog Posts

The goal was simple: input a topic, get a complete 780+ word blog post that sounds like me. No drafts, no outlines—finished content ready to publish.

Here's the actual architecture I built:

**Step 1: Draft Generation (Gemini)**

- Generate structured outline with title, description, tags
- Create 3-4 main sections with key points
- Output structured YAML frontmatter + outline

**Step 2: Content Generation (Gemini)**

- Take the outline and write full content
- Target 780+ words with real substance
- Maintain consistent voice and perspective

**Step 3: Quality Validation (Claude)**

- Analyze content for voice consistency
- Check against Jonathan's writing patterns
- Provide improvement suggestions

**Step 4: Orchestration Engine**

- Manage task distribution between AI agents
- Handle retries and error recovery
- Track progress and report status

The whole pipeline is controlled by a single command:

```bash
bun scripts/enhanced-pipeline.ts create "Your Topic Here"
```

## What Actually Worked (And Why)

**1. Two-Step Content Creation**

The breakthrough wasn't using multiple models—it was breaking content creation into logical steps. Gemini creates better outlines when that's all it's focused on. Then it writes better content when given its own outline to work from.

Most teams try to do everything in one massive prompt. That's backwards. Break the work down, let each model do what it's best at.

**2. Dead-Simple Task Distribution**

My orchestration engine is embarrassingly simple:

```typescript
// Task 1: Generate draft outline
const draftTask: WorkflowTask = {
  id: this.generateTaskId(),
  type: 'content_generation',
  priority: 'high',
  status: 'pending',
  assigned_agent: 'gemini',
  input: { topic, command: 'new-draft' },
}

// Task 2: Write full content
const contentTask: WorkflowTask = {
  id: this.generateTaskId(),
  type: 'content_generation',
  priority: 'high',
  status: 'pending',
  assigned_agent: 'gemini',
  input: { slug, command: 'write-blog-post' },
}
```

No fancy model-switching logic. No dynamic optimization. Just: "Do this, then do that."

**3. Specific Model Strengths**

Through testing, I learned where each model actually excels:

**Gemini:**

- Structured output generation (YAML frontmatter, outlines)
- Longer-form content creation (700+ words)
- Consistent formatting and organization
- Better at following specific content templates

**Claude:**

- Voice analysis and authenticity validation
- Complex reasoning about writing patterns
- Nuanced feedback and improvement suggestions
- Better at understanding context and subtext

The key insight: don't use both models for the same task. Use them for complementary tasks.

## What Failed Spectacularly

**1. Dynamic Model Selection**

I initially built logic to choose the "best" model for each task based on topic, length, complexity, etc. Complete waste of time.

The switching overhead killed performance, the decision logic was arbitrary, and I ended up with inconsistent outputs. Fixed model assignment for specific tasks works better.

**2. Complex Prompt Chains**

I tried building sophisticated prompt templates that would "optimize" based on the topic domain, audience, and desired tone. The prompts became unmaintainable novels.

Simple, clear prompts that tell each model exactly what to do work better than "smart" prompts that try to be clever.

**3. Real-Time Quality Scoring**

I built a complex system to score content quality in real-time and retry with different models if the score was low. It was slow, inconsistent, and mostly useless.

Better approach: define clear success criteria upfront, validate with simple checks, iterate on the system based on output quality over time.

## The Non-Obvious Lessons

**1. Input Quality Beats Model Sophistication**

The single biggest factor in output quality? The topic you give it.

"Write about AI testing" produces garbage. "Write about the specific challenges of testing multi-AI systems, including validation approaches and failure modes" produces good content.

Your prompting strategy matters way more than your model selection strategy.

**2. Human-in-the-Loop Is the Secret Sauce**

My best content comes from this workflow:

1. AI generates draft
2. I edit for voice, examples, and insights
3. AI helps with expansion and refinement
4. I do final review and publishing

Pure automation produces mediocre content. Pure human writing is slow. The combination is powerful.

**3. Error Handling Is Where You Live**

AI models fail constantly. Rate limits, timeouts, malformed outputs, service outages. If your orchestration system doesn't handle failures gracefully, it's useless.

My error handling strategy:

- Exponential backoff with jitter for retries
- Fallback to alternative models/approaches
- Clear error messages with specific recovery steps
- Manual override capabilities for everything

## The Meta Moment: AI Writing About AI

Here's the thing that still blows my mind: I'm using this multi-AI system to write about the multi-AI system itself.

The Jonathan Voice Engine (built with Claude) provided insights on orchestration challenges. Gemini generated the initial structure. I edited everything for accuracy and voice. The system documented its own creation.

This post scored 73% authenticity in my voice validation system—high enough to be recognizably "me" but with enough AI assistance to write it 5x faster than pure manual creation.

## What's Actually Hard About Multi-AI Systems

It's not the AI models. It's the boring infrastructure:

**1. State Management**
Keeping track of what each model is working on, what's completed, what failed, what needs retry. Harder than it sounds.

**2. Data Flow**
Making sure the output from Model A becomes proper input for Model B. Format consistency, error propagation, data validation.

**3. Cost Management**  
Multiple models mean multiple API bills. One inefficient prompt can cost you hundreds of dollars before you notice.

**4. Quality Control**
How do you know if the output is good? Automated quality scoring is hard. Human review doesn't scale. You need both.

## Practical Implementation Advice

If you're building something similar:

**Start Simple:**

- Pick one clear use case
- Use one model until you hit real limitations
- Add complexity only when you can measure the improvement

**Focus on Workflows:**

- Map your current human process first
- Identify which steps AI can actually improve
- Keep humans involved in strategic decisions

**Build for Debugging:**

- Log everything
- Make failures visible and recoverable
- Build manual override capabilities from day one

**Measure What Matters:**

- Track output quality, not just technical metrics
- Get feedback from actual users
- Iterate based on real usage patterns

## The Bottom Line

Multi-AI orchestration isn't about having the smartest models or the most sophisticated switching logic. It's about building systems that amplify human capabilities while maintaining control over quality and cost.

Most teams overcomplicate it. They build elaborate architectures when they should be learning what actually works. Start with simple, manual processes. Add automation only when you understand the problem deeply.

The future isn't AI replacing humans—it's AI and humans collaborating more effectively. But that requires building systems that enhance human judgment, not replace it.

_This post was created using the multi-AI system it describes. Total generation time: 12 minutes. Human editing time: 25 minutes. The voice validation system gave it a 73% authenticity score._

---

**Want to study the implementation?**

The multi-AI orchestration system demonstrates several key patterns:

- Two-stage content generation (outline → full content)
- Dead-simple task distribution without over-engineering
- Strategic model assignment based on strengths
- Comprehensive error handling and retry logic
- Human-in-the-loop quality validation

_Note: Implementation details shared for educational transparency. The code repository is private and not available for public access._

The interesting work isn't in the AI models—it's in the boring orchestration layers that make them useful. Study how we handle errors, manage state, and coordinate between different AI systems.
