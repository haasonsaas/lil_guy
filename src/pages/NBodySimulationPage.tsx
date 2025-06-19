import React, { useEffect, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Orbit, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus,
  Minus,
  Zap,
  Timer,
  Target,
  Info,
  Sparkles,
  Circle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Body {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
  trail: { x: number; y: number }[];
}

interface Preset {
  name: string;
  description: string;
  bodies: Omit<Body, 'id' | 'trail'>[];
}

const G = 6.67430e-11 * 1e10; // Gravitational constant (scaled for visualization)

export default function NBodySimulationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const bodiesRef = useRef<Body[]>([]);
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectedBodyRef = useRef<Body | null>(null);
  const nextIdRef = useRef(0);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeScale, setTimeScale] = useState([1.0]);
  const [trailLength, setTrailLength] = useState([100]);
  const [showVelocityVectors, setShowVelocityVectors] = useState(false);
  const [showGravityField, setShowGravityField] = useState(false);
  const [collisionsEnabled, setCollisionsEnabled] = useState(true);
  const [centerOfMass, setCenterOfMass] = useState<{ x: number; y: number } | null>(null);
  const [bodyCount, setBodyCount] = useState(0);
  const [placementMode, setPlacementMode] = useState<'click' | 'drag'>('drag');
  const [newBodyMass, setNewBodyMass] = useState([50]);

  const presets: Preset[] = [
    {
      name: "Binary Star System",
      description: "Two stars orbiting their common center of mass",
      bodies: [
        { x: -100, y: 0, vx: 0, vy: -30, mass: 100, radius: 20, color: '#ffaa00' },
        { x: 100, y: 0, vx: 0, vy: 30, mass: 100, radius: 20, color: '#ff5500' }
      ]
    },
    {
      name: "Planet and Moon",
      description: "A planet with an orbiting moon",
      bodies: [
        { x: 0, y: 0, vx: 0, vy: 0, mass: 200, radius: 25, color: '#4488ff' },
        { x: 150, y: 0, vx: 0, vy: 40, mass: 20, radius: 8, color: '#cccccc' }
      ]
    },
    {
      name: "Solar System",
      description: "A star with multiple orbiting planets",
      bodies: [
        { x: 0, y: 0, vx: 0, vy: 0, mass: 300, radius: 30, color: '#ffdd00' },
        { x: 80, y: 0, vx: 0, vy: 55, mass: 10, radius: 5, color: '#8888ff' },
        { x: 150, y: 0, vx: 0, vy: 40, mass: 20, radius: 8, color: '#ff8844' },
        { x: 250, y: 0, vx: 0, vy: 30, mass: 15, radius: 7, color: '#44ff88' }
      ]
    },
    {
      name: "Lagrange Points",
      description: "Three bodies demonstrating Lagrange point stability",
      bodies: [
        { x: -100, y: 0, vx: 0, vy: -20, mass: 100, radius: 20, color: '#ff6600' },
        { x: 100, y: 0, vx: 0, vy: 20, mass: 100, radius: 20, color: '#0066ff' },
        { x: 0, y: 173.2, vx: -34.64, vy: 0, mass: 10, radius: 5, color: '#00ff66' }
      ]
    },
    {
      name: "Chaos",
      description: "Multiple bodies in chaotic interaction",
      bodies: [
        { x: -100, y: -100, vx: 20, vy: 20, mass: 50, radius: 12, color: '#ff0066' },
        { x: 100, y: -100, vx: -20, vy: 20, mass: 50, radius: 12, color: '#66ff00' },
        { x: 100, y: 100, vx: -20, vy: -20, mass: 50, radius: 12, color: '#0066ff' },
        { x: -100, y: 100, vx: 20, vy: -20, mass: 50, radius: 12, color: '#ff6600' },
        { x: 0, y: 0, vx: 0, vy: 0, mass: 80, radius: 15, color: '#ffff00' }
      ]
    }
  ];

  // Generate star color based on mass (temperature)
  const getStarColor = (mass: number): string => {
    if (mass < 30) return '#ffccaa'; // Red dwarf
    if (mass < 60) return '#ffffaa'; // Yellow star
    if (mass < 100) return '#ffffff'; // White star
    if (mass < 150) return '#aaccff'; // Blue star
    return '#8899ff'; // Blue giant
  };

  // Create a new body
  const createBody = (x: number, y: number, vx: number, vy: number, mass: number): Body => {
    const radius = Math.sqrt(mass) * 2;
    return {
      id: nextIdRef.current++,
      x,
      y,
      vx,
      vy,
      mass,
      radius,
      color: getStarColor(mass),
      trail: []
    };
  };

  // Load preset
  const loadPreset = (preset: Preset) => {
    bodiesRef.current = preset.bodies.map(body => ({
      ...body,
      id: nextIdRef.current++,
      trail: []
    }));
    setBodyCount(bodiesRef.current.length);
  };

  // Calculate gravitational force between two bodies
  const calculateForce = (body1: Body, body2: Body): { fx: number; fy: number } => {
    const dx = body2.x - body1.x;
    const dy = body2.y - body1.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);
    
    // Prevent division by zero and extreme forces at close distances
    const minDist = body1.radius + body2.radius;
    const effectiveDist = Math.max(dist, minDist);
    const effectiveDistSq = effectiveDist * effectiveDist;
    
    const force = G * body1.mass * body2.mass / effectiveDistSq;
    const fx = force * dx / effectiveDist;
    const fy = force * dy / effectiveDist;
    
    return { fx, fy };
  };

  // Check collision between two bodies
  const checkCollision = (body1: Body, body2: Body): boolean => {
    const dx = body2.x - body1.x;
    const dy = body2.y - body1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < body1.radius + body2.radius;
  };

  // Merge two bodies after collision
  const mergeBodies = (body1: Body, body2: Body): Body => {
    const totalMass = body1.mass + body2.mass;
    const newX = (body1.x * body1.mass + body2.x * body2.mass) / totalMass;
    const newY = (body1.y * body1.mass + body2.y * body2.mass) / totalMass;
    const newVx = (body1.vx * body1.mass + body2.vx * body2.mass) / totalMass;
    const newVy = (body1.vy * body1.mass + body2.vy * body2.mass) / totalMass;
    
    return createBody(newX, newY, newVx, newVy, totalMass);
  };

  // Update physics
  const updatePhysics = (dt: number) => {
    const bodies = bodiesRef.current;
    const forces: { [key: number]: { fx: number; fy: number } } = {};
    
    // Calculate forces
    for (let i = 0; i < bodies.length; i++) {
      forces[bodies[i].id] = { fx: 0, fy: 0 };
      
      for (let j = 0; j < bodies.length; j++) {
        if (i !== j) {
          const force = calculateForce(bodies[i], bodies[j]);
          forces[bodies[i].id].fx += force.fx;
          forces[bodies[i].id].fy += force.fy;
        }
      }
    }
    
    // Update velocities and positions
    for (const body of bodies) {
      const force = forces[body.id];
      const ax = force.fx / body.mass;
      const ay = force.fy / body.mass;
      
      body.vx += ax * dt;
      body.vy += ay * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      
      // Update trail
      body.trail.push({ x: body.x, y: body.y });
      if (body.trail.length > trailLength[0]) {
        body.trail.shift();
      }
    }
    
    // Handle collisions
    if (collisionsEnabled) {
      const toRemove: number[] = [];
      const toAdd: Body[] = [];
      
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          if (checkCollision(bodies[i], bodies[j])) {
            const merged = mergeBodies(bodies[i], bodies[j]);
            toRemove.push(bodies[i].id, bodies[j].id);
            toAdd.push(merged);
          }
        }
      }
      
      // Remove collided bodies
      bodiesRef.current = bodies.filter(body => !toRemove.includes(body.id));
      
      // Add merged bodies
      bodiesRef.current.push(...toAdd);
    }
    
    // Calculate center of mass
    if (bodies.length > 0) {
      let totalMass = 0;
      let cx = 0;
      let cy = 0;
      
      for (const body of bodies) {
        totalMass += body.mass;
        cx += body.x * body.mass;
        cy += body.y * body.mass;
      }
      
      setCenterOfMass({ x: cx / totalMass, y: cy / totalMass });
    }
    
    setBodyCount(bodiesRef.current.length);
  };

  // Draw gravity field
  const drawGravityField = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const gridSize = 40;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.2)';
    ctx.lineWidth = 1;
    
    for (let x = gridSize / 2; x < canvas.width; x += gridSize) {
      for (let y = gridSize / 2; y < canvas.height; y += gridSize) {
        const worldX = x - centerX;
        const worldY = y - centerY;
        
        let totalFx = 0;
        let totalFy = 0;
        
        // Calculate field strength at this point
        for (const body of bodiesRef.current) {
          const dx = body.x - worldX;
          const dy = body.y - worldY;
          const distSq = dx * dx + dy * dy;
          
          if (distSq > 100) { // Avoid singularities
            const dist = Math.sqrt(distSq);
            const field = G * body.mass / distSq;
            totalFx += field * dx / dist;
            totalFy += field * dy / dist;
          }
        }
        
        // Draw field line
        const magnitude = Math.sqrt(totalFx * totalFx + totalFy * totalFy);
        if (magnitude > 0.1) {
          const scale = Math.min(gridSize * 0.4, gridSize * 0.4 / Math.sqrt(magnitude));
          const endX = x + totalFx * scale;
          const endY = y + totalFy * scale;
          
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          
          // Arrowhead
          const angle = Math.atan2(totalFy, totalFx);
          ctx.save();
          ctx.translate(endX, endY);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-5, -2);
          ctx.lineTo(-5, 2);
          ctx.closePath();
          ctx.fillStyle = 'rgba(100, 100, 255, 0.3)';
          ctx.fill();
          ctx.restore();
        }
      }
    }
  };

  // Render frame
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Fade effect for trails
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw gravity field
    if (showGravityField) {
      drawGravityField(ctx, canvas);
    }
    
    // Draw trails
    for (const body of bodiesRef.current) {
      if (body.trail.length > 1) {
        ctx.strokeStyle = body.color + '40'; // 25% opacity
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(body.trail[0].x + centerX, body.trail[0].y + centerY);
        
        for (let i = 1; i < body.trail.length; i++) {
          ctx.lineTo(body.trail[i].x + centerX, body.trail[i].y + centerY);
        }
        
        ctx.stroke();
      }
    }
    
    // Draw bodies
    for (const body of bodiesRef.current) {
      const x = body.x + centerX;
      const y = body.y + centerY;
      
      // Body glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, body.radius * 2);
      gradient.addColorStop(0, body.color);
      gradient.addColorStop(0.5, body.color + '80');
      gradient.addColorStop(1, body.color + '00');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, body.radius * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Body core
      ctx.fillStyle = body.color;
      ctx.beginPath();
      ctx.arc(x, y, body.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Velocity vector
      if (showVelocityVectors) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + body.vx * 0.5, y + body.vy * 0.5);
        ctx.stroke();
        
        // Arrowhead
        const angle = Math.atan2(body.vy, body.vx);
        ctx.save();
        ctx.translate(x + body.vx * 0.5, y + body.vy * 0.5);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -4);
        ctx.lineTo(-8, 4);
        ctx.closePath();
        ctx.fillStyle = '#00ff00';
        ctx.fill();
        ctx.restore();
      }
    }
    
    // Draw center of mass
    if (centerOfMass && bodiesRef.current.length > 1) {
      const x = centerOfMass.x + centerX;
      const y = centerOfMass.y + centerY;
      
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + 10, y);
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x, y + 10);
      ctx.stroke();
    }
    
    // Draw preview for new body
    if (mouseRef.current.isDown && dragStartRef.current && placementMode === 'drag') {
      const startX = dragStartRef.current.x;
      const startY = dragStartRef.current.y;
      const endX = mouseRef.current.x;
      const endY = mouseRef.current.y;
      
      // Preview body
      ctx.fillStyle = getStarColor(newBodyMass[0]) + '80';
      ctx.beginPath();
      ctx.arc(startX, startY, Math.sqrt(newBodyMass[0]) * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Velocity vector
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Update physics
    if (isPlaying) {
      updatePhysics(0.016 * timeScale[0]); // 60 FPS
    }
    
    animationRef.current = requestAnimationFrame(render);
  };

  // Handle canvas resize
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mouseRef.current = { x, y, isDown: true };
    
    if (placementMode === 'drag') {
      dragStartRef.current = { x, y };
    } else {
      // Click mode - place body immediately
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const worldX = x - centerX;
      const worldY = y - centerY;
      
      const newBody = createBody(worldX, worldY, 0, 0, newBodyMass[0]);
      bodiesRef.current.push(newBody);
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mouseRef.current = { ...mouseRef.current, x, y };
  };

  // Handle mouse up
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseRef.current.isDown || !dragStartRef.current || placementMode !== 'drag') {
      mouseRef.current.isDown = false;
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const startX = dragStartRef.current.x - centerX;
    const startY = dragStartRef.current.y - centerY;
    const endX = mouseRef.current.x - centerX;
    const endY = mouseRef.current.y - centerY;
    
    const vx = (endX - startX) * 0.5;
    const vy = (endY - startY) * 0.5;
    
    const newBody = createBody(startX, startY, vx, vy, newBodyMass[0]);
    bodiesRef.current.push(newBody);
    
    mouseRef.current.isDown = false;
    dragStartRef.current = null;
  };

  // Clear all bodies
  const clearBodies = () => {
    bodiesRef.current = [];
    setBodyCount(0);
    setCenterOfMass(null);
  };

  // Reset simulation
  const reset = () => {
    clearBodies();
    loadPreset(presets[0]);
  };

  // Initialize on mount
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Load initial preset
    loadPreset(presets[0]);
    
    // Start render loop
    render();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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
              <Orbit className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-display font-semibold">N-Body Simulation</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Interactive gravitational physics simulation. Add celestial bodies, 
              watch them orbit, collide, and create complex gravitational interactions.
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
              onMouseLeave={() => { mouseRef.current.isDown = false; }}
              className="w-full h-[500px] bg-black rounded-lg shadow-2xl cursor-crosshair"
              style={{ imageRendering: 'crisp-edges' }}
            />
            
            {/* Info overlay */}
            <div className="absolute top-4 left-4 text-white text-sm space-y-1 bg-black/50 p-3 rounded">
              <div>Bodies: {bodyCount}</div>
              <div>Time Scale: {timeScale[0].toFixed(1)}x</div>
              {centerOfMass && bodyCount > 1 && (
                <div>Center of Mass: ✕</div>
              )}
            </div>

            {/* Controls overlay */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                size="icon"
                variant={isPlaying ? "default" : "outline"}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={clearBodies}
                title="Clear all bodies"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={reset}
                title="Reset to preset"
              >
                <RotateCcw className="h-4 w-4" />
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
            {/* Presets */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Presets</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {presets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-3 justify-start flex-col items-start"
                    onClick={() => {
                      clearBodies();
                      loadPreset(preset);
                    }}
                  >
                    <div className="font-semibold">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Settings */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Bodies
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Placement Mode</label>
                    <div className="flex gap-2">
                      <Badge
                        variant={placementMode === 'drag' ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => setPlacementMode('drag')}
                      >
                        Click & Drag (with velocity)
                      </Badge>
                      <Badge
                        variant={placementMode === 'click' ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => setPlacementMode('click')}
                      >
                        Click (stationary)
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">New Body Mass</label>
                      <span className="text-sm text-muted-foreground">{newBodyMass[0]}</span>
                    </div>
                    <Slider
                      value={newBodyMass}
                      onValueChange={setNewBodyMass}
                      min={10}
                      max={200}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {placementMode === 'drag' 
                      ? "Click and drag to create a body with initial velocity"
                      : "Click to place a stationary body"}
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Simulation Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Time Scale</label>
                      <span className="text-sm text-muted-foreground">{timeScale[0].toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={timeScale}
                      onValueChange={setTimeScale}
                      min={0.1}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Trail Length</label>
                      <span className="text-sm text-muted-foreground">{trailLength[0]}</span>
                    </div>
                    <Slider
                      value={trailLength}
                      onValueChange={setTrailLength}
                      min={0}
                      max={500}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Visualization</label>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={showVelocityVectors ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => setShowVelocityVectors(!showVelocityVectors)}
                      >
                        Velocity Vectors
                      </Badge>
                      <Badge
                        variant={showGravityField ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => setShowGravityField(!showGravityField)}
                      >
                        Gravity Field
                      </Badge>
                      <Badge
                        variant={collisionsEnabled ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => setCollisionsEnabled(!collisionsEnabled)}
                      >
                        Collisions
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Info */}
            <Card className="p-6 bg-muted/30">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    This simulation uses Newton's law of universal gravitation to calculate 
                    the forces between celestial bodies. Each body attracts every other body 
                    with a force proportional to their masses and inversely proportional to 
                    the square of the distance between them.
                  </p>
                  <p>
                    Try creating your own solar systems, binary stars, or chaotic multi-body 
                    interactions. Enable collisions to see bodies merge when they get too close.
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