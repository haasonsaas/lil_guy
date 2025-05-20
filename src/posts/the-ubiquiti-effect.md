---
author: Jonathan Haas
pubDate: 2024-11-23
title:
  'The Ubiquiti Effect: Why Enterprise Software Needs a Consumer Revolution'
postSlug: the-ubiquiti-effect
featured: true
draft: false
tags:
  - enterprise-software
  - product-design
  - user-experience
  - scalability
  - technology-strategy
image:
  url: 'https://images.pexels.com/photos/233698/pexels-photo-233698.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  alt:
    'Two buildings with modern architecture, both with a glass facade against a
    dark blue sky'
description:
  How Ubiquiti's approach to product design offers a blueprint for the future of
  enterprise software
---

## The False Choice of Enterprise Software

Enterprise software has long operated under a flawed assumption: that power and
simplicity are mutually exclusive. This assumption has led to bloated
interfaces, complicated workflows, and the notion that a steep learning curve is
the price of admission for powerful software. The reality is that this is a
false choice, born of lazy design thinking and antiquated development practices.

## Beyond Surface Simplicity

When we examine successful enterprise products that break this mold, we find
something deeper than mere interface cleanup. Modern compliance
automation platforms demonstrate this through progressive complexity management.
Rather than simply hiding advanced features behind a "clean interface," they
fundamentally reimagine how users should interact with compliance requirements.

The initial experience presents clear, actionable tasks - but the underlying
system maintains the full complexity of SOC 2, ISO 27001, and other frameworks.
This isn't simplification through reduction; it's simplification through careful
orchestration. When a company needs to demonstrate their security practices to
an auditor, every detail and configuration option is still there, carefully
organized and accessible when needed.

## The Power of Intelligent Progression

At ThreatKey, we discovered that the key to serving both small startups and
large enterprises wasn't building different products or even different
interfaces - it was building an experience that naturally evolved with the
customer. The security monitoring engine running underneath was equally
sophisticated for all customers, but the interface and workflows adapted based
on team size, security maturity, and specific needs.

This manifested in concrete ways: A startup's security engineer would see
straightforward alerts with clear remediation steps. As the company grew and
their security team expanded, the same alerts could expose more context, custom
configuration options, and integration capabilities. The underlying detection
logic remained consistent - what changed was how we presented information and
actions based on the user's context and needs.

## Learning from Consumer Interfaces

Ubiquiti's genius lies in bringing consumer-grade thoughtfulness to
enterprise-grade functionality. Their network management interface feels more
like setting up a home media center than configuring enterprise networking
equipment - until you need it to be more. This isn't accidental; it's the result
of deliberate product decisions that prioritize user context over feature
accessibility.

At Carta, this principle transformed how we handled complex equity operations.
Instead of exposing every possible configuration option for a 409A valuation, we
built workflows that adapted to the company's stage and needs. A seed-stage
startup founder sees a streamlined interface focused on basic cap table
management, while a pre-IPO company's finance team gets deep customization
options for complex equity structures - all within the same product.

## The Technical Reality

The challenge in building software this way isn't technical - it's
philosophical. Modern development tools and architectures make it entirely
possible to build interfaces that adapt to user needs. The real barrier is a
product mindset that equates feature visibility with feature value.

Consider how modern compliance platforms approach this: The underlying data model captures
every nuance of security controls and compliance requirements. The API layer
supports every possible configuration and query. But the interface layer makes
intelligent decisions about what to show, when to show it, and how to present it
based on the user's context, company size, compliance goals, and previous
interactions.

## Breaking Down Progressive Disclosure

Progressive disclosure in enterprise software isn't just about hiding advanced
features behind "Advanced" tabs. It requires a deep understanding of user
workflows and maturity models. At ThreatKey, we mapped out common security team
evolution patterns: from a single developer handling security part-time, to a
dedicated security engineer, to a full security team with specialized roles.

This mapping informed every product decision. Alert grouping, for instance,
evolved from simple severity-based categorization to sophisticated correlation
rules - but only when a team's size and workflow complexity justified it. The
underlying capability was always there, but its presentation adapted to the
team's needs and capabilities.

## The Business Impact

This approach to product development has profound business implications. At
Carta, we found that companies stayed with the platform as they grew precisely
because they didn't have to switch to a "more powerful" solution. The platform
grew with them, revealing new capabilities as they needed them. This translated
into higher retention rates and more natural expansion revenue.

Similarly, modern compliance platforms can serve both small startups and
large enterprises with the same core product. The platform's ability to adapt
its interface and workflows based on company size and compliance needs means they
can maintain a single codebase while serving vastly different customer segments
effectively.

## Product Development in Practice

Implementing this philosophy requires a different approach to product
development. Feature prioritization discussions shift from "what should we
build?" to "how should we reveal this capability?" Product managers must think
in terms of capability progressive disclosure rather than feature shipping.

This manifests in practical ways during product development: The initial product
spec must account for how a feature will be presented at different
organizational maturity levels. Technical architecture discussions must consider
how to build flexibility into the presentation layer without duplicating core
business logic. Design reviews must evaluate not just the interface itself but
the entire progression of how capabilities are revealed.

## Beyond Minimum Viable Product

This approach challenges the traditional notion of MVP. Instead of shipping a
simplified version of a feature and later adding complexity, we build features
with their full complexity but carefully manage how that complexity is revealed.
The initial release might expose only basic functionality, but the underlying
architecture supports the full feature set from day one.

At ThreatKey, this meant our detection engine was always enterprise-grade, even
when serving small companies. The difference was in how we presented the alerts
and configuration options. This approach proved more efficient than trying to
gradually add power to a simplified initial version.

## A New Framework for Enterprise Software

The future of enterprise software lies not in choosing between power and
simplicity, but in building products that can be both powerful and simple,
adapting to each user's needs and context. This requires a fundamental shift in
how we think about product development, user experience, and feature deployment.

Success in this new paradigm comes from understanding that enterprise software's
complexity should be opt-in, not opt-out. Power should be available but not
imposing. Features should reveal themselves through natural discovery, not
extensive training. This is how we build enterprise software that users actually
want to use, rather than software they have to use.

The way forward is clear: build for the novice, scale for the expert, and let
users choose their own path to power. The companies that master this approach
will define the next generation of enterprise software.
