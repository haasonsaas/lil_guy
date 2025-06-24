---
author: "Jonathan Haas"
pubDate: "2024-11-29"
title: "Technical Debt Isn't Just Slowing You Down—It's Accelerating"
description: "Use this engineering velocity tracker to see how technical debt compounds exponentially. Model different paydown strategies and find the break-even point for your team."
featured: false
draft: false
tags: ["engineering", "technical-debt", "productivity", "interactive"]
---

Your team shipped 12 features last quarter. This quarter, with the same people and same effort, you shipped 8.

Everyone feels it—the gradual slowdown, the increasing friction. But when you try to quantify technical debt's impact, you get hand-waving and gut feelings. "It's slowing us down by maybe 20-30%?" Nobody really knows.

Here's the thing: technical debt doesn't grow linearly. It accelerates.

## The Compound Interest of Broken Things

Technical debt is unique among business debts because it compounds in three dimensions simultaneously:

**1. Direct Impact**: The obvious stuff. Slow builds, flaky tests, manual deployments. Each one steals time from feature development.

**2. Accumulation Rate**: Unlike financial debt with fixed interest, technical debt's "interest rate" increases over time. That architectural decision that costs you 2 hours/week today will cost 5 hours/week in six months.

**3. Interaction Effects**: Technical debts don't exist in isolation. They interact, multiply, and create new categories of problems you didn't anticipate.

## Why We're Terrible at Prioritizing Debt Paydown

I've sat in countless planning meetings where technical debt discussions go like this:

**PM**: "We need these 5 features for the quarterly goal."
**Eng**: "We really need to address our technical debt."
**PM**: "How much will that improve velocity?"
**Eng**: "It's hard to quantify, but trust us, it's important."
**PM**: "Let's do features this quarter and debt next quarter."

Next quarter never comes.

The problem isn't that PMs don't care—it's that engineers can't articulate the compound impact in business terms. We need better models.

## Visualizing the Velocity Death Spiral

I built this tool because I was tired of losing the technical debt argument. Now I can show exactly when debt paydown becomes mandatory, not optional.

<engineering-velocity-tracker />

## How to Use This for Your Team

**Step 1: Baseline Your Reality**
Start by configuring your actual team metrics. Be honest about meeting overhead and bug fix time—these are velocity killers hiding in plain sight.

**Step 2: Audit Your Debt**
The pre-configured scenarios (Startup MVP, Scale-up, Legacy) are starting points. Customize them with your actual technical debt items. The categorization matters:
- **Architecture debt**: Highest velocity impact, hardest to fix
- **Testing debt**: Moderate impact but compounds through quality issues
- **Documentation debt**: Lower direct impact but multiplies onboarding time

**Step 3: Model the Future**
This is where it gets scary. Watch how your velocity degrades over 12-24 sprints with no intervention. That feature that takes 1 sprint today will take 2 sprints a year from now.

**Step 4: Find Your Break-Even Point**
Adjust the debt paydown percentage until you find where velocity stabilizes. This is your minimum viable debt payment. Anything less and you're on a trajectory to engineering paralysis.

## The Patterns I've Observed

After modeling dozens of teams, clear patterns emerge:

### The 20% Rule
Teams that allocate less than 20% of capacity to debt paydown inevitably see velocity degrade. It's not a question of if, but when.

### The Criticality Cliff
When you have 2+ critical debt items, velocity impact isn't additive—it's multiplicative. Fix critical items first, always.

### The False Economy
"We'll fix it after we ship this feature" is the most expensive sentence in software. Every sprint you delay increases the fix cost by 5-10%.

### The Acceleration Point
There's a specific point (usually around 40% velocity degradation) where teams enter a death spiral. New features create more debt than the value they deliver.

## Real-World Strategies That Work

**1. The Debt Sprint**
Every 6th sprint is 100% debt paydown. Non-negotiable. This maintains roughly 17% debt allocation while giving focused time for major refactors.

**2. The Boy Scout Rule**
Every feature includes 20% capacity for improving the code it touches. Debt paydown becomes part of feature delivery, not separate from it.

**3. The Rotation System**
One engineer per sprint focuses solely on debt reduction while others do features. Rotates each sprint. Maintains team knowledge and prevents debt work from being "punishment."

**4. The Debt Budget**
Each feature gets a "debt creation budget." Break it and you must fix existing debt first. Makes the tradeoff explicit at decision time.

## When to Pull the Emergency Brake

The model shows clear warning signs:

- Velocity degraded >30% from baseline
- 3+ critical debt items accumulated
- New features taking 2x original estimates
- More than 30% of sprint on bug fixes

Hit any of these and you need immediate intervention, not gradual paydown.

## The Business Case for Technical Excellence

Show this model to your leadership. The numbers are stark:

**Scenario**: 6-person team, $150k/engineer average
**Baseline velocity**: 60 story points/sprint
**After 1 year with no debt paydown**: 35 story points/sprint (42% degradation)
**Cost of lost velocity**: $378,000/year
**Cost of 20% debt allocation**: $180,000/year
**Net savings**: $198,000/year

Technical excellence isn't just about engineering happiness. It's about business survival.

## Your Action Items

1. **Model your current state** in the tracker. Be brutally honest.
2. **Run scenarios** for 0%, 10%, 20%, and 30% debt allocation.
3. **Find your break-even point** where velocity stabilizes.
4. **Share the visualization** with your PM/leadership.
5. **Pick a strategy** and commit to it for 6 months.

Technical debt is a choice. Not paying it down is also a choice—one with compound consequences.

The question isn't whether you can afford to pay down technical debt. It's whether you can afford not to.

---

*What's your team's approach to technical debt? Have you found strategies that work? Share your experiences—I'd love to hear what's worked (or spectacularly failed) for you.*