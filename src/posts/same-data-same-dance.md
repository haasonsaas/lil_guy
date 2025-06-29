---
author: Jonathan Haas
pubDate: '2025-04-21'
title: "Same Data, Same Dance: Why the Moat Isn't Technical Anymore"
description: 'Inspired by a post from Ross Haleliuk - "In the world where many tools have similar architectures and implementations, the moat is no longer about technology."'
featured: false
draft: false
tags:
  - cybersecurity
  - product-strategy
  - user-experience
  - vendor-differentiation
  - cspm
  - security-tools
---

> **Inspired by a post from [Ross Haleliuk](https://www.linkedin.com/in/rosshaleliuk/):**
>
> "In the world where many tools have similar architectures and implementations, the moat is no longer about technology. It is about user experience, brand perception, speed of execution, distribution, and continuous delivery of value... This replacability is both a feature AND a bug."

Nearly every modern security tool starts the same way: it asks for access to your cloud account, connects to your SaaS platforms, ingests posture metadata or logs, and then—surprise—it "shows you things."

This standardization is both the gift and the curse of building in cloud-native security today. The gift is quick time-to-value. The curse is undifferentiated architecture.

Let's break it down.

## The Sameness Problem

If you've seen one CSPM, you've kind of seen them all. That might sound unfair—but it's not wrong. They follow a nearly identical onboarding playbook:

1. **Plug in your cloud environment** (IAM role or access token)
1. **Ingest some posture data** (misconfigured buckets, open ports, unused permissions)
1. **Surface findings** ("Here's what's wrong")
1. **Push tickets** to Jira or ServiceNow
1. **Claim success** because findings equal value

Now apply that to detection tools, identity governance tools, SaaS posture tools, or even cloud-native firewalls. They all follow the same general formula:

> Ingest standardized data → Run predefined logic → Present it in a dashboard → Export to something else.

This pattern is so pervasive it's practically security tool Mad Libs. Just fill in your data source, your detection logic, and your export destination—boom, you've got another entry in an already crowded market.

## When Everyone Pulls From the Same Data Lake

The harsh truth is this: when every tool starts with the same data, your _only_ real moat is what you do _after_ that.

Think about it:

- You're not the only one with access to AWS Config or Okta logs.
- You're not the only one parsing audit trails from Google Workspace.
- You're not the only one scanning your customer's Terraform files.

The core tech is shared. The API endpoints are public. The permissions models are similar. The techniques are Googleable.

Your fancy machine learning algorithm? Someone else has a similar one. Your "patented" detection method? There are five open-source alternatives. Your custom dashboard? Give it six months, and your competitors will have something comparable.

So if everyone's swimming in the same pool, how do you win?

## Where the Moat Actually Is

If you're building or buying in this environment, here's where real differentiation shows up:

### 1. Speed of Execution

If a security vendor gives you value in the first 10 minutes, that's a moat.  
Not because the insights are unique, but because _most vendors are still fumbling through setup_ while this one is already producing results.

**Execution is its own feature.**

Think about your last security tool implementation. How long did it take from "I've got my login" to "I'm seeing actionable data"? An hour? A day? A week? Now imagine that compressed into minutes. That's not just convenience—that's competitive advantage.

Security teams are drowning in tools and drowning in alerts. A product that respects their time by delivering value instantly stands out not because it's technically superior, but because it understands the real currency in security: time.

### 2. User Experience

Design in security tools is historically an afterthought. When someone builds a tool that _feels great to use_—fast, intuitive, helpful—they stand out in a sea of clunky dashboards and misaligned filters.

When UX is bad, people find workarounds. When UX is great, they invite others to use it.

Let's be real: most security tools look like they were designed by engineers for engineers in 2010. Dense tables. Cryptic abbreviations. Fifty checkboxes on a single page. Color schemes that make your eyes bleed.

The tools that break this mold—that actually invest in design thinking—create enthusiastic users who become internal champions. They're not technically superior—they're emotionally superior. And in a world of feature parity, emotions win deals.

### 3. Brand Perception and Trust

Security is a trust game. Users gravitate toward products they feel confident in—because of the team, the transparency, or the reputation.

In markets where features look identical, _who you are_ matters more than _what you do_.

This isn't just marketing fluff. When two products have identical features (and they increasingly do), buyers choose the one they trust more.

Why do financial institutions still buy from the "nobody got fired for buying IBM" vendors despite innovative startups offering better products at lower prices? Trust. Why do security teams stick with clunky tools from established brands rather than switching to slicker alternatives? Trust.

Building trust isn't about your marketing budget. It's about being truthful about limitations, transparent about incidents, and consistent in your communication. In an industry overflowing with FUD, straight talk creates disproportionate trust.

### 4. Distribution and Embeddedness

Getting into the stack first often matters more than what happens after.  
A tool that's bundled with a compliance offering, or embedded in a broader platform (e.g., part of a GRC workflow), gains inertia.

Being the default beats being the best—especially when switching costs are low.

This is the cold reality of the market. The path to the customer often matters more than the product itself. The tool that comes bundled with AWS Enterprise Support, or included in your Palo Alto Networks license, or shows up as a one-click install in your cloud console—that's the tool that wins massive adoption.

Not because it's better. Because it's _there_.

Smart security vendors aren't just building products—they're building distribution channels. They're partnering with clouds, embedding in platforms, and creating ecosystems that make their adoption the path of least resistance.

### 5. Continuous Delivery of Value

Every tool gets a honeymoon. The best ones keep delivering after the first 30 days. That means:

- Automatically tuning false positives
- Surfacing unexpected correlations
- Aligning with user workflows
- Staying up-to-date with cloud changes

When a tool gets smarter _with you_, it earns its keep.

Most security tools follow a predictable pattern after deployment: initial excitement, growing annoyance with false positives, then increasing neglect as the signal-to-noise ratio deteriorates. Eventually, they become shelfware—still running, still billing, still generating alerts that no one reads.

Tools that break this cycle—that actually improve over time—create stickiness that transcends features. They become trusted partners rather than annoying noise generators. And that relationship is much harder for competitors to displace than a feature-based decision.

## Replaceability: A Feature and a Bug

Let's talk CSPMs again.

Yes, it's easy to switch. And yes, that _should_ make buyers happy.

But here's the double-edged sword: replaceability makes it very hard for vendors to retain customers long-term _unless_ they deliver value in ways that go beyond "finding stuff."

> If the only thing your product does is identify issues, you're just another list generator.

A real moat starts where the finding ends:

- How well do you prioritize?
- How deeply do you integrate into remediation workflows?
- How often do your recommendations get followed?

Think about it from the buyer's perspective. If five different tools can tell you the same S3 bucket is public, what's stopping you from switching to the cheaper one next year? Nothing but inertia.

This replaceability creates an existential challenge for vendors: how do you build a sustainable business when your core technical function is increasingly commoditized?

The answer isn't building more detection rules or parsing more log types. It's in creating value that transcends the initial finding—in helping teams understand what matters, why it matters, and exactly how to fix it in their specific environment.

## If You're Building Security Products Today...

Here's the playbook I'd follow:

- **Start with the standard architecture.** It's fine. Everyone does.
- **Then immediately zoom out and ask: What's our unfair advantage?**
  - Is it speed?
  - Is it experience?
  - Is it trust?
  - Is it ecosystem?

If the answer is "we parse logs better," keep digging. Because the next tool will parse them too.

The uncomfortable truth is this: your parsing algorithm, your detection logic, your dashboard layout—these are all temporary advantages at best. Your competitors are a GitHub repo and a weekend coding sprint away from matching them.

The sustainable advantages come from the areas that can't be easily replicated: the relationship you build with users, the trust you establish in the market, the ecosystem you create around your product, and the speed with which you deliver meaningful value.

## Beyond Technical Differentiation

The most successful security vendors of the next decade won't win because they have marginally better detection algorithms. They'll win because they:

- Get users to valuable insights in minutes, not days
- Build interfaces that security professionals actually enjoy using
- Establish trust through transparency and consistent communication
- Create distribution channels that make adoption frictionless
- Deliver increasing value over time rather than diminishing returns

This isn't to say technical excellence doesn't matter. It absolutely does—as table stakes. But in a world where the technical playing field is increasingly level, the differentiators are increasingly non-technical.

## TL;DR

- **APIs are table stakes.**
- **Ingesting logs is not a moat.**
- **Findings aren't enough.**
- **Moats are built on experience, velocity, integration, and trust.**

Same data. Same pipeline. Same surface area. The difference isn't in what you collect—it's in what you deliver.
