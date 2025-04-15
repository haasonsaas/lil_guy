---
author: Jonathan Haas
pubDate: 2025-04-14
title: "Building Shout: My Journey Creating an Evaluation Framework for Engineering Recognition"
description: 
  A personal reflection on building Shout, a side project born from wanting to better recognize engineering contributions, and the evaluation system that powers it
featured: false
draft: false
tags:
  - side-project
  - engineering-recognition
  - team-culture
  - personal-growth
  - product-management
  - developer-experience
image:
  url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  alt: "A diverse team collaborating at a table, representing recognition and teamwork in the workplace"
---

# Building Shout: My Journey Creating an Evaluation Framework for Engineering Recognition

As a product manager, I've always felt that something was missing in how we recognize the incredible work engineers do. Great code often goes unnoticed. Critical infrastructure improvements rarely get the spotlight. Late nights squashing bugs are silently appreciated but seldom celebrated. This disconnect inspired me to create Shout—a completely personal side project designed to help improve recognition of engineering contributions.

## Why I Built Shout

I built Shout after noticing a pattern across teams I've worked with: recognition for engineering work was often an afterthought, inconsistent, and sometimes missed the mark. As someone who deeply values the craft of engineering but doesn't always speak the language fluently, I wanted to create a tool that would help bridge this gap.

To be absolutely clear: Shout is entirely separate from my day job at Vanta. This is a personal project I've built on my own time with my own resources. It hasn't touched anything Vanta-related and exists completely outside my professional responsibilities.

## The Evaluation Framework Behind Shout

The core innovation in Shout is its evaluation system. I realized that for recognition to be meaningful, it needed to meet certain quality standards. Drawing inspiration from what I learned about AI evaluation frameworks from Vanta's AI team (more on that later), I designed a system to assess recognition across three dimensions:

### 1. Specificity Assessment

The first evaluator I built checks whether recognition includes concrete details:

```typescript
async evaluateSpecificity(
  config: ShoutConfig,
  context: EvalContext,
  criteria: EvalCriteria = {
    name: 'specificity',
    description: 'Check if my recognition includes specific technical details',
    minScore: 0.8
  }
)
```

This was born from my own struggle to articulate technical accomplishments accurately. I wanted something that would challenge me to be more precise in my acknowledgments.

### 2. Accuracy Verification

The second evaluator ensures I'm getting the technical details right:

```typescript
async evaluateAccuracy(
  config: ShoutConfig,
  context: EvalContext,
  criteria: EvalCriteria = {
    name: 'accuracy',
    description: 'Verify I\'m correctly describing the engineering work',
    minScore: 0.9
  }
)
```

Nothing undermines recognition faster than getting the details wrong. This component helps me double-check that I understand what I'm recognizing.

### 3. Impact Connection

The final evaluator helps connect individual contributions to broader outcomes:

```typescript
async evaluateImpact(
  config: ShoutConfig,
  context: EvalContext,
  criteria: EvalCriteria = {
    name: 'impact',
    description: 'Connect the technical work to user or business outcomes',
    minScore: 0.75
  }
)
```

This was perhaps the most important piece for me—helping engineers see how their technical excellence directly contributes to user happiness or business success.

## My Technical Implementation Journey

Building Shout was a nights-and-weekends labor of love that evolved organically as I developed it:

```typescript
if (config.provideFeedback) {
  const context: EvalContext = {
    engineer: selectedTeamMember,
    workContext: commitActivity,
    draftRecognition: myCurrentDraft
  };

  const results = await Promise.all([
    evals.evaluateSpecificity(config, context),
    evals.evaluateAccuracy(config, context),
    evals.evaluateImpact(config, context)
  ]);
  
  // Give myself suggestions to improve my recognition
}
```

I created a simple database to track my improvement over time:

```sql
CREATE TABLE IF NOT EXISTS my_recognition_attempts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  eval_type text NOT NULL,
  engineer_id uuid NOT NULL,
  recognition_text text NOT NULL,
  score float NOT NULL,
  improved_after_feedback boolean NOT NULL,
  work_context jsonb,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

I also built a small dashboard to visualize my progress:

```typescript
function RecognitionImprovement() {
  const [progress, setProgress] = useState<ImprovementMetrics | null>(null);
  // Implementation shows my improvement in recognition quality over time
}
```

## Real-World Usage (Sort Of)

I've been using Shout in my personal Slack channel to practice recognition—which has been useful but admittedly gets a bit weird when you're shouting out yourself. "Congratulations, me, on that elegant database schema... thanks, also me!" It's been a humbling and occasionally hilarious experience that's helped me refine the tool while developing a greater appreciation for the nuances of recognition.

Despite the occasional awkwardness of self-recognition, it's been valuable to have a space where I can practice and refine how I articulate technical accomplishments.

## What I've Learned Building Shout

This side project has taught me more than I anticipated:

1. **Engineering Empathy**: Building Shout deepened my appreciation for the nuances of engineering work. I'm now better at spotting contributions that would have previously gone unnoticed.

2. **The Power of Specific Recognition**: Generic praise like "great job on the API" pales in comparison to "your elegant caching solution reduced database load by 40% while maintaining sub-100ms response times."

3. **Technical Growth**: Building this project solo pushed me to improve my own technical skills. Every bug I fixed and feature I implemented gave me more empathy for what engineers experience daily.

4. **Recognition is a Skill**: Like any skill, giving good recognition improves with practice and feedback. The evaluation system became my coach, helping me level up consistently.

## Where Shout is Heading

As a personal project, Shout continues to evolve based on what I learn:

1. **Pattern Recognition**: I'm exploring ways to automatically identify recognition-worthy activities in commit logs and pull requests.

2. **Personalization**: I'm experimenting with features to track which types of recognition resonate most with different engineers.

3. **Knowledge Sharing**: Building tools to help PMs learn technical concepts related to their team's work, improving their ability to recognize contributions meaningfully.

## Special Thanks

I was inspired to create Shout after learning about evaluation frameworks from Vanta's AI team. Their explanations of how they evaluate AI outputs gave me the foundational knowledge to build something similar for evaluating human recognition quality. While Shout is completely separate from Vanta, I'm grateful for the knowledge sharing that sparked this side project.

On that note, if you're looking to work on some really incredible stuff, you should definitely check out our AI team at Vanta. They're doing fascinating work with evaluation frameworks and much more.

## For Fellow PMs: Lessons You Can Apply

Even without using Shout, there are lessons here for any product manager:

1. **Be Specific**: Take the time to understand what made a particular piece of engineering work challenging or elegant.

2. **Connect the Dots**: Help engineers see how their technical excellence translates to user value.

3. **Recognize Process**: Sometimes the most important contribution is refactoring that makes future work possible, even if it has no immediate user impact.

4. **Learn Continuously**: Invest time in understanding the technical domains your team works in.

## Conclusion

Building Shout wasn't about creating a product to sell—it was about making myself a better product manager and teammate. Through this side project, I've developed a deeper appreciation for engineering work and improved my ability to recognize contributions meaningfully.

If there's one thing I hope others take from my experience, it's this: recognition isn't just about making engineers feel good (though that's important); it's about building a culture where technical excellence is understood and valued. When engineers know their work is truly seen—not just the output but the craft behind it—that's when magic happens.

I'd love to hear from other PMs about their experiences recognizing engineering work or from engineers about recognition that has resonated with them. Shout may be my personal project, but improving how we recognize each other's contributions is a goal we can all share.
