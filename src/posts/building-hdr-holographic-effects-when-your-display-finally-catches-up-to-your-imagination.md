---
author: Jonathan Haas
pubDate: '2025-06-19'
title: >-
  Building HDR Holographic Effects: When Your Display Finally Catches Up to Your
  Imagination
description: "I've been fascinated by holographic materials since I was a kid. You know the type—those shimmery surfaces that shift from blue to purple to gold as you tilt..."
featured: false
draft: false
tags:
  - webgl
  - graphics
  - creative-coding
  - hdr
---

I've been fascinated by holographic materials since I was a kid. You know the type—those shimmery surfaces that shift from blue to purple to gold as you tilt them. But recreating that effect digitally? That always felt impossible.

Until HDR displays changed everything.

## The Problem with Standard RGB

For decades, we've been trapped in the sRGB color space. Those vibrant holographic effects you see in the real world simply can't be represented within the 0-255 RGB range that standard displays support.

**Real holographic foil works by interference patterns**—light waves bouncing off microscopic ridges create those shifting colors. The brightness values can easily exceed what traditional displays can show.

But modern HDR displays? They can push brightness values 2-3x beyond standard range. Suddenly, we can create colors that actually hurt to look at—just like real metallic surfaces in bright light.

## Building True HDR Effects

I built an [HDR holographic foil experiment](/experiments/hdr-holographic-foil) that takes advantage of this expanded color range. Here's how it works:

### 1. Extended Color Values

Instead of capping colors at RGB(255, 255, 255), HDR-aware CSS lets us multiply beyond the standard range:

````css
background: hsl(240, 100%, 150%); /* 150% brightness exceeds standard range */
filter: brightness(2.5); /* Multiplier pushes into HDR territory */
```text

The key insight: **HDR isn't just about new color spaces—it's about brightness multipliers that exceed 1.0.**

### 2. Dynamic Gradient Generation

Real holographic foil shifts colors based on viewing angle. I simulate this with mouse-driven gradients:

```javascript
const generateHolographicGradient = () => {
  const angle = mousePosition.x * 360
  const hdrIntensity = 2.0 // Exceeds standard range

  const colors = [
    `hsl(0, 100%, ${50 * hdrIntensity}%)`,
    `hsl(60, 100%, ${60 * hdrIntensity}%)`,
    `hsl(180, 100%, ${55 * hdrIntensity}%)`,
    // ... more colors with HDR multipliers
  ]

  return `linear-gradient(${angle}deg, ${colors.join(', ')})`
}
```text

### 3. Layered Effects for Depth

Real holographic materials have multiple interference layers. I recreate this with stacked visual effects:

- **Base gradient**: Primary color shifts
- **Diffraction overlay**: Fine line patterns using repeating gradients
- **Shimmer layer**: Radial highlights that follow the mouse
- **Sparkle particles**: Animated points with HDR glow

Each layer uses different blend modes (`overlay`, `screen`, `multiply`) to create the complex interference patterns you see in real materials.

### 4. 3D Perspective Transforms

The surface responds to mouse movement with subtle 3D transforms:

```javascript
const transform = `
  perspective(1000px)
  rotateX(${(mousePosition.y - 0.5) * 20}deg)
  rotateY(${(mousePosition.x - 0.5) * 20}deg)
  scale(1.05)
`
```text

This makes the surface feel like a physical object you're manipulating.

## The HDR Difference

On an HDR-capable display (MacBook Pro, Studio Display), the difference is striking:

**Standard RGB**: Colors feel flat, muted, obviously digital
**HDR Range**: Colors pop off the screen, feel genuinely metallic

The effect is so convincing that people reach out to touch the screen.

## Implementation Challenges

### Performance Optimization

Real-time gradient generation is expensive. I optimized by:

- Caching gradient calculations when mouse isn't moving
- Using `transform` properties for hardware acceleration
- Limiting animation frame rates based on user interaction

### Display Detection

Not all displays support HDR. The experience gracefully degrades:

```javascript
const supportsHDR = window.matchMedia('(dynamic-range: high)').matches
const intensity = supportsHDR ? 2.5 : 1.0
```text

### Cross-Platform Compatibility

HDR support varies wildly across devices. The experiment works everywhere but shines on capable displays.

## Why This Matters

This isn't just about pretty effects. HDR displays represent a fundamental shift in what's possible with web interfaces.

**We've been designing for artificial limitations**—the sRGB color space—for 30 years. HDR removes those constraints.

Imagine:

- **UI elements that feel genuinely metallic or glass-like**
- **Photography portfolios that show true dynamic range**
- **Data visualizations with brightness encoding**
- **Games with realistic lighting that actually hurts your eyes**

## The Future of Visual Interfaces

HDR is still early. Most displays don't support it, most designers don't think about it, and most developers don't know how to use it.

**But that's exactly why now is the time to experiment.**

The developers who understand HDR today will be building the interfaces everyone else copies tomorrow.

Try the [HDR holographic experiment](/experiments/hdr-holographic-foil) if you have an HDR display. If you don't? Well, that's a good reason to upgrade.

The future of interfaces isn't just about new interaction patterns or faster performance. It's about breaking through the visual barriers we've accepted for decades.

**Your display finally caught up to your imagination. Time to use it.**
````
