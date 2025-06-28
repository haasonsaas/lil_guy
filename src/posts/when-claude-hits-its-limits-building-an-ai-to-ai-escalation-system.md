---
author: Jonathan Haas
pubDate: '2025-06-25'
title: 'When Claude Hits Its Limits: Building an AI-to-AI Escalation System'
description: 'How I built an MCP server that pairs Claude with Gemini for complex code analysis, creating a multi-model debugging workflow'
featured: false
draft: false
tags:
  - ai
  - mcp
  - claude
  - gemini
  - debugging
---

I hit a wall debugging a distributed system race condition. Claude Code had analyzed 30 files, but the bug spanned microservices with gigabytes of traces. I needed something different.

That's when I realized: LLMs are like specialized microservices. Claude excels at surgical code edits. Gemini 2.5 Pro can swallow 1M tokens and execute code. Why not use both?

I built [deep-code-reasoning-mcp](https://github.com/haasonsaas/deep-code-reasoning-mcp)—an MCP server that enables Claude to escalate complex analysis to Gemini. Here's how multi-model debugging actually works.

## The Problem: One Model Can't Do Everything

Let me paint you a picture. You're hunting a Heisenbug that:

- Only appears under load
- Spans 5 microservices
- Involves 2GB of distributed traces
- Has a 12-hour reproduction cycle

Claude Code is brilliant at navigating codebases and making precise edits. But when you need to correlate thousands of trace spans across services? That's where even the best models hit their limits.

Meanwhile, Gemini 2.5 Pro sits there with its 1M token context window and code execution capabilities, perfect for massive analysis tasks.

The insight: **treat LLMs like heterogeneous compute resources**. Route tasks to the model best equipped to handle them.

## Building the Escalation Bridge

The Model Context Protocol (MCP) made this possible. Here's the architecture:

````text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Claude Code    │────▶│  MCP Server      │────▶│  Gemini API    │
│  (Fast, Local, │     │  (Router &       │     │  (1M Context,   │
│   CLI-Native)  │◀────│   Orchestrator)  │◀────│   Code Exec)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```text

When Claude recognizes it needs help, it calls the escalation tool:

```typescript
await escalate*analysis({
  claude*context: {
    attempted*approaches: ['Checked mutex usage', 'Analyzed goroutines'],
    partial*findings: [{ type: 'race', location: 'user*service.go:142' }],
    stuck*description: "Can't trace execution across service boundaries",
    code*scope: {
      files: ['user*service.go', 'order*service.go'],
      service*names: ['user-api', 'order-processor'],
    },
  },
  analysis*type: 'cross*system',
  depth*level: 5,
})
```text

## The Power of AI-to-AI Conversations

Here's where it gets interesting. Instead of one-shot analysis, I implemented conversational tools that let Claude and Gemini engage in multi-turn dialogues:

```javascript
// Start a conversation
const session = await start*conversation({
  claude*context: {
    /* ... */
  },
  analysis*type: 'execution*trace',
  initial*question: 'Where does the race window open?',
})

// Claude asks follow-ups
await continue*conversation({
  session*id: session.id,
  message:
    'The mutex is released at line 142. What happens between release and the next acquire?',
})

// Get structured results
const analysis = await finalize*conversation({
  session*id: session.id,
  summary*format: 'actionable',
})
```text

This isn't just passing data between models. It's genuine collaborative reasoning where each model's strengths complement the other.

## Real-World Debugging Scenarios

### Scenario 1: The 10-Service Trace Analysis

**The Bug**: Payment failures under high load, no obvious pattern.

**Claude's Attempt**: Identified suspicious retry logic, couldn't correlate with downstream effects.

**Escalation to Gemini**:

- Ingested 500MB of OpenTelemetry traces
- Correlated payment events across all services
- Found race condition in distributed lock implementation
- **Root cause**: Lock expiry happening 50ms before renewal due to clock skew

**Result**: Bug fixed in 2 hours instead of 2 days.

### Scenario 2: Memory Leak Across Boundaries

**The Bug**: Gradual memory growth in production, restarts every 6 hours.

**Claude's Attempt**: Found no obvious leaks in individual services.

**Escalation to Gemini**:

- Analyzed heap dumps from 5 services
- Traced object references across service boundaries
- Discovered circular dependency through message queues
- **Root cause**: Unacknowledged messages creating phantom references

**Impact**: Eliminated daily outages, saved $50k/month in over-provisioned instances.

### Scenario 3: Performance Regression Hunt

**The Bug**: API latency increased 40% after last week's deploy.

**Claude's Attempt**: Profiled hot paths, found nothing significant.

**Escalation to Gemini**:

- Correlated deployment timeline with metrics
- Analyzed 200 commits across 10 repositories
- Traced data flow through the entire system
- **Root cause**: New validation logic triggering N+1 queries in unrelated service

**Outcome**: Pinpointed exact commit out of 200 candidates.

## Implementation Deep Dive

### The Escalation Decision

Not every problem needs Gemini. The MCP server uses heuristics to determine when escalation makes sense:

```typescript
function shouldEscalate(context: AnalysisContext): boolean {
  return (
    context.files.length > 50 ||
    context.traceSize > 100*000*000 || // 100MB
    context.services.length > 3 ||
    context.timeSpan > 3600 || // 1 hour
    context.attemptedApproaches.length > 5
  )
}
```text

### Context Preparation

Gemini's strength is its massive context window. The server intelligently packages relevant information:

```typescript
const geminiContext = {
  code: await loadRelevantFiles(claudeContext.code*scope),
  traces: await extractRelevantTraces(timeWindow),
  logs: await aggregateLogs(services),
  metadata: {
    service*dependencies: await mapServiceGraph(),
    deployment*timeline: await getRecentDeploys(),
  },
}
```text

### Intelligent Routing

Different analysis types route to different Gemini capabilities:

- **execution*trace**: Uses code execution to simulate program flow
- **cross*system**: Leverages massive context for correlation
- **performance**: Models algorithmic complexity
- **hypothesis*test**: Runs synthetic test scenarios

## Setting It Up

Installation is straightforward:

```bash
# Clone and install
git clone https://github.com/haasonsaas/deep-code-reasoning-mcp
npm install

# Configure Gemini API key
cp .env.example .env
# Add your key from https://makersuite.google.com/app/apikey

# Add to Claude Desktop config
{
  "mcpServers": {
    "deep-code-reasoning": {
      "command": "node",
      "args": ["/path/to/deep-code-reasoning-mcp/dist/index.js"],
      "env": {
        "GEMINI*API*KEY": "your-key"
      }
    }
  }
}
```text

## Lessons from Building Multi-Model Systems

### 1. Models Are Tools, Not Solutions

Just like you wouldn't use a hammer for everything, don't expect one LLM to handle all tasks. Claude's strength is precision. Gemini's is scale. Use accordingly.

### 2. Context Is Everything

The hardest part isn't the API calls—it's preparing the right context. Too little and the analysis fails. Too much and you waste tokens. I spent 80% of development time on intelligent context selection.

### 3. Conversations > Commands

Single-shot analysis often misses nuances. The conversational approach lets models build on each other's insights, leading to discoveries neither would make alone.

### 4. Measure Everything

Every escalation logs:

- Why it was triggered
- What was found
- Time saved vs manual debugging
- Token costs

This data drives continuous improvement of the routing logic.

## The Future of Heterogeneous AI

Here's my prediction: in 2 years, we'll orchestrate dozens of specialized models like we orchestrate microservices today. Each model will have its strengths:

- **Code understanding**: Claude, Cursor
- **Massive analysis**: Gemini, GPT-4
- **Execution**: Gemini, Code Interpreter
- **Domain-specific**: BloombergGPT, Med-PaLM

The winners will be those who build the orchestration layer.

## Start Building Your Own

The [deep-code-reasoning-mcp](https://github.com/haasonsaas/deep-code-reasoning-mcp) server is open source. Fork it, extend it, build your own multi-model workflows.

Because the future of AI isn't one model to rule them all. It's the right model for the right job, working together.

---

*Have you built multi-model systems? I'd love to hear about your approach to AI orchestration._
````
