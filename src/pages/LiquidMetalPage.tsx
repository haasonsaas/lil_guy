import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Droplets, Zap, Sliders, RotateCcw, Info } from 'lucide-react'

interface FluidPoint {
  x: number
  y: number
  vx: number
  vy: number
  pressure: number
  density: number
}

export default function LiquidMetalPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0, isDown: false })
  const fluidPointsRef = useRef<FluidPoint[]>([])

  const [viscosity, setViscosity] = useState([0.8])
  const [surfaceTension, setSurfaceTension] = useState([0.6])
  const [metalness, setMetalness] = useState([0.9])
  const [rippleIntensity, setRippleIntensity] = useState([1.2])
  const [animationSpeed, setAnimationSpeed] = useState([1.0])
  const [enableReflections, setEnableReflections] = useState(true)
  const [enablePhysics, setEnablePhysics] = useState(true)
  const [isInteracting, setIsInteracting] = useState(false)

  // Initialize fluid simulation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize fluid points in a grid
    const initFluid = () => {
      const points: FluidPoint[] = []
      const spacing = 8
      const cols = Math.floor(canvas.offsetWidth / spacing)
      const rows = Math.floor(canvas.offsetHeight / spacing)

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          points.push({
            x: i * spacing + spacing / 2,
            y: j * spacing + spacing / 2,
            vx: 0,
            vy: 0,
            pressure: 0,
            density: 1,
          })
        }
      }
      fluidPointsRef.current = points
    }

    initFluid()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  // Mouse interaction
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
    }

    const handleMouseDown = () => {
      mouseRef.current.isDown = true
      setIsInteracting(true)
    }

    const handleMouseUp = () => {
      mouseRef.current.isDown = false
      setIsInteracting(false)
    }

    const handleMouseLeave = () => {
      mouseRef.current.isDown = false
      setIsInteracting(false)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastTime = 0
    const ripples: Array<{
      x: number
      y: number
      radius: number
      intensity: number
      life: number
    }> = []

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) * 0.001 * animationSpeed[0]
      lastTime = currentTime

      // Clear canvas
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      // Create metallic background
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.offsetWidth,
        canvas.offsetHeight
      )
      const baseHue = (currentTime * 0.02) % 360
      gradient.addColorStop(
        0,
        `hsl(${baseHue}, 20%, ${20 + metalness[0] * 30}%)`
      )
      gradient.addColorStop(
        0.5,
        `hsl(${baseHue + 30}, 30%, ${30 + metalness[0] * 40}%)`
      )
      gradient.addColorStop(
        1,
        `hsl(${baseHue + 60}, 15%, ${15 + metalness[0] * 25}%)`
      )

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      if (enablePhysics) {
        // Update fluid simulation
        const points = fluidPointsRef.current
        const mouse = mouseRef.current

        points.forEach((point, i) => {
          // Mouse interaction
          if (mouse.isDown) {
            const dx = point.x - mouse.x
            const dy = point.y - mouse.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const influence = Math.max(0, 1 - dist / 100)

            if (influence > 0) {
              const force = influence * rippleIntensity[0] * 0.5
              point.vx += (dx / dist) * force * deltaTime
              point.vy += (dy / dist) * force * deltaTime

              // Create ripple
              if (Math.random() < 0.1) {
                ripples.push({
                  x: point.x,
                  y: point.y,
                  radius: 0,
                  intensity: influence * rippleIntensity[0],
                  life: 1.0,
                })
              }
            }
          }

          // Apply viscosity (damping)
          point.vx *= 1 - viscosity[0] * 0.02
          point.vy *= 1 - viscosity[0] * 0.02

          // Surface tension (pull towards rest position)
          const restX = (i % Math.floor(canvas.offsetWidth / 8)) * 8 + 4
          const restY =
            Math.floor(i / Math.floor(canvas.offsetWidth / 8)) * 8 + 4
          const tension = surfaceTension[0] * 0.01

          point.vx += (restX - point.x) * tension * deltaTime
          point.vy += (restY - point.y) * tension * deltaTime

          // Update position
          point.x += point.vx * deltaTime * 60
          point.y += point.vy * deltaTime * 60
        })

        // Draw fluid surface using metaballs
        if (points.length > 0) {
          const imageData = ctx.createImageData(
            canvas.offsetWidth,
            canvas.offsetHeight
          )
          const data = imageData.data

          for (let x = 0; x < canvas.offsetWidth; x += 2) {
            for (let y = 0; y < canvas.offsetHeight; y += 2) {
              let value = 0

              // Calculate metaball influence
              points.forEach((point) => {
                const dx = x - point.x
                const dy = y - point.y
                const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
                value += 100 / (dist * dist)
              })

              if (value > 1) {
                const intensity = Math.min(value / 5, 1)
                const metallic = metalness[0]

                // Metallic color calculation
                const baseColor = 150 + intensity * 105
                const r = baseColor * (0.7 + metallic * 0.3)
                const g = baseColor * (0.8 + metallic * 0.2)
                const b = baseColor * (0.9 + metallic * 0.1)

                // Add some color variation based on position
                const hueShift = Math.sin(x * 0.01 + currentTime * 0.001) * 20
                const finalR = Math.min(255, r + hueShift)
                const finalG = Math.min(255, g)
                const finalB = Math.min(255, b - hueShift * 0.5)

                // Draw 2x2 pixel blocks for performance
                for (let px = 0; px < 2 && x + px < canvas.offsetWidth; px++) {
                  for (
                    let py = 0;
                    py < 2 && y + py < canvas.offsetHeight;
                    py++
                  ) {
                    const pixelIndex =
                      ((y + py) * canvas.offsetWidth + (x + px)) * 4
                    data[pixelIndex] = finalR
                    data[pixelIndex + 1] = finalG
                    data[pixelIndex + 2] = finalB
                    data[pixelIndex + 3] = 255 * intensity
                  }
                }
              }
            }
          }

          ctx.putImageData(imageData, 0, 0)
        }
      }

      // Draw and update ripples
      ripples.forEach((ripple, index) => {
        ripple.radius += ripple.intensity * deltaTime * 100
        ripple.life -= deltaTime * 2

        if (ripple.life > 0) {
          ctx.beginPath()
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.life * ripple.intensity * 0.3})`
          ctx.lineWidth = 2
          ctx.stroke()

          if (enableReflections) {
            // Add inner reflection ring
            ctx.beginPath()
            ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(200, 220, 255, ${ripple.life * ripple.intensity * 0.2})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        } else {
          ripples.splice(index, 1)
        }
      })

      // Add environmental reflections
      if (enableReflections) {
        const time = currentTime * 0.001
        ctx.globalCompositeOperation = 'screen'
        ctx.globalAlpha = 0.1

        for (let i = 0; i < 3; i++) {
          const x =
            (Math.sin(time * 0.5 + i * 2) * 0.3 + 0.5) * canvas.offsetWidth
          const y =
            (Math.cos(time * 0.3 + i * 1.5) * 0.3 + 0.5) * canvas.offsetHeight

          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 100)
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

          ctx.fillStyle = gradient
          ctx.fillRect(x - 100, y - 100, 200, 200)
        }

        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    viscosity,
    surfaceTension,
    metalness,
    rippleIntensity,
    animationSpeed,
    enableReflections,
    enablePhysics,
  ])

  const resetSimulation = () => {
    fluidPointsRef.current = []
    // Re-initialize will happen on next render
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-slate-400 via-gray-300 to-zinc-400 bg-clip-text text-transparent">
            Liquid Metal Surface
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            Interactive T-1000 style liquid metal simulation with realistic
            surface tension and ripples
          </p>
          <p className="text-sm text-gray-500">
            Click and drag to disturb the surface • Watch the metal flow and
            settle
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Display */}
          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full aspect-square rounded-lg border border-gray-700 cursor-crosshair"
                style={{
                  background:
                    'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                  boxShadow: isInteracting
                    ? '0 0 30px rgba(156, 163, 175, 0.5)'
                    : '0 0 20px rgba(107, 114, 128, 0.3)',
                  transition: 'box-shadow 0.3s ease',
                }}
              />

              {/* Status indicators */}
              <div className="absolute top-4 left-4 space-y-2">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  <Droplets className="w-3 h-3 mr-1" />
                  Fluid Sim
                </Badge>
                {isInteracting && (
                  <Badge variant="default" className="bg-blue-600">
                    <Zap className="w-3 h-3 mr-1" />
                    Interacting
                  </Badge>
                )}
              </div>

              {/* Physics stats */}
              <div className="absolute top-4 right-4 text-xs text-gray-400 bg-black/50 rounded px-2 py-1">
                <div>Points: {fluidPointsRef.current.length}</div>
                <div>Physics: {enablePhysics ? 'ON' : 'OFF'}</div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Button onClick={resetSimulation} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Surface
              </Button>
            </div>
          </Card>

          {/* Controls */}
          <Card className="bg-gray-900 border-gray-800 p-6 space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-gray-400" />
                <span>Fluid Properties</span>
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="physics-toggle"
                    className="flex items-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Physics Simulation</span>
                  </Label>
                  <Switch
                    id="physics-toggle"
                    checked={enablePhysics}
                    onCheckedChange={setEnablePhysics}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="reflections-toggle"
                    className="flex items-center space-x-2"
                  >
                    <Droplets className="w-4 h-4" />
                    <span>Environmental Reflections</span>
                  </Label>
                  <Switch
                    id="reflections-toggle"
                    checked={enableReflections}
                    onCheckedChange={setEnableReflections}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Viscosity: {(viscosity[0] * 100).toFixed(0)}%</Label>
                  <Slider
                    value={viscosity}
                    onValueChange={setViscosity}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Higher values make the metal flow slower
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>
                    Surface Tension: {(surfaceTension[0] * 100).toFixed(0)}%
                  </Label>
                  <Slider
                    value={surfaceTension}
                    onValueChange={setSurfaceTension}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    How strongly the surface wants to return to rest
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Metalness: {(metalness[0] * 100).toFixed(0)}%</Label>
                  <Slider
                    value={metalness}
                    onValueChange={setMetalness}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Controls the metallic appearance and reflectivity
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>
                    Ripple Intensity: {rippleIntensity[0].toFixed(1)}x
                  </Label>
                  <Slider
                    value={rippleIntensity}
                    onValueChange={setRippleIntensity}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Strength of disturbances from mouse interaction
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>
                    Animation Speed: {animationSpeed[0].toFixed(1)}x
                  </Label>
                  <Slider
                    value={animationSpeed}
                    onValueChange={setAnimationSpeed}
                    min={0.1}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-4 h-4 text-blue-400" />
                <h4 className="font-semibold">About the Simulation</h4>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                This experiment simulates liquid metal behavior using metaball
                fluid dynamics and real-time surface tension calculations. The
                metallic appearance is achieved through gradient mapping and
                environmental reflections.
              </p>

              <div className="space-y-2 text-xs text-gray-500">
                <p>• Click and drag to create disturbances</p>
                <p>• Watch how surface tension pulls the metal back</p>
                <p>• Viscosity controls how thick the metal feels</p>
                <p>• Reflections simulate environmental lighting</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
