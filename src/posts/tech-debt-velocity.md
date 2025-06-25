---
author: Jonathan Haas
pubDate: 2024-04-11
title: 'Tech Debt Velocity: Measuring the True Cost of Shortcuts'
postSlug: the-velocity-trap
featured: true
draft: false
tags:
  - technical-debt
  - engineering
  - product
series:
  name: 'Technical Debt'
  part: 4
image:
  url: 'https://images.pexels.com/photos/1314410/pexels-photo-1314410.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  alt: 'A hand holding up a lightbulb, showing streaks of light'
description: A framework for understanding and measuring the real impact of technical debt on engineering velocity and product development
---

The most expensive software I've ever written was code I wrote "quickly." Not
because it was complex, but because I wrote it with the intention of "fixing it
later." Many years and many teams later, that code is still running in
production, accumulated like sedimentary rock layers of quick fixes and
workarounds.

## The False Promise of Velocity

We've all been there. The deadline is tight, the pressure is on, and someone
says those magic words: "We'll clean it up in v2." It's a tempting promise - the
idea that we can trade a little technical cleanliness now for speed, and somehow
pay back that debt later.

But there's a fundamental flaw in this thinking. It assumes that technical debt
is linear - that a week of rushed development equals a week of cleanup later.
The reality is far more insidious.

## The Real Cost of Rushed Code

When we rush code into production, we're not just creating technical debt -
we're creating organizational debt. Here's what actually happens:

1. **Knowledge Decay**: The context and assumptions behind quick decisions fade
   from memory
1. **Compound Complexity**: New features built on top of rushed code require
   their own workarounds
1. **Team Friction**: New team members struggle to understand the "temporary"
   solutions that became permanent
1. **Lost Opportunities**: The cost of not being able to quickly ship new
   features compounds over time

## The Documentation Mirage

"But we'll document it!" we say, as if documentation somehow absolves us of
rushed architectural decisions. I once found a comment in production code that
read:

````python
# TODO: This is a temporary fix for the demo on 5/15/2021
# Will be replaced with proper implementation after launch
# Update 7/2/2021: Keeping this for now, works well enough
# Update 3/10/2022: Don't touch this, multiple features depend on current behavior
# Update 9/1/2023: Dear God why
```text

Documentation doesn't fix architectural problems - it just helps us understand
why we're stuck with them.

## Breaking the Cycle

After years of watching this pattern repeat, I've developed a few principles
that help teams maintain true velocity:

### 1. The Two-Way Door Rule

For every decision, ask: "Is this a two-way door?" Can we easily undo this if we
need to? If not, it deserves more time and thought, regardless of current
pressures.

### 2. The Future Reader Test

Write code as if the person who'll maintain it is a violent psychopath who knows
where you live. More practically, write it for a team member who joins six
months from now with none of the current context.

### 3. The Incremental Path

Instead of big "temporary" solutions, find ways to evolve your architecture
incrementally:

```typescript
// Instead of:
class LegacyPaymentProcessor {
  // 500 lines of "temporary" code
}

// Build incrementally:
interface PaymentProcessor {
  processPayment(payment: Payment): Promise<Result>
}

class CurrentProcessor implements PaymentProcessor {
  // Clean, focused implementation
}

class LegacyAdapter implements PaymentProcessor {
  // Thin adapter around legacy code
}
```text

## The Path to Sustainable Speed

True velocity isn't about moving fast today - it's about being able to move fast
consistently over time. This requires:

1. **Investment in Architecture**: Spend time making changes easy, not just
   making changes
1. **Clear Boundaries**: Define and enforce clean interfaces between systems
1. **Continuous Refinement**: Regular investment in improving existing systems
1. **Team Alignment**: Shared understanding of the cost of rushed decisions

## A New Definition of Fast

The next time someone says "we need to move fast," remember that there are two
types of fast:

- The kind that looks impressive in a sprint demo
- The kind that lets you ship major features six months from now

The first feels good in the moment but creates organizational drag. The second
feels slower but builds compounding organizational velocity.

Because in the end, the fastest way to move forward is to make sure you're not
constantly fighting against your own technical decisions.

Speed isn't about writing code quickly - it's about being able to change
direction safely.
````
