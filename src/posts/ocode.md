---
author: Jonathan Haas
pubDate: '2025-05-26'
title: 'OCode: Why I Built My Own Claude Code (and Why You Might Too)'
description: >-
  OCode: Why I Built My Own Claude Code (and Why You Might Too): A few nights
  ago, I opened my Anthropic invoice.
featured: false
draft: false
tags:
  - engineering
  - product
  - strategy
  - transparency
  - open-source
  - developer-tools
  - ai
---

A few nights ago, I opened my Anthropic invoice. $602.14.

For _coding assistance_.

And not even during work hours—I’m talking about an AI that times out at 2 a.m. with “something went wrong” while I’m mid-refactor.

So yeah, I snapped.

## When SaaS Becomes a Tax

I’m a big believer in paying for good tools. But something’s broken when a month of occasional code suggestions costs more than your GitHub Copilot _and_ electricity bill combined.

Especially when all you’re doing is asking it to “run tests” and “rename this function.”

So instead of paying another dime for glorified autocomplete, I did what any developer with too much coffee and not enough patience would do:

I built my own.

## Introducing OCode

OCode is my DIY Claude-for-code. Built on [Ollama](https://ollama.ai), runs locally, and understands your project like a senior engineer on espresso.

Same multi-file reasoning. No timeouts. Zero per-token billing.

And you can install it with one line:

````bash
curl -fsSL [https://raw.githubusercontent.com/haasonsaas/ocode/main/scripts/install.sh](https://raw.githubusercontent.com/haasonsaas/ocode/main/scripts/install.sh) | bash
```text

Because “run tests & commit” shouldn’t cost $600.

Let’s break down what OCode actually is, why I built it, and what it can do that shocked me.

---

## The Core Idea: Claude, but Local and Customizable

Most AI code tools are two things:

1. **Remote-first** (expensive, latency-prone, privacy-invasive)
1. **Opinionated black boxes** (you can’t tweak or inspect behavior)

OCode flips both.

It’s:

* **Terminal-native**
* **Runs entirely on your machine**
* **Speaks to Ollama models like Llama 3 or CodeLlama**
* **Fully inspectable and extendable**

Think of it as an open-source dev agent that actually understands your repo—and doesn’t leave you guessing why it renamed your files “final*final*rewrite*v2.py”.

---

## Building It (a.k.a. The 10-Hour Hackathon With My Cats)

### Step 1: Pull Ollama + Llama 3

```bash
ollama pull llama3
```text

Turns out, these models can already handle multi-file prompts surprisingly well. The key is the scaffolding around them—something most “AI tools” either overcomplicate or completely ignore.

### Step 2: Create a Thin Shell Interface

I wired up a CLI wrapper using Python and Typer. The hard part wasn’t the CLI. It was deciding how to:

* Walk the repo
* Summarize context
* Preserve session state
* Route tasks to appropriate tools

### Step 3: Tool Layer = 🧠

OCode’s architecture is simple but powerful. Every command goes through a query router that determines which “tools” to activate. Think:

* `grep*todos`
* `test*runner`
* `git*commit*summarizer`
* `refactor*engine`

The logic? Declarative YAML + some Python glue.

### Step 4: Make It Fast

Even locally, you want it snappy. So I added context strategies: minimal, targeted, full. Plus caching for file fingerprints. Net result?

< 2s cold start. Near-instant interaction after warmup.

---

## What OCode Can Actually Do

Here are just a few things I’ve asked it to do in the last 48 hours:

* “Refactor the auth system across services”
* “Find all TODOs and resolve them”
* “Add docstrings to all functions in utils.py”
* “Write tests for UserRepository”
* “Commit changes with a smart message”

Each one handled with multi-step reasoning, zero setup, and no token anxiety.

---

## Why I’m Sticking With It

It’s not just that OCode saves me money.

It’s that it feels **mine**.

I can edit the tool layer. I can change the prompt format. I can route different tasks to different models. I can run it on a flight with no internet.

In a world where most AI tools feel like platforms trying to own you, OCode is a reminder that you can still own your own workflow.

---

## The Real Point

Look, I don’t expect everyone to ditch their cloud tools tomorrow. But if you’ve ever looked at an AI invoice and thought, “This is wild,” you’re not alone.

If you’ve ever wished your dev assistant understood your repo *without* you copy-pasting three files into a chat window—you’ve got options.

And if you’ve ever wanted something faster, cheaper, and more transparent than the big-box AI services?

Well, now you’ve got a one-liner.

```bash
curl -fsSL [https://raw.githubusercontent.com/haasonsaas/ocode/main/scripts/install.sh](https://raw.githubusercontent.com/haasonsaas/ocode/main/scripts/install.sh) | bash
```text

And if you build something cool on top of it? Let me know. I built OCode to escape SaaS rent. But it might just be a better way to code.

---

**Made with a terminal window, two coffees, and two very confused cats.** 🐈
````
