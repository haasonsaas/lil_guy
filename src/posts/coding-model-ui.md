---
author: Jonathan Haas
pubDate: 2025-06-18T00:00:00.000Z
title: Why Coding Models Are Terrible at UI (And What That Reveals About DevEx)
description: >-
  Coding models can write brilliant functions and tidy interfaces. But ask them
  to design usable UI—and they fall apart. Here’s why that matters more than you
  think.
featured: false
draft: false
tags:
  - developer-experience
  - ui-design
  - ai-tooling
  - prompt-engineering
  - product-strategy
---

Let’s just say it up front: coding models are really fucking bad at UI.

They can write clean TypeScript. They understand React’s component model. They even know Tailwind classes by heart. But put them in charge of a product surface and you get layouts that confuse, frustrate, or outright mislead users.

It’s not a lack of horsepower—it’s a mismatch of **context**. And it tells us something important about where developer experience tools should go next.

## The Illusion of Competence

Ask Claude or GPT-4 to build a CLI tool, and you’ll get something shockingly good. Ask it to generate a dropdown with dynamic filters, error states, and accessibility considerations, and... good luck.

The UI might compile. It might even render. But it won’t _work_. Not the way a human expects.

That’s because UI is less about "components" and more about _consequences_. What happens when I click this? Where should my eye go? Is this input enough to make a confident decision? LLMs don’t ask these questions.

Instead, they pattern-match.

They see "dashboard" and think: sidebar, cards, table, chart. But they don’t _think_—they regurgitate. Which means they rarely get the invisible UX details right:

- Microcopy that explains the action
- Keyboard navigation
- Focus state transitions
- Responsive behavior across screen sizes
- Hierarchical clarity

These aren’t "bugs." They’re **design intent**—and LLMs don’t have any.

## UI Is the Last Frontier

You’d think models that can write entire functions would also be good at user interfaces. But UI isn’t just about code. It’s about _human psychology_.

- Should that confirmation live in a modal or inline toast?
- Should a destructive action require typing a keyword?
- Should we show results immediately or wait for filters to be applied?

Each of these is a UX decision that **impacts cognition, emotion, and flow**. And that’s where current models break down: they don’t simulate humans, they simulate syntax.

That’s why most AI-generated UI is dead on arrival. It “works” the way a demo works: it’s showable. But not shippable.

## What Coding Models Get Wrong

Let’s get specific. Coding models over-index on three things:

1. **Completeness** — They try to handle all edge cases up front
1. **Reusability** — Everything becomes a prop-driven component
1. **Visual Nesting** — Hierarchy is expressed in markup, not meaning

But what users care about is:

- Is this clear?
- Is this fast?
- Is this forgiving?

Here’s a real example I tried last week:

> Prompt: “Build a settings page with tabs for notifications, billing, and security.”

The model gave me:

````tsx
<Tabs>
  <Tab label="Notifications">
    <Form>
      <Checkbox label="Email me updates" />
      <Checkbox label="Push alerts" />
    </Form>
  </Tab>
  <Tab label="Billing">
    <Card>
      <Text>Payment method on file</Text>
      <Button>Edit</Button>
    </Card>
  </Tab>
  <Tab label="Security">
    <Form>
      <Input label="Current Password" />
      <Input label="New Password" />
    </Form>
  </Tab>
</Tabs>
```text

Visually? Passable.

Experientially? Horrible.

No route persistence. No validation hints. No save state. No disabled form feedback. No accessibility labels.

The model nailed the *structure*, but missed the *story*.

## Why This Matters for Developer Tools

Dev tools aren’t judged just on functionality anymore. They’re judged on *flow*.

If your internal tool saves five minutes but confuses every new hire, it’s a net loss. If your dashboard has every metric but no narrative, it’s cognitive overload.

And yet we keep asking AI to generate UI.

Worse, we often mistake good code for good experience.

But just because a UI compiles doesn’t mean it’s usable. And just because a dashboard renders doesn’t mean it answers a question.

That’s the DevEx trap.

## How to Use Coding Models Better

Here’s the shift: don’t treat coding models like UI designers. Treat them like *pattern expanders*.

Great prompts don’t say “build me a UI.” They say:

* “Give me a skeleton with empty states and a loading shimmer.”
* “Wrap this form in a card with inline validation and a disabled submit button until dirty.”
* “Generate a dropdown that prioritizes accessibility and keyboard navigation.”

The more *intent* you embed, the better the outcome.

Or, better yet—split responsibilities:

* Let Claude build the data fetch layer
* Let you design the interaction model

Think of it as pair programming with a very senior, very clueless intern.

## Where AI Should Go Next

Instead of generating UI, models should *critique it*.

Imagine this: You write a form. The model analyzes:

* Is the label clear?
* Is the error state reachable?
* Is the interaction flow recoverable?
* Does this affordance suggest its function?

This is the kind of tooling that *actually* levels up developer experience.

Not “Write my UI for me.”
But: “Tell me why this UI sucks before my users do.”

## Conclusion

Coding models aren’t bad at UI because they’re dumb. They’re bad because **UI isn’t about code—it’s about context**.

Until models can simulate human experience, they’ll keep failing the UI test.

The next leap in DevEx won’t come from better component generators.
It’ll come from tools that help you think like a designer, write like a developer, and deliver like a product leader.

We’re not there yet. But we can prompt smarter.

And in the meantime—keep your hand on the mouse.
````
