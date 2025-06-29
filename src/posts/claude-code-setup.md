---
author: Jonathan Haas
pubDate: '2025-06-17'
title: 'Claude Code: Setup, Strategy, and Sanity Checks'
description: 'FIXME: Add a full description for this post.'
featured: false
draft: false
tags:
  - ai-tools
  - developer-productivity
  - prompt-engineering
  - claude
  - software-strategy
---

Claude Code, when configured correctly, can function as a surprisingly competent co-developer. But if you're relying on default settings, winging your inputs, or blindly accepting output—you’re leaving value on the table (and probably introducing bugs).

This guide is for engineers who want Claude to actually help—not hallucinate.

## TL;DR

Use Opus. Start with planning mode. Load context liberally. Auto-accept edits, but review them like a code reviewer with something to prove. If you’ve tried 3-4 times and it’s still off? Bail. And never, ever ask it to design a UI.

---

## Configuration & Setup

### Model Selection

Start here: **/model → Opus.**  
Yes, it's pricier. Yes, it's better. No, Sonnet won’t cut it for real engineering tasks.

Pair that with the **Cursor or VSCode extension**. CMD+Esc becomes your Claude trigger, and it picks up selected files or diffs contextually.

---

## Execution Strategy

### Planning First, Always

Claude’s strongest feature isn’t writing code—it’s planning. Use **Shift+Tab twice** to enter plan mode and tell it what you're trying to do.

Remind it:

> “Keep it as simple as possible.”

This phrase counteracts its default tendency to generate enterprise-grade overkill for a simple script.

Also helpful:

> “Think ultrahard.”

This phrase appears to push the model into deeper token consumption and broader reasoning. Use it for architecture-level problems or anything where sequencing matters.

---

## Feeding the Context Engine

### Claude Loves Context

- **Paste links and images directly** (Yes, Ctrl+V works for images. Mac users: _use Ctrl, not Cmd_).
- Use `@filename.js` to anchor Claude’s responses to a specific file.
- If you’re dealing with git conflicts, merge chains, or bisecting? Leverage GitHub CLI + Claude's terminal memory. It's shockingly helpful when it knows the state of your repo.

One framing that helps:

> “Imagine this is a Jira ticket for a junior engineer.”

You’re essentially pair programming—with someone that never sleeps but sometimes lies.

---

## From Plan to Code

### Execute with Confidence, Interrupt with Caution

Once the plan is clear, Shift+Tab to auto-apply suggestions.

Things to keep in mind:

- **Esc interrupts Claude mid-stream**—useful when it’s veering into irrelevant territory.
- Don’t worry about “flow state” while Claude’s working. Watch and course-correct, but don’t treat it like a human pair—more like a GPT-powered macro that happens to talk back.

---

## Quality Control

### Review Like You’re a PR Reviewer from Hell

Here’s the brutal truth: Claude cuts corners.

It:

- Overuses type coercion
- Leans on `any` in TypeScript
- Uses `ref` in React when it doesn’t need to
- Writes logic that looks good until you run tests

So test it.

- Ask Claude to **write the manual test plan**.
- Spin up a **second Claude instance** to code review its own output. It’s weirdly effective. Self-review? Meh. Clone-review? Surprisingly solid.
- Repeat this phrase 2–3 times:

> “Can you double check this is as simple as it can be?”

And most importantly: **read it yourself**. There’s no substitute.

---

## Learning Loop

### Save Your Corrections

Every time you correct Claude, prefix with `#` and save to a `CLAUDE.md`. It becomes your model memory.

Then: **check that file into source control.**  
Not just for you—but so your team aligns on “how we talk to Claude” conventions.

---

## When It Goes Sideways

### Rabbit Holes and Recovery

Claude gets stuck. You’ll notice the pattern:

- Three bad takes in a row
- Increasingly baroque attempts to solve a simple problem
- Flailing syntax, changing assumptions, context drift

**Eject after 3-4 failures.**  
Do not reward mediocrity with more prompts.

Instead:

- Refresh the context
- Reframe the task
- Start from scratch with a clearer goal

Remember: **Claude code is disposable**. Don’t fall in love with its output.

---

## When NOT to Use Claude

Claude is great, but not for everything.

### Skip It For:

- **UI Design Work**: Claude code has a "distinctive LLM look"—boxy layouts, over-reliance on inline styles, poor responsiveness. You’ll spend more time fixing than building.
- **Core Architecture**: If you’re designing something foundational, do it with a human. Claude tends to oversimplify or overcomplicate—rarely the Goldilocks zone.
- **Tiny tweaks**: For small changes, sometimes it's just faster to code it yourself.

---

## Final Thoughts

Claude isn’t a silver bullet. But it is a serious tool—when used with intention.

Plan first. Simplify ruthlessly. Exit bad loops. And remember: it’s not magic. It’s just a very good autocomplete with better manners.

Want help designing your own `CLAUDE.md` memory convention or prompt structure? Let’s talk.
