---
author: Jonathan Haas
pubDate: '2024-04-11'

title: 'The Integration Tax: What Nobody Tells You About Building Modern Software'

description: 'FIXME: Add a full description for this post.'
tags:
  - engineering
  - product
  - strategy
  - infrastructure
  - developer-tools
---

Every piece of software you build comes with a hidden cost: the integration tax.
It's the exponentially growing complexity of connecting with other systems, the
late-night incidents when a third-party API changes unexpectedly, and the
countless hours spent updating integration code that "just worked" yesterday.

## The Hidden Complexity of Modern Software

Five years ago, I could build a basic authentication system with a database and
some session management. Today, I'm expected to integrate with OAuth providers,
implement social logins, support enterprise SSO, and maintain compatibility with
legacy authentication methods. Each integration adds a new layer of complexity,
a new potential point of failure, and a new set of dependencies to manage.

This isn't just about authentication. Every aspect of modern software
development comes with an integration burden:

- Payment processing requires supporting multiple providers and methods
- File storage needs to work across various cloud providers
- Communication features demand integration with email, SMS, and push
  notification services
- Analytics systems need to pipe data to multiple destinations
- Customer support tools require deep integration with your user management
  system

## The Real Cost Isn't Technical

The most surprising thing I've learned about integrations is that the technical
implementation is often the easiest part. The real costs come from:

1. **Lifecycle Management**: Every integration you add is a long-term
   commitment. It's not just about building it—it's about maintaining it,
   monitoring it, and eventually replacing it.

1. **Dependency Cascades**: When one integration updates their API, it can
   trigger a chain reaction of updates across your entire system. We once spent
   three weeks updating our codebase because a critical authentication provider
   decided to deprecate their v1 API.

1. **Knowledge Debt**: Each integration comes with its own quirks, edge cases,
   and institutional knowledge. As teams change and systems evolve, this
   knowledge becomes increasingly expensive to maintain.

## The Integration Graveyard

Look at any codebase more than a few years old and you'll find what I call the
"integration graveyard"—layers of abandoned or semi-maintained integration code
that nobody wants to touch. It usually looks something like this:

````typescript
class PaymentProcessor {
  // Added in 2020
  async processBraintreePayment() {
    // 200 lines of legacy code nobody understands
  }

  // Added in 2021
  async processStripePayment() {
    // The "new" way we do things
  }

  // Added in 2022
  async processModernPayment() {
    // The "even newer" way we do things
  }

  // Added in 2023
  async processPayment() {
    // What we actually use now
  }
}
```text

Each layer represents a moment in time when someone said, "We need to update
this," but couldn't quite justify removing the old code. It's technical debt
with compound interest.

## Breaking the Cycle

After years of building and maintaining integrations, I've developed a few
principles that help manage this complexity:

### 1. The Abstraction Contract

Create clear boundaries between your core business logic and your integrations.
Every external service should be accessed through an abstraction layer that your
team fully controls. This isn't just about clean code—it's about survival.

```typescript
// Don't do this
await stripe.charges.create({...})

// Do this
await paymentProvider.processPayment({...})
```text

### 2. The Single Source Pattern

For each type of integration, designate a single source of truth in your
codebase. This means one way to:

- Handle authentication
- Process payments
- Store files
- Send notifications
- Log events

When you need to add support for a new provider, add it behind your existing
abstraction. This discipline pays off exponentially as your system grows.

### 3. The Migration-First Mindset

Every integration should be built with its eventual replacement in mind. This
means:

- Clear interfaces between systems
- Comprehensive logging and monitoring
- Built-in support for running old and new implementations in parallel
- Clear patterns for gradual migration

## The Path Forward

The solution to integration complexity isn't to avoid integrations—they're a
necessary part of modern software development. Instead, we need to change how we
think about them:

1. **Treat Integrations as Products**: Each integration should have an owner, a
   roadmap, and clear success metrics.

1. **Build for Replacement**: Design your integration points with the assumption
   that everything will change.

1. **Invest in Tooling**: Build tools that make it easy to do the right thing:
   - Automatic API client generation
   - Comprehensive integration testing
   - Real-time monitoring and alerts
   - Easy rollback capabilities

## A New Approach

The next time you're about to add a new integration, stop and ask:

- What's the true cost of maintaining this?
- How will we handle updates and breaking changes?
- What happens when we need to replace it?
- How can we minimize the blast radius of changes?

In the end, the quality of your software isn't just about what it can do—it's
about how well it can adapt when everything around it changes.

And in modern software development, change is the only constant.
````
