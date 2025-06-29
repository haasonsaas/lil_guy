---
author: Jonathan Haas
pubDate: '2025-06-24'
title: 'Turning Thoughts Into Graphs: Why I Built the Deliberate Reasoning Engine'
description: 'FIXME: Add a full description for this post.'
featured: false
draft: false
tags:
  - open-source
  - ai
  - reasoning
  - graph-structure
  - mcp
  - developer-tools
---

One of the things that's always bugged me about LLMs is how opaque their thinking is.

They produce answers. Sometimes correct, sometimes not. But how did they get there? What assumptions did they make? What were they unsure about? Did they even remember the question?

This is the gap the **Deliberate Reasoning Engine (DRE)** is built to fill.

Let's dig into what it is, why I built it, and how it fits into the emerging world of structured model reasoning.

---

## The Problem With Linear LLM Output

LLMs, as we use them today, reason in a straight line. One token after another. You might ask them to write a product spec, or debug some code, or weigh a strategic decision. And they will try—but all their reasoning happens inline.

You get a wall of text. If something feels off, you scroll up. You reread. You guess where it went wrong.

This is fine for casual use.

But it breaks down in more demanding settings:

- Research planning
- Root cause analysis
- Strategy work
- Legal reasoning
- Complex coding tasks

These are domains where the _structure_ of thinking matters. Where assumptions, hypotheses, dependencies, and counterpoints need to be visible, not buried.

DRE solves this by externalizing model reasoning as a **directed acyclic graph of thoughts**.

---

## From Tokens to Thought Graphs

Each node in a DRE graph is a "thought." But not just any blob of text. Thoughts are typed:

- **Objective**: What are we trying to figure out?
- **Hypothesis**: What might be true?
- **Assumption**: What are we temporarily believing?
- **Evidence**: What supports or contradicts our claims?
- **Action**: What should we do next?
- **Synthesis**: What do we conclude?
- **Critique**: What might be wrong with our logic?

Each thought can depend on others. And if those upstream thoughts change—say, an assumption is invalidated—then downstream thoughts automatically go stale.

That's the real unlock: **models can reason with accountability.**

---

## Plugging Into the Claude Desktop Ecosystem

DRE is designed to work seamlessly with the Claude Desktop environment. Claude speaks the **Model Context Protocol (MCP)**, and DRE implements that spec as a server.

Once configured, you can:

- Log structured thoughts using `log*thought`
- Get the current reasoning graph via `get*thought*graph`
- Invalidate assumptions with cascading impact via `invalidate*assumption`

This lets Claude operate more like a deliberate thinker than a chatty assistant.

And if you're building your own LLM agent? DRE works as a standalone reasoning substrate for any model with basic tool use.

---

## Why DAGs Work Better Than Chains

Linear chains (think LangChain, AutoGPT, or scratchpad-style prompts) work fine for some use cases. But they fail when reasoning gets messy.

By contrast, DRE gives you:

- **Traceability**: Every conclusion has a provenance.
- **Forkability**: Try alternative paths without losing history.
- **Invalidation**: Kill flawed assumptions and see what breaks.
- **Summarization**: Export just the current valid frontier.

It's not just more accurate. It's more _honest_. The model shows its work.

---

## Design Philosophy: Auditability as a Feature

From the beginning, I wanted DRE to prioritize clarity over cleverness.

- All state is visible and inspectable.
- Thought types are enforced via schema.
- Graph structure is validated for cycles and orphaned nodes.
- Each tool is purposefully scoped (log, retrieve, invalidate).

There are no hidden agents. No spooky action at a distance. Just structured thoughts, wired together.

This makes DRE a good fit for:

- **Security and compliance contexts**
- **Decision logs** for regulatory reviews
- **AI-assisted planning** where trust and traceability matter

---

## What's New in v1.3

DRE started as a prototype. But with version 1.3, it's production-ready:

- Full TypeScript refactor
- Enterprise-grade CLI installation via `npm`
- Better validation and status tracking
- Clear integration docs for Claude and other MCP agents

It's open source, permissively licensed (MIT), and actively maintained.

---

## Real-World Use Case: Should We Acquire Company X?

Here's a simplified flow:

1. Log the **Objective**: "Should we acquire Company X?"
1. Log a **Hypothesis**: "This will increase market share by 20%"
1. Log an **Assumption**: "Their tech is compatible"
1. Break that into a **Sub-problem**: "Verify compatibility"
1. If due diligence fails, **Invalidate** the assumption

DRE cascades that invalidation downstream. The subproblem and hypothesis go stale. The model sees the break and can re-plan from there.

---

## Where We're Headed

The roadmap is ambitious:

- **Hypothesis scoring** via supporting/contradicting evidence
- **Graph visualization** export for thought maps
- **Multi-agent support** for collaborative reasoning
- **Session save/load** for persistent state
- **Conflict detection** across branches

But even today, DRE is useful for:

- Strategic planning
- Product development debates
- Systematic debugging
- Structured writing
- Model interpretability

Anywhere you need clear, structured, inspectable reasoning.

---

## Get Started

Install globally:

````bash
npm install -g deliberate-reasoning-engine
```text

Or use it inside Claude Desktop via MCP config. Full details in the [README](https://github.com/haasonsaas/deliberate-reasoning-engine).

---

## Final Thought

Most LLM tools chase cleverness: new agents, new chains, new wrappers.

DRE is about slowing down. Making thoughts explicit. Auditing how we get from question to conclusion.

It's not flashy. But it's solid. And in a world of opaque black boxes, that's the kind of software I want to use—and build.

Come try it. Break it. Fork it.

[https://github.com/haasonsaas/deliberate-reasoning-engine](https://github.com/haasonsaas/deliberate-reasoning-engine)
````
