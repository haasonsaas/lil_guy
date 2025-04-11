---
author: Jonathan Haas
pubDate: 2024-12-26
title: 'Building a Chrome Extension for Better JIRA Titles'
postSlug: chrome-extension-jira-titles
featured: false
draft: false
tags:
  - artificial-intelligence
  - product-development
  - productivity
  - tooling
description:
  How I built a Chrome extension using GPT-4 to automatically generate clear,
  consistent JIRA ticket titles and improved our team's workflow
image:
  url: 'https://images.pexels.com/photos/67112/pexels-photo-67112.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  alt: 'Chrome browser extension interface showing JIRA title generation'
---

"Can you make this JIRA title clearer?"

As a product manager, I've heard this question countless times. It usually comes
after I've hastily created a ticket during a customer call or quickly documented
a bug report. The irony isn't lost on me - I spend my days advocating for clear
communication, yet consistently struggle with one of its most basic elements:
writing good JIRA titles.

## The Problem with JIRA Titles

Let me paint you a picture of what usually happens:

I'm on a call with a customer who's describing a complex problem. I'm taking
notes, asking questions, and trying to capture everything. After the call, I
create a JIRA ticket with a title like "Dashboard loading issue" or "Update user
flow." A few days later, when reviewing the sprint board, neither I nor the
engineering team can remember exactly what the ticket was about without diving
into the description.

Sound familiar?

## From Frustration to Solution

After one particularly frustrating backlog grooming session where we spent more
time clarifying ticket titles (again, totally on me!) than discussing actual
work, I decided to solve this problem. As a product manager who dabbles in
coding, I thought, "Why not build a Chrome extension that helps generate better
JIRA titles?"

The idea was simple: highlight any text (like meeting notes or a bug
description), right-click, and get an AI-generated JIRA title that's clear,
consistent, and actually useful.

## Building the Solution

I built a Chrome extension that uses OpenAI's latest GPT-4 model to generate
JIRA titles. But more importantly, I built it with an understanding of what
makes a good ticket title from both a product and engineering perspective:

1. **Context-Aware Templates**: Different types of work need different types of
   titles. A bug title should highlight the issue and its impact. A feature
   request should emphasize the new capability.

2. **Consistent Formatting**: Whether you prefer sentence case, title case, or
   lowercase, consistency makes backlogs more scannable and professional.

3. **Quick Access**: Right-click menu integration means no context switching -
   you can create well-titled tickets without interrupting your workflow.

## What I Learned

Building this extension taught me several valuable lessons:

1. **The Power of Small Tools**: Sometimes the most impactful improvements come
   from solving small, everyday friction points. This wasn't about revolutionary
   feature development - it was about making our daily work slightly better.

2. **AI as an Enhancer**: AI works best when it enhances human workflows rather
   than replacing them. The extension doesn't decide what tickets to create; it
   helps make those tickets clearer and more consistent.

3. **Product Managing Your Own Product**: Building something for your own use
   case is incredibly enlightening. Every feature decision was based on real
   needs and immediate feedback.

## The Results

The impact was immediately noticeable:

- More recent backlog grooming sessions focused on substance rather than
  clarification
- Engineers could better estimate work from titles alone
- My own ticket creation process became faster and more consistent
- Other PMs started asking for access (hence this blog post)

## Looking Forward

This project has opened up interesting possibilities for other workflow
improvements. Could we apply similar principles to other parts of the product
management process? What other daily friction points could we solve with
targeted tools?

I'm sharing this not just as a useful tool announcement, but as an example of
how product managers can directly solve their own problems. We don't always need
to wait for solutions to come from elsewhere.

## Try It Yourself

The extension is straightforward to use:

1. Download it from the GitHub
   [repo](https://github.com/haasonsaas/jira-title-generator)
2. Load the unpacked folder in Chrome
3. Add your OpenAI API key in the settings
4. Select any text, right-click, and choose "Generate JIRA Title"
5. Use the popup to adjust formats and templates as needed

## Final Thoughts

Sometimes the best product solutions come from solving our own problems. As
product managers, we're trained to identify and solve user problems - but we
don't always apply those same skills to our own workflows.

Whether you use this specific extension or not, I encourage you to look for
those small friction points in your daily work. What minor annoyances do you
face repeatedly? What small tools could make your work significantly better?

Because at the end of the day, better tools lead to better work, and better work
leads to better products.
