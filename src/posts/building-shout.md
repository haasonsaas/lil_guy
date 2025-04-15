---
author: Jonathan Haas
pubDate: 2025-04-14
title: "Engineering Recognition Through Evals: My Technical Journey Building Shout"
description: 
  A deep dive into the technical implementation of evaluation frameworks in my side project Shout, and the lessons learned along the way
featured: false
draft: false
tags:
  - evaluation-frameworks
  - typescript
  - side-project
  - openai
  - technical-implementation
  - software-architecture
image:
  url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  alt: "A diverse team collaborating at a table, representing recognition and teamwork in the workplace"
---

# Engineering Recognition Through Evals: My Technical Journey Building Shout

When I set out to build Shout, my side project for improving engineering recognition, I knew I needed a robust way to evaluate the quality of recognition messages. Inspired by what I'd learned about evaluation frameworks from Vanta's AI team, I decided to implement my own evaluation system—a journey that proved both technically challenging and intellectually rewarding.

## The Technical Implementation of Evaluation Frameworks

At the core of Shout lies a TypeScript-based evaluation system that leverages LLMs to assess recognition quality. Let me share the technical details of how I implemented this system, completely separate from my day job at Vanta.

### The Core Architecture

I started by defining clear interfaces for my evaluation system:

```typescript
export interface EvalResult {
  score: number;
  explanation: string;
  passed: boolean;
}

export interface EvalCriteria {
  name: string;
  description: string;
  minScore: number;
}

export interface EvalContext {
  input: string;
  output: string;
  metadata?: Record<string, any>;
}
```

These interfaces provided the foundation for a flexible evaluation framework. The `EvalContext` holds the input (the engineering work being recognized) and output (the recognition message), while `EvalCriteria` defines the standards for quality recognition.

### Adapting AI Evaluation Patterns to Human Recognition

The most interesting technical challenge was adapting evaluation patterns typically used for AI outputs to assess human-written recognition messages. I implemented three core evaluators:

#### 1. The Specificity Evaluator (Adapted from Hallucination Detection)

Starting with the hallucination detection evaluator from my AI research:

```typescript
async evaluateHallucination(
  config: OpenAIConfig,
  context: EvalContext,
  criteria: EvalCriteria = {
    name: 'hallucination',
    description: 'Check if the output contains made-up information not present in the input',
    minScore: 0.8
  }
): Promise<EvalResult> {
```

I adapted this to evaluate recognition specificity by modifying the prompt to focus on whether recognition messages contained specific, verifiable details about engineering contributions:

```typescript
const prompt = `
You are an expert evaluator of recognition messages. Your task is to evaluate whether 
the recognition contains specific, verifiable details about the engineering contribution.

Engineering work context:
${context.input}

Recognition message to evaluate:
${context.output}

Please evaluate based on the following criteria:
1. Does the recognition include specific technical details from the work?
2. Are the accomplishments described with concrete metrics or outcomes?
3. Does the recognition avoid generic praise in favor of specific accomplishments?

Provide a score from 0 to 1, where:
- 1 means highly specific recognition with concrete details
- 0 means generic, non-specific recognition

Also provide a brief explanation of your evaluation.
`;
```

#### 2. Implementation Challenges

One of the trickiest implementation challenges was parsing the evaluation responses:

```typescript
try {
  const [scoreStr, explanation] = response.split('\n\n');
  const score = parseFloat(scoreStr);
  
  if (isNaN(score) || score < 0 || score > 1) {
    throw new EvalError('Invalid score format in evaluation response');
  }

  return {
    score,
    explanation: explanation.trim(),
    passed: score >= criteria.minScore
  };
} catch (error) {
  throw new EvalError('Failed to parse evaluation response');
}
```

I learned that even with structured prompts, LLM outputs can be unpredictable. I had to implement robust error handling and response parsing to ensure reliable scoring.

## Technical Lessons From Building With Evals

### 1. Prompt Engineering Is Crucial for Evaluation Quality

My first implementations produced inconsistent results because my prompts weren't specific enough. I learned to be extremely precise about evaluation criteria and scoring rubrics:

```typescript
const prompt = `
You are an expert evaluator of recognition messages. Your task is to evaluate whether 
the output correctly connects technical work to broader impact.

Engineering work:
${context.input}

Recognition message:
${context.output}

Please evaluate based on the following criteria:
1. Does the recognition explicitly connect technical details to user or business outcomes?
2. Is the impact of the work quantified where possible?
3. Does the recognition help others understand why this work matters?

Provide a score from 0 to 1, where:
- 1 means the recognition clearly connects work to meaningful impact
- 0 means no connection between technical details and broader impact

Also provide a brief explanation of your evaluation.
`;
```

The more specific my evaluation criteria, the more consistent the results became.

### 2. Multi-dimensional Evaluation Yields Better Insights

Initially, I tried to evaluate recognition quality with a single metric. That proved inadequate. Breaking evaluation into multiple dimensions (specificity, accuracy, impact) revealed nuances I would have missed:

```typescript
const results = await Promise.all([
  evals.evaluateSpecificity(config, context),
  evals.evaluateAccuracy(config, context),
  evals.evaluateImpact(config, context)
]);

// Analyzing specific dimensions of recognition quality
const weakestDimension = results.reduce(
  (prev, current) => (current.score < prev.score ? current : prev)
);
```

This approach helped me understand that I might write recognition that was specific and accurate but failed to connect to broader impact—a critical insight for improvement.

### 3. Thresholds Matter More Than Absolute Scores

One technical lesson that surprised me was how the choice of threshold values significantly affected the utility of the evaluation system:

```typescript
return {
  score,
  explanation: explanation.trim(),
  passed: score >= criteria.minScore
};
```

Setting `minScore` too high resulted in constant negative feedback; too low and the system missed obvious issues. I settled on different thresholds for each evaluation dimension based on extensive testing:

- Specificity: 0.7 (relatively easier to achieve)
- Accuracy: 0.85 (critical to get right)
- Impact Connection: 0.6 (more subjective and challenging)

### 4. Evaluation Consistency Over Time

A fascinating technical challenge emerged when tracking evaluation consistency over time. I implemented a simple database schema to track this:

```sql
CREATE TABLE IF NOT EXISTS recognition_evaluations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  eval_type text NOT NULL,
  context_hash text NOT NULL,
  recognition_text text NOT NULL,
  score float NOT NULL,
  passed boolean NOT NULL,
  explanation text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

This allowed me to analyze how similar recognition messages were evaluated over time, revealing occasional inconsistencies in the underlying LLM evaluations.

## Personal Insights from Technical Implementation

Building Shout's evaluation system gave me several technical insights:

1. **LLMs as Evaluators**: LLMs can provide remarkably consistent evaluations when properly prompted, but they aren't deterministic. Designing for this variability was a key challenge.

2. **Feedback Loops**: The most valuable part of the system wasn't the scores themselves but the explanations that accompanied them:

```typescript
return {
  score,
  explanation: explanation.trim(),  // This became the most valuable output
  passed: score >= criteria.minScore
};
```

These explanations helped me understand specific ways to improve recognition quality.

3. **Context Matters**: Recognition evaluation is highly context-dependent. The same message might be excellent for one engineering contribution but inadequate for another. Building this contextual awareness into the system was particularly challenging.

4. **Scale and Performance**: While I initially used OpenAI's GPT-4 for evaluations, I found that for certain evaluation types, smaller models were both faster and sufficient:

```typescript
// Configuration to use different models for different evaluation types
const evalConfig = {
  ...baseConfig,
  model: criteria.name === 'toxicity' ? 'gpt-3.5-turbo' : 'gpt-4'
};
```

## Where the Technical Journey Continues

As I continue developing Shout as a personal project, I'm exploring several technical enhancements:

1. **Few-shot Learning**: Incorporating examples of excellent recognition to improve evaluation quality:

```typescript
const fewShotExamples = [
  {
    context: "Refactored the user authentication system to reduce database queries.",
    goodRecognition: "Your authentication refactoring cut our DB load by 40% while maintaining sub-100ms response times. This directly improved our reliability during peak traffic hours.",
    evaluation: "Score: 0.95. Excellent specificity with concrete metrics and clear impact connection."
  },
  // More examples...
];
```

2. **Custom Embeddings**: Building embeddings for engineering contexts to better match recognition messages with technical work.

3. **Techniques for Reducing Evaluation Latency**: Exploring batched evaluations and caching strategies to make the feedback loop faster.

## Conclusion: Technical Takeaways for Evaluation Systems

Building Shout has been a fascinating technical journey into evaluation frameworks. The most important technical lessons I've learned are:

1. **Clear Interface Definitions**: Starting with well-defined interfaces made the system flexible and extensible
2. **Multi-dimensional Evaluation**: Breaking complex assessments into specific dimensions yields more actionable insights
3. **Robust Error Handling**: LLM outputs require careful parsing and error handling
4. **Prompt Engineering**: The quality of evaluation is directly tied to the quality of the prompts

While Shout remains my personal side project entirely separate from my work at Vanta, the technical knowledge I've gained about building evaluation systems has been invaluable. I'm grateful to Vanta's AI team for introducing me to evaluation frameworks, which sparked this technical exploration.

If you're interested in working on advanced evaluation systems professionally, I'd recommend checking out Vanta's AI team—they're doing some truly impressive work in this space.

For fellow developers interested in building your own evaluation systems, I hope sharing these technical details provides a useful starting point. While recognition may seem like a soft skill, creating systems to help improve it poses fascinating technical challenges worth exploring.
