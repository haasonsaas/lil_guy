import React, { useCallback, useEffect, useRef, useState } from 'react'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Grid3x3,
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  Download,
  Zap,
  Info,
  Plus,
  Minus,
  Sparkles,
  Layers,
} from 'lucide-react'
import { motion } from 'framer-motion'

type AutomataType =
  | 'life'
  | 'seeds'
  | 'brian'
  | 'langton'
  | 'rule110'
  | 'rule30'

interface Pattern {
  name: string
  description: string
  cells: number[][]
  type: AutomataType
}

interface Rule {
  name: string
  description: string
  type: AutomataType
  surviveRules?: number[]
  birthRules?: number[]
}

const rules: Rule[] = [
  {
    name: "Conway's Game of Life",
    description: 'The classic cellular automaton',
    type: 'life',
    surviveRules: [2, 3],
    birthRules: [3],
  },
  {
    name: 'Seeds',
    description: 'Explosive growth patterns',
    type: 'seeds',
    surviveRules: [],
    birthRules: [2],
  },
  {
    name: "Brian's Brain",
    description: 'Three-state automaton with trails',
    type: 'brian',
  },
  {
    name: "Langton's Ant",
    description: 'Simple rules, complex behavior',
    type: 'langton',
  },
  {
    name: 'Rule 110',
    description: 'Elementary cellular automaton',
    type: 'rule110',
  },
  {
    name: 'Rule 30',
    description: 'Chaotic elementary automaton',
    type: 'rule30',
  },
]

export default function CellularAutomataPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridRef = useRef<Uint8Array | null>(null)
  const nextGridRef = useRef<Uint8Array | null>(null)
  const animationRef = useRef<number | null>(null)
  const generationRef = useRef(0)
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({
    x: 0,
    y: 0,
    isDown: false,
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [cellSize, setCellSize] = useState([4])
  const [speed, setSpeed] = useState([10])
  const [gridWidth, setGridWidth] = useState(0)
  const [gridHeight, setGridHeight] = useState(0)
  const [currentRule, setCurrentRule] = useState<AutomataType>('life')
  const [generation, setGeneration] = useState(0)
  const [population, setPopulation] = useState(0)
  const [brushSize, setBrushSize] = useState([1])
  const [showGrid, setShowGrid] = useState(true)
  const [colorScheme, setColorScheme] = useState(0)

  const frameCount = useRef(0)
  const lastUpdate = useRef(0)

  const patterns: Pattern[] = [
    {
      name: 'Glider',
      description: 'Moves diagonally',
      type: 'life',
      cells: [
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 1],
      ],
    },
    {
      name: 'Blinker',
      description: 'Period 2 oscillator',
      type: 'life',
      cells: [[1, 1, 1]],
    },
    {
      name: 'Toad',
      description: 'Period 2 oscillator',
      type: 'life',
      cells: [
        [0, 1, 1, 1],
        [1, 1, 1, 0],
      ],
    },
    {
      name: 'Beacon',
      description: 'Period 2 oscillator',
      type: 'life',
      cells: [
        [1, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 1],
      ],
    },
    {
      name: 'Pulsar',
      description: 'Period 3 oscillator',
      type: 'life',
      cells: [
        [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
      ],
    },
    {
      name: 'Glider Gun',
      description: 'Produces gliders',
      type: 'life',
      cells: [
        [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
          0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
        ],
        [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
        ],
        [
          1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        [
          1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1,
          0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
          0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
      ],
    },
  ]

  const colorSchemes = [
    {
      name: 'Classic',
      alive: '#ffffff',
      dead: '#000000',
      dying: '#666666',
      grid: '#222222',
    },
    {
      name: 'Ocean',
      alive: '#00ffff',
      dead: '#001133',
      dying: '#0066aa',
      grid: '#003366',
    },
    {
      name: 'Fire',
      alive: '#ffaa00',
      dead: '#220000',
      dying: '#ff4400',
      grid: '#440000',
    },
    {
      name: 'Nature',
      alive: '#00ff00',
      dead: '#001100',
      dying: '#008800',
      grid: '#003300',
    },
    {
      name: 'Neon',
      alive: '#ff00ff',
      dead: '#110011',
      dying: '#8800ff',
      grid: '#330033',
    },
  ]

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = Math.floor(canvas.width / cellSize[0])
    const height = Math.floor(canvas.height / cellSize[0])

    setGridWidth(width)
    setGridHeight(height)

    gridRef.current = new Uint8Array(width * height)
    nextGridRef.current = new Uint8Array(width * height)

    // Initialize for specific automata
    if (currentRule === 'langton') {
      // Place ant in center facing up
      const centerIndex = Math.floor(height / 2) * width + Math.floor(width / 2)
      gridRef.current[centerIndex] = 2 // 2 represents ant facing up
    }

    generationRef.current = 0
    setGeneration(0)
    updatePopulation()
  }, [cellSize, currentRule, updatePopulation])

  // Get cell index
  const getIndex = (x: number, y: number): number => {
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return -1
    return y * gridWidth + x
  }

  // Get cell value with wrapping
  const getCell = useCallback(
    (x: number, y: number): number => {
      const wrappedX = (x + gridWidth) % gridWidth
      const wrappedY = (y + gridHeight) % gridHeight
      const index = wrappedY * gridWidth + wrappedX
      return gridRef.current?.[index] || 0
    },
    [gridHeight, gridWidth]
  )

  // Set cell value
  const setCell = (x: number, y: number, value: number) => {
    const index = getIndex(x, y)
    if (index >= 0 && gridRef.current) {
      gridRef.current[index] = value
    }
  }

  // Count neighbors for Game of Life type rules
  const countNeighbors = useCallback(
    (x: number, y: number): number => {
      let count = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          if (getCell(x + dx, y + dy) === 1) count++
        }
      }
      return count
    },
    [getCell]
  )

  // Update grid based on current rule
  const updateGrid = useCallback(() => {
    if (!gridRef.current || !nextGridRef.current) return

    const grid = gridRef.current
    const nextGrid = nextGridRef.current

    switch (currentRule) {
      case 'life':
      case 'seeds': {
        const rule = rules.find((r) => r.type === currentRule)!
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const index = y * gridWidth + x
            const cell = grid[index]
            const neighbors = countNeighbors(x, y)

            if (cell === 1) {
              nextGrid[index] = rule.surviveRules?.includes(neighbors) ? 1 : 0
            } else {
              nextGrid[index] = rule.birthRules?.includes(neighbors) ? 1 : 0
            }
          }
        }
        break
      }

      case 'brian': {
        // Brian's Brain: 0 = dead, 1 = alive, 2 = dying
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const index = y * gridWidth + x
            const cell = grid[index]

            if (cell === 0) {
              // Dead cells become alive if exactly 2 alive neighbors
              let aliveNeighbors = 0
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (dx === 0 && dy === 0) continue
                  if (getCell(x + dx, y + dy) === 1) aliveNeighbors++
                }
              }
              nextGrid[index] = aliveNeighbors === 2 ? 1 : 0
            } else if (cell === 1) {
              // Alive cells become dying
              nextGrid[index] = 2
            } else {
              // Dying cells become dead
              nextGrid[index] = 0
            }
          }
        }
        break
      }

      case 'langton': {
        // Langton's Ant - special case, only one ant moves
        // States: 0 = white, 1 = black, 2-5 = ant facing up/right/down/left
        nextGrid.set(grid)

        for (let i = 0; i < grid.length; i++) {
          if (grid[i] >= 2) {
            const x = i % gridWidth
            const y = Math.floor(i / gridWidth)
            const direction = grid[i] - 2

            // Current cell color (excluding ant)
            const isBlack = getCell(x, y) === 1

            // Turn and flip color
            let newDirection = direction
            if (isBlack) {
              newDirection = (direction + 1) % 4 // Turn right
              nextGrid[i] = 0 // Make white
            } else {
              newDirection = (direction + 3) % 4 // Turn left
              nextGrid[i] = 1 // Make black
            }

            // Move ant
            let newX = x,
              newY = y
            switch (newDirection) {
              case 0:
                newY--
                break // Up
              case 1:
                newX++
                break // Right
              case 2:
                newY++
                break // Down
              case 3:
                newX--
                break // Left
            }

            // Wrap around
            newX = (newX + gridWidth) % gridWidth
            newY = (newY + gridHeight) % gridHeight

            // Place ant at new position
            const newIndex = newY * gridWidth + newX
            nextGrid[newIndex] = newDirection + 2
            break
          }
        }
        break
      }

      case 'rule110':
      case 'rule30': {
        // Elementary cellular automata - 1D rules on top row
        const ruleNumber = currentRule === 'rule110' ? 110 : 30

        // Only update the top row based on previous state
        for (let x = 0; x < gridWidth; x++) {
          const left = x > 0 ? grid[x - 1] : grid[gridWidth - 1]
          const center = grid[x]
          const right = x < gridWidth - 1 ? grid[x + 1] : grid[0]

          const pattern = (left << 2) | (center << 1) | right
          const newValue = (ruleNumber >> pattern) & 1

          nextGrid[x] = newValue
        }

        // Shift all rows down
        for (let y = gridHeight - 1; y > 0; y--) {
          for (let x = 0; x < gridWidth; x++) {
            nextGrid[y * gridWidth + x] = grid[(y - 1) * gridWidth + x]
          }
        }
        break
      }
    }

    // Swap grids
    gridRef.current = nextGrid
    nextGridRef.current = grid

    generationRef.current++
    setGeneration(generationRef.current)
    updatePopulation()
  }, [
    countNeighbors,
    currentRule,
    getCell,
    gridHeight,
    gridWidth,
    updatePopulation,
  ])

  // Update population count
  const updatePopulation = useCallback(() => {
    if (!gridRef.current) return

    let count = 0
    for (let i = 0; i < gridRef.current.length; i++) {
      if (
        gridRef.current[i] === 1 ||
        (currentRule === 'langton' && gridRef.current[i] >= 2)
      ) {
        count++
      }
    }
    setPopulation(count)
  }, [currentRule])

  // Draw grid
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !gridRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scheme = colorSchemes[colorScheme]

    // Clear canvas
    ctx.fillStyle = scheme.dead
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid lines
    if (showGrid && cellSize[0] > 2) {
      ctx.strokeStyle = scheme.grid
      ctx.lineWidth = 0.5

      for (let x = 0; x <= gridWidth; x++) {
        ctx.beginPath()
        ctx.moveTo(x * cellSize[0], 0)
        ctx.lineTo(x * cellSize[0], gridHeight * cellSize[0])
        ctx.stroke()
      }

      for (let y = 0; y <= gridHeight; y++) {
        ctx.beginPath()
        ctx.moveTo(0, y * cellSize[0])
        ctx.lineTo(gridWidth * cellSize[0], y * cellSize[0])
        ctx.stroke()
      }
    }

    // Draw cells
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const cell = gridRef.current[y * gridWidth + x]

        if (cell > 0) {
          if (cell === 1) {
            ctx.fillStyle = scheme.alive
          } else if (cell === 2) {
            ctx.fillStyle =
              currentRule === 'brian' ? scheme.dying : scheme.alive
          } else {
            // Ant in Langton's Ant
            ctx.fillStyle = '#ff0000'
          }

          ctx.fillRect(
            x * cellSize[0] + (showGrid ? 1 : 0),
            y * cellSize[0] + (showGrid ? 1 : 0),
            cellSize[0] - (showGrid ? 1 : 0),
            cellSize[0] - (showGrid ? 1 : 0)
          )
        }
      }
    }
  }, [cellSize, colorScheme, currentRule, gridHeight, gridWidth, showGrid]) // eslint-disable-line react-hooks/exhaustive-deps

  // Animation loop
  const animate = useCallback(
    function animateLoop() {
      frameCount.current++

      if (frameCount.current >= 60 / speed[0]) {
        updateGrid()
        frameCount.current = 0
      }

      drawGrid()

      // Check if we should continue animation
      if (animationRef.current) {
        animationRef.current = requestAnimationFrame(animateLoop)
      }
    },
    [drawGrid, speed, updateGrid]
  )

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    initializeGrid()
  }, [initializeGrid])

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    mouseRef.current.isDown = true
    handleMouseMove(e)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / cellSize[0])
    const y = Math.floor((e.clientY - rect.top) / cellSize[0])

    mouseRef.current = { x, y, isDown: mouseRef.current.isDown }

    if (mouseRef.current.isDown && gridRef.current) {
      const brush = brushSize[0]
      for (let dy = -brush + 1; dy < brush; dy++) {
        for (let dx = -brush + 1; dx < brush; dx++) {
          if (dx * dx + dy * dy < brush * brush) {
            const cellX = x + dx
            const cellY = y + dy
            if (
              cellX >= 0 &&
              cellX < gridWidth &&
              cellY >= 0 &&
              cellY < gridHeight
            ) {
              setCell(cellX, cellY, e.shiftKey ? 0 : 1)
            }
          }
        }
      }
      updatePopulation()
      if (!isPlaying) drawGrid()
    }
  }

  const handleMouseUp = () => {
    mouseRef.current.isDown = false
  }

  // Clear grid
  const clearGrid = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.fill(0)
      generationRef.current = 0
      setGeneration(0)
      setPopulation(0)

      // Re-initialize for special automata
      if (currentRule === 'langton') {
        const centerIndex =
          Math.floor(gridHeight / 2) * gridWidth + Math.floor(gridWidth / 2)
        gridRef.current[centerIndex] = 2
      }

      drawGrid()
    }
  }, [currentRule, drawGrid, gridHeight, gridWidth])

  // Randomize grid
  const randomizeGrid = () => {
    if (!gridRef.current) return

    for (let i = 0; i < gridRef.current.length; i++) {
      gridRef.current[i] = Math.random() < 0.3 ? 1 : 0
    }

    // Add ant for Langton's Ant
    if (currentRule === 'langton') {
      const centerIndex =
        Math.floor(gridHeight / 2) * gridWidth + Math.floor(gridWidth / 2)
      gridRef.current[centerIndex] = 2
    }

    generationRef.current = 0
    setGeneration(0)
    updatePopulation()
    drawGrid()
  }

  // Place pattern
  const placePattern = (pattern: Pattern) => {
    if (!gridRef.current) return

    const startX = Math.floor((gridWidth - pattern.cells[0].length) / 2)
    const startY = Math.floor((gridHeight - pattern.cells.length) / 2)

    for (let y = 0; y < pattern.cells.length; y++) {
      for (let x = 0; x < pattern.cells[y].length; x++) {
        if (pattern.cells[y][x] === 1) {
          setCell(startX + x, startY + y, 1)
        }
      }
    }

    updatePopulation()
    drawGrid()
  }

  // Export as image
  const exportImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `cellular-automata-gen${generationRef.current}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  // Initialize on mount
  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [handleResize])

  // Update when cell size changes
  useEffect(() => {
    initializeGrid()
    drawGrid()
  }, [cellSize, drawGrid, initializeGrid])

  // Update when rule changes
  useEffect(() => {
    clearGrid()
  }, [clearGrid, currentRule])

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [animate, isPlaying])

  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Grid3x3 className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-display font-semibold">
                Cellular Automata Playground
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore the fascinating world of cellular automata. Simple rules
              create complex patterns, from the Game of Life to elementary
              automata.
            </p>
          </motion.div>

          {/* Canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 relative"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-[500px] bg-black rounded-lg shadow-2xl cursor-crosshair"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Info overlay */}
            <div className="absolute top-4 left-4 text-white text-sm space-y-1 bg-black/50 p-3 rounded">
              <div>Generation: {generation}</div>
              <div>Population: {population}</div>
              <div>Speed: {speed[0]} gen/sec</div>
            </div>

            {/* Controls overlay */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                size="icon"
                variant={isPlaying ? 'default' : 'outline'}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={clearGrid}
                title="Clear grid"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={randomizeGrid}
                title="Random pattern"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={exportImage}
                title="Export as image"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Rules */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Automaton Rules</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rules.map((rule) => (
                  <Button
                    key={rule.type}
                    variant={currentRule === rule.type ? 'default' : 'outline'}
                    className="h-auto p-3 justify-start flex-col items-start"
                    onClick={() => setCurrentRule(rule.type)}
                  >
                    <div className="font-semibold">{rule.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {rule.description}
                    </div>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Patterns */}
            {(currentRule === 'life' || currentRule === 'seeds') && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Patterns</h3>
                <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {patterns
                    .filter((p) => p.type === currentRule)
                    .map((pattern, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-2 justify-start flex-col items-start"
                        onClick={() => placePattern(pattern)}
                      >
                        <div className="font-medium text-sm">
                          {pattern.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pattern.description}
                        </div>
                      </Button>
                    ))}
                </div>
              </Card>
            )}

            {/* Settings */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Simulation Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Speed</label>
                      <span className="text-sm text-muted-foreground">
                        {speed[0]} gen/sec
                      </span>
                    </div>
                    <Slider
                      value={speed}
                      onValueChange={setSpeed}
                      min={1}
                      max={60}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Cell Size</label>
                      <span className="text-sm text-muted-foreground">
                        {cellSize[0]}px
                      </span>
                    </div>
                    <Slider
                      value={cellSize}
                      onValueChange={setCellSize}
                      min={1}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Brush Size</label>
                      <span className="text-sm text-muted-foreground">
                        {brushSize[0]}
                      </span>
                    </div>
                    <Slider
                      value={brushSize}
                      onValueChange={setBrushSize}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Visual Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Color Scheme
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {colorSchemes.map((scheme, index) => (
                        <Badge
                          key={index}
                          variant={
                            colorScheme === index ? 'default' : 'secondary'
                          }
                          className="cursor-pointer"
                          onClick={() => setColorScheme(index)}
                        >
                          {scheme.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Display Options
                    </label>
                    <Badge
                      variant={showGrid ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => setShowGrid(!showGrid)}
                    >
                      Grid Lines
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* Instructions */}
            <Card className="p-6 bg-muted/30">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Drawing:</strong> Click and drag to draw cells. Hold
                    Shift while dragging to erase.
                  </p>
                  <p>
                    <strong>Rules:</strong> Each automaton follows different
                    rules. Conway's Game of Life has cells that survive with 2-3
                    neighbors and are born with exactly 3 neighbors. Try
                    different rules to see unique behaviors!
                  </p>
                  <p>
                    <strong>Patterns:</strong> Pre-made patterns demonstrate
                    interesting behaviors like oscillators, spaceships, and
                    generators.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </Layout>
  )
}
