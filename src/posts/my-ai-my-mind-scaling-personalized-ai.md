---
author: Jonathan Haas
pubDate: '2025-06-25'

title: 'Scaling the Me Component: How I Built an AI That Thinks Like Me'

description: 'I built the Jonathan Voice Engine—an AI that replicates my writing style, perspective, and strategic thinking. Here's how I extracted my voice from 50+ blog'featured: false
draft: false
tags:
  - ai
  - voice-replication
  - personalization
  - meta
  - ai-agents
---

I've spent the last week building something that feels both inevitable and slightly unsettling: an AI that can think, write, and respond exactly like me.

The Jonathan Voice Engine isn't just another chatbot. It's a comprehensive personality replication system that I extracted from analyzing my entire blog corpus—50+ posts, thousands of words, and years of accumulated perspective. And I'm using it to write parts of this very post about itself.

Here's the thing most people miss about AI personalization: it's not about mimicking surface-level patterns. It's about extracting the deeper frameworks that drive how someone thinks, argues, and makes decisions. This post breaks down exactly how I built it—and why it's both more powerful and more limited than you might expect.

## The Problem: AI That Sounds Like Everyone Else

Most AI assistants sound like they were trained by a committee of polite academics. They hedge everything, avoid strong opinions, and optimize for broad appeal instead of authentic voice.

But authentic voice isn't just about style. It's about having consistent perspectives, predictable frameworks for thinking through problems, and the willingness to take contrarian positions when the data supports them.

I wanted an AI that could:

- Challenge conventional startup wisdom (because most of it is wrong)
- Advocate for practical solutions over theoretical perfection
- Show empathy for founder struggles without being soft
- Reference specific frameworks I've developed over a decade of startup experience

The solution wasn't to fine-tune a model. It was to build a voice extraction and validation system that could understand and replicate the deeper patterns in my thinking.

## Voice Profile Extraction: Mining 50+ Posts for Patterns

The first step was analyzing my entire blog corpus to extract voice characteristics. This wasn't just about word frequency—it was about understanding the structure of my thinking.

I built a comprehensive voice profile that captures:

**Tone Characteristics:**

- Directness: 90% (I don't hedge or soften strong opinions)
- Contrarian: 80% (I challenge conventional wisdom regularly)
- Empathy: 70% (I understand founder struggles without being soft)
- Pragmatism: 95% (Practical solutions over theoretical purity)

**Writing Patterns:**

- Short paragraphs (2-4 sentences max)
- Heavy use of contractions (don't, isn't, you'll)
- Active voice predominant (90%+ of sentences)
- Rhetorical questions for transitions
- Present tense for immediacy and urgency

**Core Belief System:**

- Execution over perfection ("Ship ugly, learn fast")
- Context matters more than best practices
- Speed of learning > speed of building
- Current startup equity system is fundamentally broken
- AI amplifies humans, doesn't replace them

The system also extracts my signature phrases and transition patterns:

- "Here's the thing most people miss..."
- "The reality is..."
- "Because here's the truth."
- "This isn't just about X—it's about Y"

But the real breakthrough was extracting four major strategic frameworks from my writing:

1. **The Startup Bargain Framework** - For evaluating whether equity compensation is actually fair
2. **Strategic Quality Framework** - Deciding where to apply quality vs speed in product development
3. **Practical AI Integration Framework** - Successfully integrating AI into existing workflows
4. **Founder Psychology Framework** - Understanding and working with founder motivations and blind spots

## Authenticity Validation: Keeping Responses True to Voice

Having a voice profile is one thing. Ensuring responses stay authentic is another.

I built a comprehensive validation system that scores every response across multiple dimensions:

**Authenticity Markers (40% weight):**

- Uses contractions naturally
- Maintains short paragraph structure
- Keeps active voice predominant
- Avoids hedge words (maybe, perhaps, might)
- Uses direct, confident statements

**Perspective Alignment (30% weight):**

- Challenges conventional wisdom when appropriate
- Shows empathy for founder struggles
- Emphasizes context over best practices
- References specific company experience
- Demonstrates contrarian thinking

**Style Consistency (30% weight):**

- References frameworks correctly
- Maintains insider knowledge tone
- Connects technical and business perspectives
- Uses industry-specific examples appropriately

The system flags responses that score below 50% authenticity with warnings, and I've built in penalties for style red flags like academic tone, excessive hedge words, or missing contrarian perspective.

## Real-World Testing: Can AI Pass the Jonathan Test?

I tested the system with questions I get asked regularly:

**Question:** "What's your take on startup equity compensation?"

**AI Response:** "The current equity system is fundamentally broken. Employees bear all the risk without proportional reward or liquidity options. Most equity packages are designed to look good on paper but deliver poor expected value. Instead of individual negotiation tactics, we need structural reform. The psychological appeal of equity often masks what's essentially exploitation—you're taking below-market pay for lottery tickets in someone else's company."

**Authenticity Score:** 78%

The system correctly identified my contrarian stance on equity, used my direct communication style, and referenced the framework without hedging. It avoided academic language and made bold claims backed by specific reasoning.

## The Meta Moment: AI Writing About AI

Here's where it gets interesting. I'm using this system to help write parts of this post about itself. The Jonathan Voice Engine is contributing to its own origin story.

When I ask it to explain the technical architecture, it doesn't just describe the system—it critiques it through my lens:

"The validation system works, but it's not perfect. A 50% authenticity threshold feels arbitrary, and the weighted scoring could probably be tuned better with more data. The framework extraction captures the big patterns but misses some of the nuance that comes from years of experience. It's good enough to be useful, which is exactly the kind of pragmatic trade-off I'd make."

That response scored 82% authenticity. It's critical without being self-defeating, acknowledges limitations honestly, and ends with a characteristically pragmatic perspective.

## What Works (And What Doesn't)

**What Works:**

- Captures distinctive voice characteristics accurately
- Maintains consistency across different topics and contexts
- Successfully challenges conventional wisdom when appropriate
- Integrates frameworks naturally into responses
- Scores well on authenticity validation (70-85% typical range)

**Current Limitations:**

- Still requires human oversight for complex, nuanced topics
- Can be overly contrarian when the situation calls for more diplomacy
- Frameworks are static—they don't evolve with new experience
- Authentication threshold might be too forgiving (needs more testing)
- Works best for topics I've written about extensively

## The Broader Implications

Building this system taught me something important about AI personalization: it's not about replacing human thinking—it's about scaling human perspective.

The Jonathan Voice Engine can't have new insights. It can only recombine and apply existing frameworks to new situations. But that's actually more valuable than I expected. Most of the questions I get asked follow predictable patterns. Having an AI that can provide consistently authentic responses to common questions frees me up for the conversations that actually require human insight.

This isn't about building an AI replacement for myself. It's about building an AI amplifier that extends my ability to have thoughtful conversations at scale without losing the authentic voice and perspective that makes those conversations valuable.

## Technical Implementation: How It Actually Works

The system runs on a straightforward architecture:

```bash
# Generate response in Jonathan's voice
bun scripts/jonathan-voice.ts respond "How should startups approach AI integration?"

# Test voice authenticity
bun scripts/jonathan-voice.ts test

# View voice profile statistics
bun scripts/jonathan-voice.ts stats
```

Under the hood, it:

1. **Analyzes the question** and determines response strategy (contrarian take, framework-based, direct answer, etc.)
2. **Builds a voice-specific prompt** with relevant frameworks, signature phrases, and perspective guidance
3. **Gets response from Claude** using detailed voice constraints and characteristics
4. **Validates authenticity** across multiple dimensions with weighted scoring
5. **Returns response** with confidence metrics and voice markers used

The voice profile lives in `scripts/lib/jonathan-voice-profile.ts` as a comprehensive data structure that captures everything from tone percentages to specific frameworks to signature phrases.

## What's Next: Evolving the Voice Engine

This is version 1.0. Here's what's coming:

**Short term:**

- Better framework application (currently static, should adapt based on context)
- Conversation memory (building context across multiple interactions)
- Domain-specific tuning (technical vs business vs personal topics)

**Medium term:**

- Dynamic framework extraction (learning new patterns from recent writing)
- Multi-modal voice (not just text—presentations, video scripts, etc.)
- Collaborative voice mixing (combining perspectives from multiple people)

**Long term:**

- Real-time voice evolution (the profile adapts as my thinking evolves)
- Cross-platform integration (Slack, email, social media responses)
- Open-source voice extraction (help others build their own voice engines)

## The Meta Conclusion

I started this project wanting to scale my ability to have authentic conversations. I ended up building something that taught me more about my own thinking patterns than I expected.

The Jonathan Voice Engine isn't perfect, but it's authentically imperfect in ways that feel consistent with how I actually think and write. It challenges conventional wisdom when it should, shows empathy without being soft, and prioritizes practical solutions over theoretical purity.

Most importantly, it passes the test that matters most: when I read its responses, they sound like something I would actually say.

_Parts of this post were written using the Jonathan Voice Engine. Can you tell which parts? The authenticity validation system gave this post an overall score of 76%—high enough to publish, with room for improvement._

---

**About the Jonathan Voice Engine implementation:**

The system demonstrates key patterns for voice replication:

- Comprehensive voice profile extraction from content corpus
- Multi-dimensional authenticity validation (tone, style, perspective)
- Framework-based response generation with contrarian positioning
- Context-aware prompt engineering with signature phrases
- Weighted scoring across authenticity markers

_Note: Technical details shared for educational transparency. The implementation is proprietary and not publicly accessible._

**Warning:** Results may include contrarian takes on startup equity, criticism of generic startup advice, and strong opinions about the difference between shipping and perfectionism. Use responsibly.
