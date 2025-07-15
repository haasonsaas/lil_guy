import React, { useEffect, useRef, useState } from 'react'
import Layout from '@/components/Layout'
import { ExperimentErrorBoundary } from '@/components/ExperimentErrorBoundary'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Code2, Play, Pause, RotateCcw, Settings, Zap, FileCode, Binary } from 'lucide-react'
import { motion } from 'framer-motion'

// Code snippets from various parts of the codebase
const codeSnippets = [
  // TypeScript/React
  `const [isPlaying, setIsPlaying] = useState(true);`,
  `import { motion } from 'framer-motion';`,
  `export default function CodeRainPage() {`,
  `useEffect(() => { render(); }, []);`,
  `const handleMouseMove = (event: React.MouseEvent) => {`,
  `return <Layout><Canvas /></Layout>;`,
  `interface BlogPost { title: string; content: string; }`,
  `const posts = await Promise.all(promises);`,

  // Functions and logic
  `function calculateOptimalFontSize(text: string): number {`,
  `const fontSize = Math.min(width, height) * 0.15;`,
  `if (!gl || !program || !canvas) return;`,
  `gl.uniform1f(timeLocation, currentTime);`,
  `requestAnimationFrame(render);`,

  // WebGL/GLSL
  `precision mediump float;`,
  `uniform float u_time;`,
  `vec3 color = mix(u_color1, u_color2, n1);`,
  `gl_FragColor = vec4(color, 1.0);`,
  `attribute vec2 a_position;`,

  // CSS/Styling
  `className="grid md:grid-cols-3 gap-6"`,
  `<Card className="p-6 hover:shadow-lg">`,
  `transition={{ duration: 0.6 }}`,
  `bg-gradient-to-br from-primary/5`,

  // Blog/Content
  `# Building My Blog`,
  `tags: ["TypeScript", "React", "WebGL"]`,
  `date: "2024-01-15"`,
  `description: "A technical deep dive"`,

  // Utilities
  `export const formatDate = (date: string) =>`,
  `const slug = title.toLowerCase().replace(/\\s+/g, '-');`,
  `Math.random() * canvas.height`,
  `ctx.fillStyle = \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;`,
]

interface MatrixChar {
  x: number
  y: number
  speed: number
  chars: string[]
  currentIndex: number
  opacity: number
  color: { r: number; g: number; b: number }
}

function CodeRainPageContent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const matrixCharsRef = useRef<MatrixChar[]>([])
  const lastTimeRef = useRef<number>(0)

  const [isPlaying, setIsPlaying] = useState(true)
  const [density, setDensity] = useState([30]) // Number of columns
  const [speed, setSpeed] = useState([1.0])
  const [colorScheme, setColorScheme] = useState(0)
  const [showCode, setShowCode] = useState(true)
  const [fontSize, setFontSize] = useState([16])

  const colorSchemes = [
    { name: 'Classic Matrix', color: { r: 0, g: 255, b: 70 } },
    { name: 'Blue Code', color: { r: 0, g: 150, b: 255 } },
    { name: 'Golden', color: { r: 255, g: 215, b: 0 } },
    { name: 'Cyberpunk', color: { r: 255, g: 0, b: 255 } },
    { name: 'Terminal', color: { r: 0, g: 255, b: 255 } },
  ]

  const initializeMatrix = (canvas: HTMLCanvasElement) => {
    const columnWidth = fontSize[0]
    const numColumns = Math.floor(canvas.width / columnWidth)
    const actualColumns = Math.floor(numColumns * (density[0] / 100))

    matrixCharsRef.current = []

    for (let i = 0; i < actualColumns; i++) {
      // Distribute columns evenly across the canvas
      const x = (i / actualColumns) * canvas.width + columnWidth / 2

      // Get a random code snippet and split it into characters
      const snippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)]
      const chars = showCode
        ? snippet.split('')
        : '0123456789ABCDEF'.split('').sort(() => Math.random() - 0.5)

      matrixCharsRef.current.push({
        x,
        y: Math.random() * -canvas.height,
        speed: (0.5 + Math.random() * 0.5) * speed[0],
        chars,
        currentIndex: 0,
        opacity: 1,
        color: colorSchemes[colorScheme].color,
      })
    }
  }

  const render = (timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const deltaTime = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    // Resize canvas if needed
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
      initializeMatrix(canvas)
    }

    // Clear with trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Update and draw characters
    ctx.font = `${fontSize[0]}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    matrixCharsRef.current.forEach((char) => {
      // Update position
      char.y += char.speed * deltaTime * 0.1

      // Reset if off screen
      if (char.y > canvas.height + 100) {
        char.y = -100
        char.currentIndex = 0
        // Get new code snippet
        const snippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)]
        char.chars = showCode
          ? snippet.split('')
          : '0123456789ABCDEF'.split('').sort(() => Math.random() - 0.5)
      }

      // Draw the trail of characters
      const charsToShow = 20
      for (let i = 0; i < charsToShow && i <= char.currentIndex; i++) {
        const charIndex = Math.min(i, char.chars.length - 1)
        const yPos = char.y - i * fontSize[0] * 1.2

        if (yPos > -fontSize[0] && yPos < canvas.height + fontSize[0]) {
          // Calculate opacity based on position in trail
          const trailOpacity = 1 - i / charsToShow
          const fadeOpacity = i === 0 ? 1 : trailOpacity * 0.8

          // Brighter color for the leading character
          const brightness = i === 0 ? 1.5 : 1
          const r = Math.min(255, char.color.r * brightness)
          const g = Math.min(255, char.color.g * brightness)
          const b = Math.min(255, char.color.b * brightness)

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${fadeOpacity})`
          ctx.fillText(char.chars[charIndex] || '', char.x, yPos)
        }
      }

      // Increment character index
      if (char.currentIndex < char.chars.length - 1) {
        char.currentIndex += 0.5
      }
    })

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(render)
    }
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      lastTimeRef.current = performance.now()
      render(performance.now())
    }
  }

  const reset = () => {
    const canvas = canvasRef.current
    if (canvas) {
      initializeMatrix(canvas)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    initializeMatrix(canvas)

    if (isPlaying) {
      lastTimeRef.current = performance.now()
      render(performance.now())
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isPlaying && !animationRef.current) {
      lastTimeRef.current = performance.now()
      render(performance.now())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density, fontSize, colorScheme, showCode])

  return (
    <Layout>
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Code2 className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-display font-semibold">Code Rain</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch your code cascade down the screen Matrix-style. Features real snippets from this
              very codebase.
            </p>
          </motion.div>

          {/* Canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mb-8"
          >
            <Card className="overflow-hidden bg-black">
              <canvas ref={canvasRef} className="w-full h-[70vh]" style={{ background: 'black' }} />

              {/* Overlay Controls */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={togglePlayPause}
                  className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  onClick={reset}
                  className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowCode(!showCode)}
                  className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
                >
                  {showCode ? <FileCode className="h-4 w-4" /> : <Binary className="h-4 w-4" />}
                </Button>
              </div>

              <div className="absolute top-4 right-4">
                <Badge
                  className="text-white border-white/20"
                  style={{
                    backgroundColor: `rgba(${colorSchemes[colorScheme].color.r}, ${colorSchemes[colorScheme].color.g}, ${colorSchemes[colorScheme].color.b}, 0.2)`,
                  }}
                >
                  {colorSchemes[colorScheme].name}
                </Badge>
              </div>
            </Card>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Controls
              </h3>

              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Density</label>
                  <Slider
                    value={density}
                    onValueChange={setDensity}
                    min={10}
                    max={100}
                    step={10}
                    className="mb-2"
                  />
                  <span className="text-xs text-muted-foreground">{density[0]}%</span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Speed</label>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="mb-2"
                  />
                  <span className="text-xs text-muted-foreground">{speed[0].toFixed(1)}x</span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Font Size</label>
                  <Slider
                    value={fontSize}
                    onValueChange={setFontSize}
                    min={12}
                    max={24}
                    step={2}
                    className="mb-2"
                  />
                  <span className="text-xs text-muted-foreground">{fontSize[0]}px</span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Color Scheme</label>
                  <Button
                    onClick={() => setColorScheme((prev) => (prev + 1) % colorSchemes.length)}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <Zap className="h-4 w-4" />
                    {colorSchemes[colorScheme].name}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid md:grid-cols-2 gap-6 mt-8"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                About the Code
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                The falling characters are actual code snippets from this website's codebase,
                including:
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• React components and hooks</li>
                <li>• TypeScript interfaces and types</li>
                <li>• WebGL shader code</li>
                <li>• CSS class names and styles</li>
                <li>• Blog post metadata</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Features
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • <strong>Real Code:</strong> Displays actual snippets from this codebase
                </li>
                <li>
                  • <strong>Trail Effect:</strong> Characters fade as they fall
                </li>
                <li>
                  • <strong>Dynamic Columns:</strong> Adjustable density of falling code
                </li>
                <li>
                  • <strong>Color Themes:</strong> Multiple color schemes to choose from
                </li>
                <li>
                  • <strong>Binary Mode:</strong> Switch between code and hex characters
                </li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </section>
    </Layout>
  )
}

export default function CodeRainPage() {
  return (
    <ExperimentErrorBoundary experimentName="Code Rain">
      <CodeRainPageContent />
    </ExperimentErrorBoundary>
  )
}
