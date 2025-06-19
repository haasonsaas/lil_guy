import React, { useEffect, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Play, 
  Pause, 
  RotateCcw, 
  Download,
  Shuffle,
  Sparkles,
  Layers,
  Brush,
  Zap,
  TreePine,
  Waves,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';

type ArtType = 'perlin' | 'flowfield' | 'lsystem' | 'fractaltree' | 'voronoi' | 'particle';

interface Preset {
  name: string;
  description: string;
  type: ArtType;
  params: Record<string, number>;
}

export default function GenerativeArtPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  
  const [isAnimated, setIsAnimated] = useState(true);
  const [currentArt, setCurrentArt] = useState<ArtType>('perlin');
  const [colorScheme, setColorScheme] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Common parameters
  const [scale, setScale] = useState([50]);
  const [complexity, setComplexity] = useState([5]);
  const [speed, setSpeed] = useState([1]);
  const [detail, setDetail] = useState([100]);
  
  // Specific parameters
  const [noiseDetail, setNoiseDetail] = useState([4]);
  const [flowStrength, setFlowStrength] = useState([0.01]);
  const [particleCount, setParticleCount] = useState([1000]);
  const [iterations, setIterations] = useState([6]);
  const [angle, setAngle] = useState([25]);
  const [points, setPoints] = useState([50]);

  const artTypes = [
    {
      name: "Perlin Noise",
      description: "Organic flowing patterns",
      type: 'perlin' as ArtType,
      icon: Waves
    },
    {
      name: "Flow Field",
      description: "Particle flow visualization",
      type: 'flowfield' as ArtType,
      icon: Target
    },
    {
      name: "L-System",
      description: "Recursive growth patterns",
      type: 'lsystem' as ArtType,
      icon: TreePine
    },
    {
      name: "Fractal Tree",
      description: "Branching tree structures",
      type: 'fractaltree' as ArtType,
      icon: TreePine
    },
    {
      name: "Voronoi",
      description: "Cellular geometric patterns",
      type: 'voronoi' as ArtType,
      icon: Layers
    },
    {
      name: "Particle System",
      description: "Dynamic particle interactions",
      type: 'particle' as ArtType,
      icon: Sparkles
    }
  ];

  const colorSchemes = [
    {
      name: "Sunset",
      colors: ['#ff6b35', '#f7931e', '#ffd23f', '#06ffa5', '#118ab2', '#073b4c']
    },
    {
      name: "Ocean",
      colors: ['#006466', '#065a60', '#0b525b', '#144552', '#1b3a4b', '#212f45']
    },
    {
      name: "Forest",
      colors: ['#2d5016', '#3e6b1c', '#4f8522', '#609f28', '#72b82e', '#84d234']
    },
    {
      name: "Cosmic",
      colors: ['#240046', '#3c096c', '#5a189a', '#7b2cbf', '#9d4edd', '#c77dff']
    },
    {
      name: "Fire",
      colors: ['#370617', '#6a040f', '#9d0208', '#d00000', '#dc2f02', '#e85d04']
    },
    {
      name: "Monochrome",
      colors: ['#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080']
    }
  ];

  const presets: Preset[] = [
    {
      name: "Flowing Clouds",
      description: "Soft organic clouds",
      type: 'perlin',
      params: { scale: 80, complexity: 3, detail: 150, noiseDetail: 3 }
    },
    {
      name: "Electric Storm",
      description: "Dynamic flow patterns",
      type: 'flowfield',
      params: { scale: 30, complexity: 7, particleCount: 2000, flowStrength: 0.02 }
    },
    {
      name: "Coral Growth",
      description: "Branching coral structure",
      type: 'lsystem',
      params: { iterations: 5, angle: 22, scale: 60 }
    },
    {
      name: "Ancient Oak",
      description: "Majestic tree structure",
      type: 'fractaltree',
      params: { iterations: 8, angle: 30, scale: 40 }
    },
    {
      name: "Crystal Caves",
      description: "Geometric crystal formations",
      type: 'voronoi',
      params: { points: 75, scale: 100, complexity: 4 }
    },
    {
      name: "Stellar Dust",
      description: "Cosmic particle dance",
      type: 'particle',
      params: { particleCount: 1500, speed: 2, scale: 80 }
    }
  ];

  // Perlin noise implementation
  class PerlinNoise {
    private permutation: number[];
    
    constructor() {
      this.permutation = [];
      for (let i = 0; i < 256; i++) {
        this.permutation[i] = i;
      }
      
      for (let i = 255; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
      }
      
      for (let i = 0; i < 256; i++) {
        this.permutation[256 + i] = this.permutation[i];
      }
    }
    
    private fade(t: number): number {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    private lerp(t: number, a: number, b: number): number {
      return a + t * (b - a);
    }
    
    private grad(hash: number, x: number, y: number): number {
      const h = hash & 15;
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    noise(x: number, y: number): number {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      
      x -= Math.floor(x);
      y -= Math.floor(y);
      
      const u = this.fade(x);
      const v = this.fade(y);
      
      const A = this.permutation[X] + Y;
      const AA = this.permutation[A];
      const AB = this.permutation[A + 1];
      const B = this.permutation[X + 1] + Y;
      const BA = this.permutation[B];
      const BB = this.permutation[B + 1];
      
      return this.lerp(v,
        this.lerp(u, this.grad(this.permutation[AA], x, y),
                     this.grad(this.permutation[BA], x - 1, y)),
        this.lerp(u, this.grad(this.permutation[AB], x, y - 1),
                     this.grad(this.permutation[BB], x - 1, y - 1))
      );
    }
  }

  const perlinNoise = useRef(new PerlinNoise());

  // Generate Perlin noise art
  const generatePerlinArt = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    const colors = colorSchemes[colorScheme].colors;
    
    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        let noiseValue = 0;
        let amplitude = 1;
        let frequency = 1;
        
        for (let i = 0; i < noiseDetail[0]; i++) {
          noiseValue += perlinNoise.current.noise(
            (x + time * speed[0] * 10) * frequency / scale[0],
            (y + time * speed[0] * 10) * frequency / scale[0]
          ) * amplitude;
          amplitude *= 0.5;
          frequency *= 2;
        }
        
        noiseValue = (noiseValue + 1) / 2; // Normalize to 0-1
        
        const colorIndex = Math.floor(noiseValue * (colors.length - 1));
        const t = (noiseValue * (colors.length - 1)) - colorIndex;
        
        const color1 = colors[colorIndex] || colors[0];
        const color2 = colors[colorIndex + 1] || colors[colors.length - 1];
        
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        
        const index = (y * canvas.width + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  // Generate flow field art
  const generateFlowField = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    ctx.fillStyle = colorSchemes[colorScheme].colors[0];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const colors = colorSchemes[colorScheme].colors;
    
    for (let i = 0; i < particleCount[0]; i++) {
      let x = Math.random() * canvas.width;
      let y = Math.random() * canvas.height;
      
      ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)] + '40';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      for (let j = 0; j < detail[0]; j++) {
        const angle = perlinNoise.current.noise(
          x / scale[0] + time * speed[0] * 0.01,
          y / scale[0] + time * speed[0] * 0.01
        ) * Math.PI * 2 * complexity[0];
        
        x += Math.cos(angle) * flowStrength[0] * scale[0];
        y += Math.sin(angle) * flowStrength[0] * scale[0];
        
        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) break;
        
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
    }
  };

  // L-System generator
  const generateLSystem = (axiom: string, rules: Record<string, string>, iterations: number): string => {
    let result = axiom;
    
    for (let i = 0; i < iterations; i++) {
      let newResult = '';
      for (const char of result) {
        newResult += rules[char] || char;
      }
      result = newResult;
    }
    
    return result;
  };

  // Generate L-System art
  const generateLSystemArt = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = colorSchemes[colorScheme].colors[0];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const rules = {
      'F': 'F[+F]F[-F]F',
      'X': 'F[+X][-X]FX'
    };
    
    const system = generateLSystem('X', rules, iterations[0]);
    const colors = colorSchemes[colorScheme].colors;
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height - 50);
    
    const stack: Array<{ x: number; y: number; angle: number }> = [];
    let currentAngle = -Math.PI / 2;
    const angleStep = (angle[0] * Math.PI) / 180;
    const stepSize = scale[0] / Math.pow(2, iterations[0] / 2);
    
    let colorIndex = 0;
    
    for (const char of system) {
      switch (char) {
        case 'F':
          ctx.strokeStyle = colors[colorIndex % colors.length];
          ctx.lineWidth = Math.max(1, 3 - iterations[0] * 0.3);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          
          const newX = Math.cos(currentAngle) * stepSize;
          const newY = Math.sin(currentAngle) * stepSize;
          
          ctx.lineTo(newX, newY);
          ctx.stroke();
          ctx.translate(newX, newY);
          colorIndex++;
          break;
          
        case '+':
          currentAngle += angleStep;
          break;
          
        case '-':
          currentAngle -= angleStep;
          break;
          
        case '[':
          stack.push({
            x: ctx.getTransform().e,
            y: ctx.getTransform().f,
            angle: currentAngle
          });
          break;
          
        case ']':
          const state = stack.pop();
          if (state) {
            ctx.setTransform(1, 0, 0, 1, state.x, state.y);
            currentAngle = state.angle;
          }
          break;
      }
    }
    
    ctx.restore();
  };

  // Generate fractal tree
  const generateFractalTree = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = colorSchemes[colorScheme].colors[0];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const colors = colorSchemes[colorScheme].colors;
    
    const drawBranch = (x: number, y: number, length: number, angle: number, depth: number) => {
      if (depth === 0) return;
      
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;
      
      ctx.strokeStyle = colors[Math.floor((depth / iterations[0]) * (colors.length - 1))];
      ctx.lineWidth = depth * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      const newLength = length * (0.7 + Math.random() * 0.2);
      const angleVariation = (Math.random() - 0.5) * 0.3;
      
      drawBranch(endX, endY, newLength, angle - (angle[0] * Math.PI / 180) + angleVariation, depth - 1);
      drawBranch(endX, endY, newLength, angle + (angle[0] * Math.PI / 180) + angleVariation, depth - 1);
    };
    
    drawBranch(canvas.width / 2, canvas.height - 50, scale[0], -Math.PI / 2, iterations[0]);
  };

  // Generate Voronoi diagram
  const generateVoronoi = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const sites: Array<{ x: number; y: number; color: string }> = [];
    const colors = colorSchemes[colorScheme].colors;
    
    // Generate random sites
    for (let i = 0; i < points[0]; i++) {
      sites.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        let minDist = Infinity;
        let closestSite = sites[0];
        
        for (const site of sites) {
          const dist = Math.sqrt((x - site.x) ** 2 + (y - site.y) ** 2);
          if (dist < minDist) {
            minDist = dist;
            closestSite = site;
          }
        }
        
        // Add some noise to create organic edges
        const noise = perlinNoise.current.noise(x / 20, y / 20) * 10;
        const intensity = Math.min(1, (minDist + noise) / (scale[0] * 2));
        
        const r = parseInt(closestSite.color.slice(1, 3), 16) * intensity;
        const g = parseInt(closestSite.color.slice(3, 5), 16) * intensity;
        const b = parseInt(closestSite.color.slice(5, 7), 16) * intensity;
        
        const index = (y * canvas.width + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Draw site points
    ctx.fillStyle = '#ffffff';
    for (const site of sites) {
      ctx.beginPath();
      ctx.arc(site.x, site.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Particle system
  const particleSystemRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
  }>>([]);

  const generateParticleSystem = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    // Initialize particles if needed
    if (particleSystemRef.current.length === 0) {
      const colors = colorSchemes[colorScheme].colors;
      for (let i = 0; i < particleCount[0]; i++) {
        particleSystemRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed[0],
          vy: (Math.random() - 0.5) * speed[0],
          life: Math.random() * 100,
          maxLife: 100,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }
    
    // Fade background
    ctx.fillStyle = colorSchemes[colorScheme].colors[0] + '20';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    for (const particle of particleSystemRef.current) {
      // Apply flow field
      const flowAngle = perlinNoise.current.noise(
        particle.x / scale[0] + time * 0.01,
        particle.y / scale[0] + time * 0.01
      ) * Math.PI * 2 * complexity[0];
      
      particle.vx += Math.cos(flowAngle) * 0.1;
      particle.vy += Math.sin(flowAngle) * 0.1;
      
      // Apply damping
      particle.vx *= 0.99;
      particle.vy *= 0.99;
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;
      
      // Update life
      particle.life += 1;
      if (particle.life > particle.maxLife) {
        particle.life = 0;
        particle.x = Math.random() * canvas.width;
        particle.y = Math.random() * canvas.height;
      }
      
      // Draw particle
      const alpha = 1 - (particle.life / particle.maxLife);
      ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw connections to nearby particles
      for (const other of particleSystemRef.current) {
        const dist = Math.sqrt((particle.x - other.x) ** 2 + (particle.y - other.y) ** 2);
        if (dist < scale[0] / 2) {
          const connectionAlpha = (1 - dist / (scale[0] / 2)) * alpha * 0.3;
          ctx.strokeStyle = particle.color + Math.floor(connectionAlpha * 255).toString(16).padStart(2, '0');
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
    }
  };

  // Main render function
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const time = (Date.now() - startTimeRef.current) * 0.001;
    
    try {
      setIsGenerating(true);
      
      switch (currentArt) {
        case 'perlin':
          generatePerlinArt(ctx, canvas, time);
          break;
        case 'flowfield':
          generateFlowField(ctx, canvas, time);
          break;
        case 'lsystem':
          generateLSystemArt(ctx, canvas);
          break;
        case 'fractaltree':
          generateFractalTree(ctx, canvas);
          break;
        case 'voronoi':
          generateVoronoi(ctx, canvas);
          break;
        case 'particle':
          generateParticleSystem(ctx, canvas, time);
          break;
      }
    } finally {
      setIsGenerating(false);
    }
    
    if (isAnimated && (currentArt === 'perlin' || currentArt === 'flowfield' || currentArt === 'particle')) {
      animationRef.current = requestAnimationFrame(render);
    }
  };

  // Handle canvas resize
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Reset particle system
    particleSystemRef.current = [];
  };

  // Generate new art
  const generateArt = () => {
    perlinNoise.current = new PerlinNoise();
    particleSystemRef.current = [];
    startTimeRef.current = Date.now();
    render();
  };

  // Export as image
  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `generative-art-${currentArt}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Load preset
  const loadPreset = (preset: Preset) => {
    setCurrentArt(preset.type);
    
    // Apply preset parameters
    if (preset.params.scale) setScale([preset.params.scale]);
    if (preset.params.complexity) setComplexity([preset.params.complexity]);
    if (preset.params.detail) setDetail([preset.params.detail]);
    if (preset.params.noiseDetail) setNoiseDetail([preset.params.noiseDetail]);
    if (preset.params.flowStrength) setFlowStrength([preset.params.flowStrength]);
    if (preset.params.particleCount) setParticleCount([preset.params.particleCount]);
    if (preset.params.iterations) setIterations([preset.params.iterations]);
    if (preset.params.angle) setAngle([preset.params.angle]);
    if (preset.params.points) setPoints([preset.params.points]);
    if (preset.params.speed) setSpeed([preset.params.speed]);
    
    setTimeout(generateArt, 100);
  };

  // Initialize on mount
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    
    generateArt();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Update when art type changes
  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    generateArt();
  }, [currentArt, colorScheme]);

  // Handle animation toggle
  useEffect(() => {
    if (isAnimated && (currentArt === 'perlin' || currentArt === 'flowfield' || currentArt === 'particle')) {
      render();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [isAnimated]);

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
              <Palette className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-display font-semibold">Generative Art Studio</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create algorithmic art using mathematical functions and natural patterns. 
              Explore different techniques from Perlin noise to L-systems and cellular structures.
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
              className="w-full h-[500px] bg-black rounded-lg shadow-2xl"
              style={{ imageRendering: 'crisp-edges' }}
            />
            
            {/* Art type indicator */}
            <div className="absolute top-4 left-4">
              <Badge variant="default" className="gap-2">
                {artTypes.find(t => t.type === currentArt)?.icon && 
                  React.createElement(artTypes.find(t => t.type === currentArt)!.icon, { className: "h-3 w-3" })}
                {artTypes.find(t => t.type === currentArt)?.name}
              </Badge>
            </div>

            {/* Generation indicator */}
            {isGenerating && (
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                  Generating...
                </Badge>
              </div>
            )}

            {/* Controls overlay */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {(currentArt === 'perlin' || currentArt === 'flowfield' || currentArt === 'particle') && (
                <Button
                  size="icon"
                  variant={isAnimated ? "default" : "outline"}
                  onClick={() => setIsAnimated(!isAnimated)}
                  title="Toggle animation"
                >
                  {isAnimated ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              )}
              <Button
                size="icon"
                variant="outline"
                onClick={generateArt}
                title="Generate new art"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={exportImage}
                title="Export as PNG"
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
            {/* Art Types */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Art Type</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {artTypes.map((art) => {
                  const Icon = art.icon;
                  return (
                    <Button
                      key={art.type}
                      variant={currentArt === art.type ? "default" : "outline"}
                      className="h-auto p-3 justify-start flex-col items-start"
                      onClick={() => setCurrentArt(art.type)}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <Icon className="h-4 w-4" />
                        {art.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{art.description}</div>
                    </Button>
                  );
                })}
              </div>
            </Card>

            {/* Presets */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Presets</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {presets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-3 justify-start flex-col items-start"
                    onClick={() => loadPreset(preset)}
                  >
                    <div className="font-semibold">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Parameters */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  General Parameters
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Scale</label>
                      <span className="text-sm text-muted-foreground">{scale[0]}</span>
                    </div>
                    <Slider
                      value={scale}
                      onValueChange={(value) => { setScale(value); setTimeout(generateArt, 100); }}
                      min={10}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Complexity</label>
                      <span className="text-sm text-muted-foreground">{complexity[0]}</span>
                    </div>
                    <Slider
                      value={complexity}
                      onValueChange={(value) => { setComplexity(value); setTimeout(generateArt, 100); }}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  {(currentArt === 'perlin' || currentArt === 'flowfield' || currentArt === 'particle') && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Animation Speed</label>
                        <span className="text-sm text-muted-foreground">{speed[0].toFixed(1)}</span>
                      </div>
                      <Slider
                        value={speed}
                        onValueChange={setSpeed}
                        min={0.1}
                        max={3}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Brush className="h-5 w-5" />
                  Specific Parameters
                </h3>
                <div className="space-y-4">
                  {(currentArt === 'perlin') && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Noise Detail</label>
                        <span className="text-sm text-muted-foreground">{noiseDetail[0]}</span>
                      </div>
                      <Slider
                        value={noiseDetail}
                        onValueChange={(value) => { setNoiseDetail(value); setTimeout(generateArt, 100); }}
                        min={1}
                        max={8}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {(currentArt === 'flowfield' || currentArt === 'particle') && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Particle Count</label>
                        <span className="text-sm text-muted-foreground">{particleCount[0]}</span>
                      </div>
                      <Slider
                        value={particleCount}
                        onValueChange={(value) => { setParticleCount(value); setTimeout(generateArt, 100); }}
                        min={100}
                        max={5000}
                        step={100}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {(currentArt === 'lsystem' || currentArt === 'fractaltree') && (
                    <>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-medium">Iterations</label>
                          <span className="text-sm text-muted-foreground">{iterations[0]}</span>
                        </div>
                        <Slider
                          value={iterations}
                          onValueChange={(value) => { setIterations(value); setTimeout(generateArt, 100); }}
                          min={3}
                          max={currentArt === 'lsystem' ? 7 : 10}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-medium">Branch Angle</label>
                          <span className="text-sm text-muted-foreground">{angle[0]}°</span>
                        </div>
                        <Slider
                          value={angle}
                          onValueChange={(value) => { setAngle(value); setTimeout(generateArt, 100); }}
                          min={15}
                          max={45}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                  
                  {currentArt === 'voronoi' && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Seed Points</label>
                        <span className="text-sm text-muted-foreground">{points[0]}</span>
                      </div>
                      <Slider
                        value={points}
                        onValueChange={(value) => { setPoints(value); setTimeout(generateArt, 100); }}
                        min={10}
                        max={200}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Color Schemes */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Color Schemes</h3>
              <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {colorSchemes.map((scheme, index) => (
                  <Button
                    key={index}
                    variant={colorScheme === index ? "default" : "outline"}
                    className="h-16 p-2 flex flex-col justify-center"
                    onClick={() => setColorScheme(index)}
                  >
                    <div className="flex gap-1 mb-1">
                      {scheme.colors.slice(0, 4).map((color, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="text-xs">{scheme.name}</div>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Info */}
            <Card className="p-6 bg-muted/30">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Generative Art:</strong> Art created using algorithms and mathematical functions. 
                    Each technique explores different aspects of computational creativity.
                  </p>
                  <p>
                    <strong>Techniques:</strong> Perlin noise creates organic flows, L-systems model plant growth, 
                    fractals show self-similar patterns, Voronoi diagrams reveal natural cell structures, 
                    and particle systems simulate complex emergent behaviors.
                  </p>
                  <p>
                    Adjust parameters to explore the infinite possibilities within each algorithm. 
                    Export your creations as PNG images to save and share your art.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}