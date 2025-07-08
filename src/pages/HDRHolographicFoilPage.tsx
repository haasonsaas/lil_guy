import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ExperimentErrorBoundary } from '@/components/ExperimentErrorBoundary'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Sparkles, Palette, Zap, Move3D } from 'lucide-react'

function HDRHolographicFoilPageContent() {
  const [intensity, setIntensity] = useState([1.5])
  const [hueShift, setHueShift] = useState([0])
  const [metalness, setMetalness] = useState([0.8])
  const [roughness, setRoughness] = useState([0.2])
  const [animationSpeed, setAnimationSpeed] = useState([1])
  const [enableHDR, setEnableHDR] = useState(true)
  const [enableAnimation, setEnableAnimation] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        setMousePosition({ x, y })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Calculate HDR color values that exceed standard RGB range
  const getHDRColor = (base: number, boost: number) => {
    return enableHDR ? base * boost : base
  }

  // Generate holographic gradient based on parameters
  const generateHolographicGradient = () => {
    const baseIntensity = intensity[0]
    const hue = hueShift[0]
    const metal = metalness[0]

    // HDR color values that can exceed 255 in RGB space
    const colors = [
      `hsl(${(0 + hue) % 360}, 100%, ${getHDRColor(50, baseIntensity)}%)`,
      `hsl(${(60 + hue) % 360}, 100%, ${getHDRColor(60, baseIntensity * 1.2)}%)`,
      `hsl(${(180 + hue) % 360}, 100%, ${getHDRColor(55, baseIntensity * 1.5)}%)`,
      `hsl(${(240 + hue) % 360}, 100%, ${getHDRColor(50, baseIntensity * 1.3)}%)`,
      `hsl(${(300 + hue) % 360}, 100%, ${getHDRColor(55, baseIntensity * 1.4)}%)`,
      `hsl(${(0 + hue) % 360}, 100%, ${getHDRColor(50, baseIntensity)}%)`,
    ]

    const angle = mousePosition.x * 360
    const gradientColors = colors
      .map((color, i) => `${color} ${i * (100 / (colors.length - 1))}%`)
      .join(', ')

    return `linear-gradient(${angle}deg, ${gradientColors})`
  }

  const foilStyle: React.CSSProperties = {
    background: generateHolographicGradient(),
    filter: `contrast(${1 + metalness[0]}) brightness(${enableHDR ? intensity[0] : 1})`,
    transform: `
      perspective(1000px)
      rotateX(${(mousePosition.y - 0.5) * 20}deg)
      rotateY(${(mousePosition.x - 0.5) * 20}deg)
      scale(1.05)
    `,
    transformStyle: 'preserve-3d',
    transition: 'transform 0.1s ease-out',
  }

  const overlayStyle: React.CSSProperties = {
    background: `
      repeating-linear-gradient(
        ${45 + mousePosition.x * 90}deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, ${roughness[0] * 0.3}) 2px,
        rgba(255, 255, 255, ${roughness[0] * 0.3}) 4px
      ),
      repeating-linear-gradient(
        ${-45 + mousePosition.x * 90}deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, ${roughness[0] * 0.2}) 2px,
        rgba(255, 255, 255, ${roughness[0] * 0.2}) 4px
      )
    `,
    mixBlendMode: 'overlay' as const,
  }

  const shimmerStyle: React.CSSProperties = {
    background: `radial-gradient(
      circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%,
      rgba(255, 255, 255, ${enableHDR ? intensity[0] * 0.8 : 0.4}),
      transparent 40%
    )`,
    mixBlendMode: 'screen' as const,
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            HDR Holographic Foil Effect
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            Experience true HDR colors that exceed standard RGB range on
            compatible displays
          </p>
          <p className="text-sm text-gray-500">
            Move your mouse over the surface to see the interactive holographic
            effect
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Display */}
          <Card className="bg-gray-900 border-gray-800 p-8">
            <div
              ref={containerRef}
              className="relative w-full aspect-square rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#000',
                boxShadow: enableHDR
                  ? `0 0 100px rgba(138, 43, 226, ${intensity[0] * 0.5})`
                  : '0 0 50px rgba(138, 43, 226, 0.3)',
              }}
            >
              <motion.div
                className="absolute inset-0"
                style={foilStyle}
                animate={
                  enableAnimation
                    ? {
                        filter: [
                          `contrast(${1 + metalness[0]}) brightness(${enableHDR ? intensity[0] : 1}) hue-rotate(0deg)`,
                          `contrast(${1 + metalness[0]}) brightness(${enableHDR ? intensity[0] * 1.1 : 1.1}) hue-rotate(180deg)`,
                          `contrast(${1 + metalness[0]}) brightness(${enableHDR ? intensity[0] : 1}) hue-rotate(360deg)`,
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 10 / animationSpeed[0],
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              {/* Diffraction pattern overlay */}
              <div className="absolute inset-0" style={overlayStyle} />

              {/* HDR shimmer effect */}
              <div className="absolute inset-0" style={shimmerStyle} />

              {/* Sparkle particles */}
              {enableAnimation &&
                Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      boxShadow: enableHDR
                        ? `0 0 ${10 * intensity[0]}px rgba(255, 255, 255, ${intensity[0]})`
                        : '0 0 10px rgba(255, 255, 255, 1)',
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
            </div>

            <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${enableHDR ? 'bg-green-500' : 'bg-yellow-500'}`}
                />
                <span>{enableHDR ? 'HDR Active' : 'SDR Mode'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Move3D className="w-4 h-4" />
                <span>Mouse Interactive</span>
              </div>
            </div>
          </Card>

          {/* Controls */}
          <Card className="bg-gray-900 border-gray-800 p-6 space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Palette className="w-5 h-5 text-purple-400" />
                <span>Effect Controls</span>
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="hdr-toggle"
                    className="flex items-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>HDR Mode</span>
                  </Label>
                  <Switch
                    id="hdr-toggle"
                    checked={enableHDR}
                    onCheckedChange={setEnableHDR}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="animation-toggle"
                    className="flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Animate</span>
                  </Label>
                  <Switch
                    id="animation-toggle"
                    checked={enableAnimation}
                    onCheckedChange={setEnableAnimation}
                  />
                </div>

                <div className="space-y-2">
                  <Label>HDR Intensity: {intensity[0].toFixed(1)}x</Label>
                  <Slider
                    value={intensity}
                    onValueChange={setIntensity}
                    min={1}
                    max={3}
                    step={0.1}
                    disabled={!enableHDR}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hue Shift: {hueShift[0]}°</Label>
                  <Slider
                    value={hueShift}
                    onValueChange={setHueShift}
                    min={0}
                    max={360}
                    step={1}
                    className="w-full"
                  />
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
                </div>

                <div className="space-y-2">
                  <Label>
                    Surface Roughness: {(roughness[0] * 100).toFixed(0)}%
                  </Label>
                  <Slider
                    value={roughness}
                    onValueChange={setRoughness}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Animation Speed: {animationSpeed[0].toFixed(1)}x
                  </Label>
                  <Slider
                    value={animationSpeed}
                    onValueChange={setAnimationSpeed}
                    min={0.1}
                    max={3}
                    step={0.1}
                    disabled={!enableAnimation}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <h4 className="font-semibold mb-2">About HDR Effects</h4>
              <p className="text-sm text-gray-400 mb-3">
                On HDR-capable displays, this effect uses extended color gamut
                and brightness values that exceed standard RGB range, creating
                more vibrant and realistic metallic surfaces.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIntensity([2.0])
                  setHueShift([0])
                  setMetalness([0.85])
                  setRoughness([0.15])
                  setAnimationSpeed([1.5])
                  setEnableHDR(true)
                  setEnableAnimation(true)
                }}
              >
                Reset to Optimal HDR
              </Button>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Best viewed on HDR displays (MacBook Pro, Studio Display)</p>
              <p>• Effect intensity scales with display capabilities</p>
              <p>• Mouse movement creates dynamic light reflections</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function HDRHolographicFoilPage() {
  return (
    <ExperimentErrorBoundary experimentName="HDR Holographic Foil">
      <HDRHolographicFoilPageContent />
    </ExperimentErrorBoundary>
  )
}
