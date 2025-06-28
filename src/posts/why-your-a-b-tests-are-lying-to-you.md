---
author: Jonathan Haas
pubDate: '2025-06-19'
title: Why Your A/B Tests Are Lying to You
description: >-
  Statistical significance doesn't mean what you think it means. Here's why 95%
  of A/B tests are misleading and what to track instead.
featured: false
draft: false
tags:
  - ab-testing
  - statistics
  - data
  - product
---

95% of product teams are making decisions based on A/B test results that are statistically meaningless. I've seen companies pivot entire strategies, hire data scientists, and burn millions in development costs—all because they misunderstood what "statistically significant" actually means.

The problem isn't that A/B testing doesn't work. It's that most teams are running tests wrong, interpreting results wrong, and making decisions based on statistical theater rather than meaningful data.

## The Statistical Significance Theater

Here's what happens at most companies:

1. Run an A/B test for a week
1. See p < 0.05
1. Declare victory
1. Ship the "winning" variant
1. Watch conversion rates return to baseline

Sound familiar? You're not alone. Most teams confuse statistical significance with practical significance, and it's costing them dearly.

## Test Your Understanding

Before we dive deeper, let's see how your current A/B tests stack up. Try different scenarios and see what the numbers actually tell you:

<ab-test-simulator />

Surprised by those results? Most teams are. Let's break down what's really happening.

## The Four Lies Your A/B Tests Tell You

### Lie #1: "p < 0.05 Means It's Real"

Statistical significance only tells you that your result is unlikely to be due to random chance. It doesn't tell you:

- If the effect is large enough to matter
- If the effect will persist over time
- If the test had enough power to detect real differences

**The reality:** A test with 10,000 users can detect tiny, meaningless differences as "statistically significant." Meanwhile, a test with 200 users might miss huge improvements because it's underpowered.

### Lie #2: "Bigger Sample = Better Results"

More data can actually make your tests worse if you're not careful. Large samples can:

- Detect statistically significant but practically meaningless differences
- Hide important segments where the effect is actually strong
- Lead to false confidence in weak effects

**The reality:** You need the _right_ sample size, not the biggest sample size.

### Lie #3: "95% Confident Means 95% Right"

A 95% confidence interval doesn't mean you're 95% certain the true effect is in that range. It means that if you ran this exact test 100 times, about 95 of those intervals would contain the true effect.

**The reality:** Your specific test result could be in the 5% that's completely wrong.

### Lie #4: "No Difference = No Effect"

When a test isn't statistically significant, most teams conclude there's no effect. But "no significance" often just means "we didn't collect enough data to detect the effect."

**The reality:** Absence of evidence isn't evidence of absence.

## What Actually Matters: The Power Analysis

The most ignored metric in A/B testing is statistical power—the probability that your test will detect a real effect if one exists. Most tests have terrible power, which means:

- **Low power (< 50%)**: Your test probably won't detect real improvements
- **Medium power (50-80%)**: Your test might catch big improvements, but will miss smaller ones
- **High power (80%+)**: Your test can reliably detect meaningful changes

**The brutal truth:** Most A/B tests have power below 50%. You're essentially flipping coins and calling it data science.

## The Minimum Detectable Effect Reality Check

Every test has a minimum detectable effect (MDE)—the smallest change it can reliably detect. If your test can only detect a 25% improvement in conversion rate, but you're looking for 2% improvements, you're wasting everyone's time.

**Before running any test, ask:**

- What's the smallest improvement that would change our strategy?
- Can our test actually detect that improvement?
- If not, why are we running it?

## The Confidence Interval Truth

Confidence intervals tell you the range of plausible values for your effect. A "statistically significant" result with a confidence interval of [0.1%, 15%] is very different from one with [8%, 12%].

**Red flags:**

- Confidence intervals that include zero (even if p < 0.05)
- Confidence intervals that are huge relative to your effect
- Confidence intervals that include both trivial and massive effects

## How to Run Tests That Actually Matter

### 1. Design for Power First

- Calculate required sample size before starting
- Aim for 80%+ power
- Design tests to detect the minimum effect size you care about

### 2. Focus on Effect Size, Not Just Significance

- Report confidence intervals, not just p-values
- Consider practical significance alongside statistical significance
- Ask: "Is this difference big enough to change our strategy?"

### 3. Plan for Segmentation

- Different user segments often have different responses
- Build tests that can detect segment-specific effects
- Don't hide important variations behind overall averages

### 4. Embrace "Inconclusive" Results

- Sometimes the honest answer is "we don't know"
- It's better to collect more data than make decisions on weak evidence
- Failed tests teach you as much as successful ones

## The Business Impact Framework

Instead of asking "Is it significant?", ask:

1. **Is the effect large enough to matter to our business?**
1. **Is our test powerful enough to detect that effect?**
1. **What's the range of plausible outcomes?**
1. **What would we do differently based on these results?**

## The Action Plan

1. **Audit your current tests** using power analysis
1. **Calculate effect sizes** you actually care about
1. **Design tests** with adequate power for those effects
1. **Report confidence intervals** alongside p-values
1. **Make decisions** based on business impact, not just statistics

## The Bottom Line

Statistical significance is a tool, not a destination. The goal isn't to achieve p < 0.05—it's to make better product decisions based on reliable evidence.

Stop letting statistical theater drive your product strategy. Start running tests that actually tell you something meaningful about your users and your business.

Your product roadmap will thank you.
