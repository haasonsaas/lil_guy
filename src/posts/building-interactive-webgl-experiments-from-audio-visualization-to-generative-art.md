---
author: Jonathan Haas
pubDate: '2025-06-19'
title: >-
  Building Interactive WebGL Experiments: From Audio Visualization to Generative
  Art
description: >-
  How I built 5 immersive WebGL experiments showcasing real-time graphics,
  physics simulations, and algorithmic creativity
featured: true
draft: false
tags:
  - webgl
  - graphics
  - creative-coding
series:
  name: WebGL & Graphics
  part: 1
---

I've always been fascinated by the intersection of code and creativity. Recently, I embarked on an ambitious project to expand my blog's [experiments section](/experiments) with five new interactive WebGL experiences that push the boundaries of what's possible in a web browser.

From real-time audio visualization to gravitational physics simulations, each experiment explores different aspects of computational creativity. Here's the story of how I built them and what I learned along the way.

## The Vision: Making Math Beautiful

The goal was simple yet ambitious: create immersive, educational experiences that make complex mathematical and physical concepts accessible through interaction. Each experiment needed to be:

- **Performant** - Running smoothly at 60fps on modern devices
- **Educational** - Teaching concepts through hands-on exploration
- **Beautiful** - Visually stunning enough to captivate users
- **Accessible** - Intuitive controls with comprehensive documentation

## The Experiments

### 1. Audio Visualizer: Making Sound Visible

**[Try it here →](/audio-visualizer)**

The audio visualizer transforms music into immersive 3D graphics using the Web Audio API and WebGL. It supports multiple input sources (file upload, microphone) and offers four distinct visualization modes.

````javascript
// Core audio analysis loop
const analyser = audioContext.createAnalyser()
analyser.fftSize = 256
const dataArray = new Uint8Array(analyser.frequencyBinCount)

function render() {
  analyser.getByteFrequencyData(dataArray)

  // Transform frequency data into 3D geometry
  for (let i = 0; i < barCount; i++) {
    const frequency =
      dataArray[Math.floor((i * dataArray.length) / barCount)] / 255
    // Create vertex data for 3D bars
    positions.push(x, frequency * height, z)
  }
}
```text

**Key Challenges:**

- **Cross-browser compatibility** - WebKit prefixes for older Safari versions
- **Performance optimization** - Efficient vertex buffer updates for smooth animation
- **Beat detection** - Implementing real-time beat detection for reactive visuals

The most rewarding aspect was seeing users upload their favorite songs and watch them come alive in 3D space. The circular visualization mode, in particular, creates mesmerizing mandala-like patterns that pulse with the music.

### 2. Ray Marching Explorer: Rendering the Impossible

**[Try it here →](/ray-marching)**

Ray marching enables rendering complex 3D scenes entirely in fragment shaders using signed distance functions (SDFs). This technique allows for impossible geometries and real-time CSG operations.

```glsl
// Ray marching core loop
float rayMarch(vec3 ro, vec3 rd) {
  float dO = 0.0;

  for(int i = 0; i < MAX*STEPS; i++) {
    vec3 p = ro + rd * dO;
    float dS = getSceneDist(p);  // SDF evaluation
    dO += dS;
    if(dO > MAX*DIST || dS < SURF*DIST) break;
  }

  return dO;
}

// Infinite fractal geometry
float sdMenger(vec3 p) {
  float d = sdBox(p, vec3(1.0));
  float s = 1.0;
  for(int m = 0; m < 4; m++) {
    vec3 a = mod(p * s, 2.0) - 1.0;
    s *= 3.0;
    vec3 r = abs(1.0 - 3.0 * abs(a));
    float c = (min(min(max(r.x,r.y), max(r.y,r.z)), max(r.z,r.x)) - 1.0) / s;
    d = max(d, c);
  }
  return d;
}
```text

**Technical Highlights:**

- **PBR materials** - Implementing physically-based rendering in real-time
- **Soft shadows** - Using ray marching for realistic shadow computation
- **Infinite detail** - Fractal geometry with boundless zoom capabilities

The Menger sponge scene became a particular favorite - users can explore infinite fractal detail by moving the camera, revealing the mathematical beauty of self-similar structures.

### 3. N-Body Simulation: Orbital Mechanics in Action

**[Try it here →](/n-body)**

This gravitational physics simulation demonstrates Newton's laws through interactive celestial mechanics. Users can create their own solar systems and watch gravitational interactions unfold in real-time.

```javascript
// Gravitational force calculation
const calculateForce = (body1, body2) => {
  const dx = body2.x - body1.x
  const dy = body2.y - body1.y
  const distSq = dx * dx + dy * dy
  const dist = Math.sqrt(distSq)

  // Prevent singularities at close distances
  const effectiveDist = Math.max(dist, body1.radius + body2.radius)
  const force = (G * body1.mass * body2.mass) / (effectiveDist * effectiveDist)

  return {
    fx: (force * dx) / effectiveDist,
    fy: (force * dy) / effectiveDist,
  }
}

// Verlet integration for stable orbits
body.vx += (fx / body.mass) * dt
body.vy += (fy / body.mass) * dt
body.x += body.vx * dt
body.y += body.vy * dt
```text

**Physics Features:**

- **Collision detection** - Bodies merge realistically when they collide
- **Lagrange points** - Demonstrating stable gravitational equilibrium
- **Trail visualization** - Orbital paths reveal the beauty of celestial mechanics

The most satisfying moment was implementing the binary star system preset and watching it create stable elliptical orbits that follow Kepler's laws perfectly.

### 4. Cellular Automata: Life in the Machine

**[Try it here →](/cellular-automata)**

From Conway's Game of Life to elementary cellular automata, this experiment explores how simple rules create complex emergent behaviors.

```javascript
// Conway's Game of Life rules
const updateLife = (grid, x, y) => {
  const neighbors = countNeighbors(grid, x, y)
  const alive = grid[y][x] === 1

  if (alive) {
    return neighbors === 2 || neighbors === 3 ? 1 : 0 // Survive
  } else {
    return neighbors === 3 ? 1 : 0 // Birth
  }
}

// Langton's Ant - complex behavior from simple rules
const updateAnt = (grid, antX, antY, direction) => {
  const isBlack = grid[antY][antX] === 1

  // Flip current cell color
  grid[antY][antX] = isBlack ? 0 : 1

  // Turn based on cell color
  direction = isBlack ? (direction + 1) % 4 : (direction + 3) % 4

  // Move forward
  return moveAnt(antX, antY, direction)
}
```text

**Algorithmic Beauty:**

- **Multiple rule sets** - Conway's Life, Seeds, Brian's Brain, and more
- **Pattern library** - Pre-built gliders, oscillators, and spaceships
- **Interactive editing** - Click and drag to create custom patterns

Watching a simple glider gun spawn endless streams of gliders never gets old. It's a perfect demonstration of how computational systems can exhibit lifelike behaviors.

### 5. Generative Art Studio: Algorithms as Artists

**[Try it here →](/generative-art)**

The generative art studio combines multiple algorithmic techniques to create unique digital artwork. From Perlin noise landscapes to L-system plant growth, each algorithm offers infinite creative possibilities.

```javascript
// Perlin noise landscape generation
const generatePerlinArt = (ctx, canvas, time) => {
  for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      let noiseValue = 0
      let amplitude = 1
      let frequency = 1

      // Fractal Brownian Motion
      for (let i = 0; i < octaves; i++) {
        noiseValue +=
          perlin.noise(
            ((x + time * speed) * frequency) / scale,
            ((y + time * speed) * frequency) / scale
          ) * amplitude
        amplitude *= 0.5
        frequency *= 2
      }

      // Map noise to color
      const colorIndex = Math.floor(noiseValue * colors.length)
      setPixelColor(x, y, colors[colorIndex])
    }
  }
}

// L-System plant growth
const generateLSystem = (axiom, rules, iterations) => {
  let result = axiom

  for (let i = 0; i < iterations; i++) {
    let newResult = ''
    for (const char of result) {
      newResult += rules[char] || char
    }
    result = newResult
  }

  return result // "F[+F]F[-F]F[+F[+F]F[-F]F]F[-F[+F]F[-F]F]F[+F]F[-F]F"
}
```text

**Creative Algorithms:**

- **Perlin noise** - Organic, cloud-like patterns with temporal evolution
- **Flow fields** - Particle systems following mathematical vector fields
- **L-systems** - Recursive plant growth with natural branching patterns
- **Voronoi diagrams** - Cellular structures found throughout nature

The export functionality became essential - users create stunning artwork and want to save their creations. Some of the algorithmic outputs rival human-created art in complexity and beauty.

## Technical Architecture

All experiments share a common technical foundation built for performance and maintainability:

### WebGL Optimization

```javascript
// Efficient vertex buffer management
const updateVertexBuffer = (gl, buffer, data) => {
  gl.bindBuffer(gl.ARRAY*BUFFER, buffer)
  gl.bufferSubData(gl.ARRAY*BUFFER, 0, data) // Update, don't recreate
}

// Batch rendering for performance
const renderInstanced = (gl, program, instanceCount) => {
  gl.useProgram(program)
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, instanceCount)
}
```text

### Responsive Design

Each experiment adapts to different screen sizes and input methods:

- **Touch-friendly controls** on mobile devices
- **Keyboard shortcuts** for power users
- **Adaptive quality settings** based on device performance

### State Management

```javascript
// Centralized parameter management
const useExperimentState = (initialParams) => {
  const [params, setParams] = useState(initialParams)

  const updateParam = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }))
    // Trigger re-render with new parameters
    scheduleRender()
  }, [])

  return [params, updateParam]
}
```text

## Performance Optimizations

Building smooth 60fps experiences required careful optimization:

### GPU Memory Management

- **Vertex buffer pooling** - Reuse buffers instead of creating new ones
- **Texture atlasing** - Combine multiple textures into single GPU resources
- **Level-of-detail** - Reduce geometry complexity based on distance/importance

### CPU-GPU Load Balancing

```javascript
// Efficient compute-intensive operations
const updatePhysics = (bodies, deltaTime) => {
  // Use Web Workers for complex calculations
  if (bodies.length > 1000) {
    return physicsWorker.postMessage({ bodies, deltaTime })
  }

  // Simple calculations on main thread
  return updateBodiesSync(bodies, deltaTime)
}
```text

### Memory Leak Prevention

```javascript
// Cleanup pattern for WebGL resources
useEffect(() => {
  const cleanup = initWebGL()

  return () => {
    // Critical: clean up GPU resources
    gl.deleteBuffer(vertexBuffer)
    gl.deleteProgram(shaderProgram)
    gl.deleteTexture(texture)

    // Stop animation loops
    cancelAnimationFrame(animationId)
  }
}, [])
```text

## Lessons Learned

### 1. Start Simple, Iterate Fast

My initial ray marching implementation was overly complex. Starting with basic sphere rendering and gradually adding features led to cleaner, more maintainable code.

### 2. User Testing is Essential

The cellular automata controls felt intuitive to me but confused users. Adding visual feedback and tooltips dramatically improved the experience.

### 3. Performance Matters More Than Features

A smooth 30fps experience beats a choppy 60fps one with more visual effects. Frame rate consistency trumps peak performance.

### 4. Documentation Drives Adoption

The experiments with comprehensive explanations see 3x more engagement than those without. Users want to understand what they're experiencing.

## What's Next?

These five experiments are just the beginning. I'm already planning:

- **Fluid dynamics simulation** - Real-time fluid flow with interactive obstacles
- **L-system 3D trees** - Extending plant growth algorithms into three dimensions
- **Shader art tools** - A visual programming interface for fragment shaders
- **VR compatibility** - Adapting experiments for WebXR immersive experiences

## Try Them Yourself

All five experiments are live on my [experiments page](/experiments):

- **[Audio Visualizer](/audio-visualizer)** - Transform your music into 3D art
- **[Ray Marching Explorer](/ray-marching)** - Journey through impossible geometries
- **[N-Body Simulation](/n-body)** - Create your own solar systems
- **[Cellular Automata](/cellular-automata)** - Witness digital life evolve
- **[Generative Art Studio](/generative-art)** - Become an algorithmic artist

Each experiment includes comprehensive controls, educational descriptions, and export functionality. The source code follows modern React patterns with TypeScript, making it a great reference for anyone interested in WebGL development.

## The Bigger Picture

These experiments represent more than just technical achievements - they're bridges between complex mathematical concepts and human intuition. When someone watches a cellular automaton evolve or creates their first ray-marched scene, they're experiencing mathematics as art.

The web browser has become an incredibly powerful platform for interactive experiences. With WebGL, Web Audio API, and modern JavaScript, we can create experiences that rival native applications while remaining instantly accessible to anyone with an internet connection.

Whether you're a developer curious about graphics programming, an artist interested in algorithmic creativity, or someone who simply enjoys beautiful interactive experiences, these experiments offer something to explore.

*What will you create with the infinite canvas of mathematics and code?_
````
