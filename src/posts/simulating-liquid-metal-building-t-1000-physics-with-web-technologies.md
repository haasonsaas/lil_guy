---
author: Jonathan Haas
pubDate: '2025-06-19'
title: 'Simulating Liquid Metal: Building T-1000 Physics with Web Technologies'
description: >-
  Remember that scene in Terminator 2 where the T-1000 rises from the floor,
  liquid metal flowing seamlessly back into human form.
featured: false
draft: false
tags:
  - webgl
  - graphics
  - creative-coding
  - physics
---

Remember that scene in Terminator 2 where the T-1000 rises from the floor, liquid metal flowing seamlessly back into human form? That effect has haunted VFX artists—and inspired programmers—for decades.

I decided to build my own version using just web technologies.

## The Challenge of Liquid Metal

Liquid metal isn't just any fluid. It has unique properties that make it visually striking:

**Surface tension** pulls droplets into perfect spheres
**Metallic reflection** creates complex lighting interactions  
**Viscosity** makes it flow slower than water but faster than honey
**Cohesion** keeps separate blobs drawn to each other

Recreating these properties in real-time requires understanding both the physics and the computational shortcuts that make it possible.

## The Metaball Foundation

The secret to convincing liquid metal simulation is **metaballs**—a technique from the 1980s that creates organic, flowing surfaces.

### How Metaballs Work

Each "ball" in the simulation isn't actually a sphere. It's an **influence field** that affects nearby space:

````javascript
// Calculate influence at any point (x,y)
const influence = radius² / (distance² + small*offset)
```text

When you sample the entire canvas and add up all influences, areas with high values become "inside" the surface, creating smooth, organic shapes.

I built my [liquid metal experiment](/experiments/liquid-metal) using this principle. Here's the core algorithm:

```javascript
for (let x = 0; x < canvas.width; x += 2) {
  for (let y = 0; y < canvas.height; y += 2) {
    let totalInfluence = 0

    // Sum influence from all fluid points
    fluidPoints.forEach((point) => {
      const dx = x - point.x
      const dy = y - point.y
      const distanceSquared = dx * dx + dy * dy + 0.1
      totalInfluence += 100 / distanceSquared
    })

    // If influence exceeds threshold, we're "inside" the liquid
    if (totalInfluence > 1) {
      drawMetallicPixel(x, y, totalInfluence)
    }
  }
}
```text

The magic happens in that threshold check. By testing `totalInfluence > 1`, we create smooth boundaries between adjacent metaballs.

## Adding Real Physics

Metaballs give us the visual, but liquid metal needs to *behave* like liquid metal. That means implementing real fluid dynamics.

### Surface Tension

Real liquids minimize surface area. I simulate this by giving each fluid point a "rest position" and pulling it back:

```javascript
// Calculate rest position in a grid
const restX = (pointIndex % gridColumns) * spacing
const restY = Math.floor(pointIndex / gridColumns) * spacing

// Apply spring force toward rest position
const tension = surfaceTension * 0.01
point.vx += (restX - point.x) * tension * deltaTime
point.vy += (restY - point.y) * tension * deltaTime
```text

This creates the characteristic "rubber sheet" behavior where disturbed liquid wants to return to its original shape.

### Viscosity

Liquid metal flows slower than water. I simulate viscosity by damping velocity each frame:

```javascript
// Higher viscosity = more damping
point.vx *= 1 - viscosity * 0.02
point.vy *= 1 - viscosity * 0.02
```text

Simple but effective. High viscosity values make the metal feel thick and sluggish, low values make it feel thin and runny.

### Interactive Forces

The real magic happens when you interact with the surface. Mouse movement creates ripples:

```javascript
if (mouse.isDown) {
  fluidPoints.forEach((point) => {
    const dx = point.x - mouse.x
    const dy = point.y - mouse.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const influence = Math.max(0, 1 - distance / 100)

    if (influence > 0) {
      const force = influence * rippleIntensity * 0.5
      point.vx += (dx / distance) * force
      point.vy += (dy / distance) * force
    }
  })
}
```text

Each point within 100 pixels of the mouse gets pushed away, creating realistic ripple patterns.

## Rendering Realistic Metal

The physics creates organic shapes, but making them look like liquid metal requires careful rendering.

### Metallic Color Mapping

Real metal reflects its environment. I simulate this with dynamic color gradients:

```javascript
const baseColor = 150 + intensity * 105
const metallic = metalnessValue

// Metallic surfaces reflect more blue and less red
const r = baseColor * (0.7 + metallic * 0.3)
const g = baseColor * (0.8 + metallic * 0.2)
const b = baseColor * (0.9 + metallic * 0.1)

// Add environmental color variation
const hueShift = Math.sin(x * 0.01 + time * 0.001) * 20
const finalR = Math.min(255, r + hueShift)
const finalB = Math.min(255, b - hueShift * 0.5)
```text

This gives the metal a subtle color temperature shift across its surface, like real metal reflecting different light sources.

### Environmental Reflections

Static metal looks dead. I add moving reflections to simulate environmental lighting:

```javascript
// Create moving light sources
for (let i = 0; i < 3; i++) {
  const x = (Math.sin(time * 0.5 + i * 2) * 0.3 + 0.5) * canvas.width
  const y = (Math.cos(time * 0.3 + i * 1.5) * 0.3 + 0.5) * canvas.height

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, 100)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(x - 100, y - 100, 200, 200)
}
```text

These moving highlights create the illusion that the metal is reflecting a complex environment.

### Ripple Effects

When you disturb the surface, I add expanding ripple rings for visual feedback:

```javascript
// Create ripple on interaction
ripples.push({
  x: point.x,
  y: point.y,
  radius: 0,
  intensity: influence * rippleIntensity,
  life: 1.0,
})

// Animate ripples
ripples.forEach((ripple) => {
  ripple.radius += ripple.intensity * deltaTime * 100
  ripple.life -= deltaTime * 2

  // Draw expanding ring
  ctx.beginPath()
  ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.life * 0.3})`
  ctx.stroke()
})
```text

## Performance Optimization

Real-time fluid simulation is computationally expensive. Here's how I made it run at 60fps:

### Pixel Block Rendering

Instead of calculating every pixel, I render in 2x2 blocks:

```javascript
for (let x = 0; x < canvas.width; x += 2) {
  for (let y = 0; y < canvas.height; y += 2) {
    // Calculate once, apply to 4 pixels
    const influence = calculateMetaballInfluence(x, y)

    if (influence > threshold) {
      // Draw 2x2 block
      for (let px = 0; px < 2; px++) {
        for (let py = 0; py < 2; py++) {
          setPixel(x + px, y + py, color)
        }
      }
    }
  }
}
```text

This cuts rendering time by 75% with minimal visual impact.

### Adaptive Quality

When the user isn't interacting, I can reduce the simulation frequency:

```javascript
const targetFPS = isInteracting ? 60 : 30
const deltaTime = (currentTime - lastTime) * (targetFPS / 60)
```text

### Hardware Acceleration

All transforms use CSS `transform` properties instead of redrawing:

```javascript
// Fast: Hardware accelerated
element.style.transform = `translate(${x}px, ${y}px)`

// Slow: Forces repaint
element.style.left = `${x}px`
element.style.top = `${y}px`
```text

## The Uncanny Valley of Physics

The most challenging part wasn't the technical implementation—it was making the simulation *feel* right.

Real liquid metal has subtle behaviors that are hard to quantify:

- How quickly does surface tension pull droplets back together?
- What's the right balance between viscosity and responsiveness?
- How reflective should the surface be?

I spent hours tweaking parameters, watching reference footage, and getting feedback from users. The goal wasn't physical accuracy—it was **emotional accuracy**. Does it *feel_ like liquid metal?

## Beyond the T-1000

This technique isn't just for sci-fi effects. Metaball fluid simulation has practical applications:

**Data visualization**: Flowing connections between data points
**Interface design**: Organic morphing between UI states
**Generative art**: Evolving, breathing visual compositions
**Gaming**: Realistic water, lava, or magical effects

The core principles—influence fields, organic surfaces, real-time interaction—apply to any situation where you want smooth, flowing visuals.

## The Joy of Impossible Things

There's something deeply satisfying about implementing physics that don't exist in nature. Liquid metal is a fantasy—but by understanding real fluid dynamics and clever visual tricks, we can make that fantasy feel tangible.

Try the [liquid metal experiment](/experiments/liquid-metal) yourself. Click and drag the surface. Watch how it flows, settles, and reflects.

**The most interesting interfaces aren't bound by physical laws—they're inspired by them.**

What impossible thing will you make feel real?
````
