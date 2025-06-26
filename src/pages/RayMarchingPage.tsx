import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Shapes,
  Play,
  Pause,
  RotateCcw,
  Camera,
  Lightbulb,
  Layers,
  Move3d,
  Sparkles,
  Box,
  Circle,
  Triangle,
} from 'lucide-react'
import { motion } from 'framer-motion'

// Vertex shader for fullscreen quad
const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_uv = a_position * 0.5 + 0.5;
  }
`

// Ray marching fragment shader
const fragmentShaderSource = `
  precision mediump float;
  
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_cameraPos;
  uniform vec2 u_mouse;
  uniform int u_scene;
  uniform float u_lightIntensity;
  uniform float u_shadowSoftness;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform float u_metallic;
  uniform float u_roughness;
  
  varying vec2 v_uv;
  
  #define MAX_STEPS 100
  #define MAX_DIST 100.0
  #define SURF_DIST 0.001
  #define PI 3.14159265359
  
  // Rotation matrix
  mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
      vec3(1, 0, 0),
      vec3(0, c, -s),
      vec3(0, s, c)
    );
  }
  
  mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
      vec3(c, 0, s),
      vec3(0, 1, 0),
      vec3(-s, 0, c)
    );
  }
  
  // SDF primitives
  float sdSphere(vec3 p, float r) {
    return length(p) - r;
  }
  
  float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
  }
  
  float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
  }
  
  float sdCylinder(vec3 p, float h, float r) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
  }
  
  float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    float m = p.x + p.y + p.z - s;
    vec3 q;
    if(3.0 * p.x < m) q = p.xyz;
    else if(3.0 * p.y < m) q = p.yzx;
    else if(3.0 * p.z < m) q = p.zxy;
    else return m * 0.57735027;
    
    float k = clamp(0.5 * (q.z - q.y + s), 0.0, s);
    return length(vec3(q.x, q.y - s + k, q.z - k));
  }
  
  // SDF operations
  float opUnion(float d1, float d2) {
    return min(d1, d2);
  }
  
  float opSubtraction(float d1, float d2) {
    return max(-d1, d2);
  }
  
  float opIntersection(float d1, float d2) {
    return max(d1, d2);
  }
  
  float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
  }
  
  // Fractal patterns
  float sdMenger(vec3 p) {
    float d = sdBox(p, vec3(1.0));
    float s = 1.0;
    for(int m = 0; m < 4; m++) {
      vec3 a = mod(p * s, 2.0) - 1.0;
      s *= 3.0;
      vec3 r = abs(1.0 - 3.0 * abs(a));
      
      float da = max(r.x, r.y);
      float db = max(r.y, r.z);
      float dc = max(r.z, r.x);
      float c = (min(da, min(db, dc)) - 1.0) / s;
      
      d = max(d, c);
    }
    return d;
  }
  
  // Scene 1: Basic Shapes
  float scene1(vec3 p) {
    vec3 p1 = p - vec3(-2.0, 0.0, 0.0);
    p1 = rotateY(u_time) * p1;
    float sphere = sdSphere(p1, 1.0);
    
    vec3 p2 = p - vec3(2.0, 0.0, 0.0);
    p2 = rotateX(u_time * 0.7) * rotateY(u_time * 0.5) * p2;
    float box = sdBox(p2, vec3(0.8));
    
    vec3 p3 = p - vec3(0.0, 0.0, 0.0);
    p3 = rotateX(u_time * 0.4) * p3;
    float torus = sdTorus(p3, vec2(1.0, 0.3));
    
    return opSmoothUnion(opSmoothUnion(sphere, box, 0.5), torus, 0.5);
  }
  
  // Scene 2: Complex Shapes
  float scene2(vec3 p) {
    vec3 p1 = p - vec3(0.0, 0.0, 0.0);
    p1 = rotateY(u_time * 0.3) * rotateX(u_time * 0.2) * p1;
    float octahedron = sdOctahedron(p1, 1.5);
    
    vec3 p2 = p - vec3(0.0, 0.0, 0.0);
    float cylinder = sdCylinder(p2, 0.8, 0.4);
    
    float shape = opSubtraction(cylinder, octahedron);
    
    // Add orbiting spheres
    for(int i = 0; i < 3; i++) {
      float angle = float(i) * 2.0 * PI / 3.0 + u_time;
      vec3 offset = vec3(cos(angle) * 2.5, sin(u_time * 2.0 + float(i)) * 0.5, sin(angle) * 2.5);
      float sphere = sdSphere(p - offset, 0.3);
      shape = opSmoothUnion(shape, sphere, 0.3);
    }
    
    return shape;
  }
  
  // Scene 3: Fractal
  float scene3(vec3 p) {
    vec3 p1 = p;
    p1 = rotateY(u_time * 0.2) * rotateX(u_time * 0.15) * p1;
    return sdMenger(p1 * 0.5) * 2.0;
  }
  
  // Scene 4: Metaballs
  float scene4(vec3 p) {
    float shape = 100.0;
    
    for(int i = 0; i < 5; i++) {
      float t = u_time + float(i) * 0.5;
      vec3 offset = vec3(
        sin(t * 1.3) * 2.0,
        cos(t * 1.7) * 1.5,
        sin(t * 2.1) * 2.0
      );
      float sphere = sdSphere(p - offset, 0.8);
      shape = opSmoothUnion(shape, sphere, 0.6);
    }
    
    return shape;
  }
  
  // Main scene function
  float getSceneDist(vec3 p) {
    float ground = p.y + 3.0;
    float shape;
    
    if(u_scene == 0) {
      shape = scene1(p);
    } else if(u_scene == 1) {
      shape = scene2(p);
    } else if(u_scene == 2) {
      shape = scene3(p);
    } else {
      shape = scene4(p);
    }
    
    return opUnion(ground, shape);
  }
  
  // Get material properties
  vec3 getMaterial(vec3 p) {
    float ground = p.y + 3.0;
    
    if(ground < 0.01) {
      // Ground material
      float checker = mod(floor(p.x) + floor(p.z), 2.0);
      return mix(vec3(0.1), vec3(0.2), checker);
    }
    
    // Object material with color gradient
    float t = (p.y + 2.0) / 4.0;
    if(t < 0.33) {
      return mix(u_color1, u_color2, t * 3.0);
    } else if(t < 0.66) {
      return mix(u_color2, u_color3, (t - 0.33) * 3.0);
    }
    return u_color3;
  }
  
  // Ray marching
  float rayMarch(vec3 ro, vec3 rd) {
    float dO = 0.0;
    
    for(int i = 0; i < MAX_STEPS; i++) {
      vec3 p = ro + rd * dO;
      float dS = getSceneDist(p);
      dO += dS;
      if(dO > MAX_DIST || dS < SURF_DIST) break;
    }
    
    return dO;
  }
  
  // Get normal
  vec3 getNormal(vec3 p) {
    float d = getSceneDist(p);
    vec2 e = vec2(0.001, 0.0);
    
    vec3 n = d - vec3(
      getSceneDist(p - e.xyy),
      getSceneDist(p - e.yxy),
      getSceneDist(p - e.yyx)
    );
    
    return normalize(n);
  }
  
  // Soft shadows
  float getSoftShadow(vec3 p, vec3 lightDir, float k) {
    float res = 1.0;
    float t = 0.01;
    
    for(int i = 0; i < 32; i++) {
      float d = getSceneDist(p + lightDir * t);
      if(d < SURF_DIST) return 0.0;
      res = min(res, k * d / t);
      t += d;
      if(t > 10.0) break;
    }
    
    return clamp(res, 0.0, 1.0);
  }
  
  // Ambient occlusion
  float getAO(vec3 p, vec3 n) {
    float occ = 0.0;
    float sca = 1.0;
    for(int i = 0; i < 5; i++) {
      float h = 0.01 + 0.12 * float(i) / 4.0;
      float d = getSceneDist(p + h * n);
      occ += (h - d) * sca;
      sca *= 0.95;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
  }
  
  // PBR lighting calculation
  vec3 calculateLighting(vec3 p, vec3 n, vec3 viewDir, vec3 baseColor) {
    vec3 lightPos = vec3(5.0, 5.0, -5.0);
    vec3 lightDir = normalize(lightPos - p);
    vec3 halfwayDir = normalize(lightDir + viewDir);
    
    // Diffuse
    float NdotL = max(dot(n, lightDir), 0.0);
    vec3 diffuse = baseColor * NdotL;
    
    // Specular (Blinn-Phong approximation for simplicity)
    float spec = pow(max(dot(n, halfwayDir), 0.0), 32.0 / u_roughness);
    vec3 specular = vec3(1.0) * spec * u_metallic;
    
    // Shadows
    float shadow = getSoftShadow(p + n * SURF_DIST * 2.0, lightDir, u_shadowSoftness);
    
    // Ambient occlusion
    float ao = getAO(p, n);
    
    // Combine
    vec3 ambient = baseColor * 0.1;
    vec3 color = ambient + (diffuse + specular) * shadow * u_lightIntensity;
    color *= ao;
    
    // Rim lighting
    float rim = 1.0 - max(dot(n, viewDir), 0.0);
    rim = pow(rim, 2.0);
    color += rim * baseColor * 0.2;
    
    return color;
  }
  
  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec2 mouse = (u_mouse - 0.5) * 2.0;
    
    // Camera setup
    vec3 ro = u_cameraPos;
    ro.x += mouse.x * 5.0;
    ro.y += mouse.y * 2.0;
    
    vec3 lookAt = vec3(0.0, 0.0, 0.0);
    vec3 forward = normalize(lookAt - ro);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up = cross(forward, right);
    
    vec3 rd = normalize(forward + uv.x * right + uv.y * up);
    
    // Ray march
    float d = rayMarch(ro, rd);
    
    vec3 color = vec3(0.02, 0.02, 0.03); // Background
    
    if(d < MAX_DIST) {
      vec3 p = ro + rd * d;
      vec3 n = getNormal(p);
      vec3 baseColor = getMaterial(p);
      
      color = calculateLighting(p, n, -rd, baseColor);
      
      // Fog
      float fog = 1.0 - exp(-d * 0.02);
      color = mix(color, vec3(0.02, 0.02, 0.03), fog);
    }
    
    // Gamma correction
    color = pow(color, vec3(0.4545));
    
    gl_FragColor = vec4(color, 1.0);
  }
`

export default function RayMarchingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const animationRef = useRef<number | null>(null)
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 })
  const startTimeRef = useRef<number>(Date.now())
  const renderRef = useRef<(() => void) | null>(null)

  const [isPlaying, setIsPlaying] = useState(true)
  const [currentScene, setCurrentScene] = useState(0)
  const [cameraDistance, setCameraDistance] = useState([5])
  const [lightIntensity, setLightIntensity] = useState([1.0])
  const [shadowSoftness, setShadowSoftness] = useState([8.0])
  const [metallic, setMetallic] = useState([0.5])
  const [roughness, setRoughness] = useState([0.5])
  const [colorScheme, setColorScheme] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)

  const scenes = [
    {
      name: 'Basic Shapes',
      description: 'Fundamental 3D primitives with smooth blending',
      icon: Shapes,
    },
    {
      name: 'Complex Objects',
      description: 'Boolean operations and orbiting elements',
      icon: Box,
    },
    {
      name: 'Menger Sponge',
      description: 'Fractal geometry with infinite detail',
      icon: Layers,
    },
    {
      name: 'Metaballs',
      description: 'Organic shapes with fluid motion',
      icon: Circle,
    },
  ]

  const colorSchemes = useMemo(
    () => [
      {
        name: 'Metal',
        colors: [
          [0.5, 0.5, 0.6],
          [0.7, 0.7, 0.8],
          [0.9, 0.9, 1.0],
        ],
      },
      {
        name: 'Gold',
        colors: [
          [0.8, 0.5, 0.2],
          [0.9, 0.7, 0.3],
          [1.0, 0.9, 0.5],
        ],
      },
      {
        name: 'Gem',
        colors: [
          [0.1, 0.4, 0.8],
          [0.3, 0.6, 0.9],
          [0.5, 0.8, 1.0],
        ],
      },
      {
        name: 'Emerald',
        colors: [
          [0.1, 0.5, 0.2],
          [0.2, 0.7, 0.3],
          [0.3, 0.9, 0.4],
        ],
      },
      {
        name: 'Ruby',
        colors: [
          [0.8, 0.1, 0.2],
          [0.9, 0.2, 0.3],
          [1.0, 0.3, 0.4],
        ],
      },
    ],
    []
  )

  // Create shader helper
  const createShader = useCallback(
    (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null

      gl.shaderSource(shader, source)
      gl.compileShader(shader)

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }

      return shader
    },
    []
  )

  // Create program helper
  const createProgram = useCallback(
    (
      gl: WebGLRenderingContext,
      vertexShader: WebGLShader,
      fragmentShader: WebGLShader
    ) => {
      const program = gl.createProgram()
      if (!program) return null

      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
        return null
      }

      return program
    },
    []
  )

  // Initialize WebGL
  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return false

    const gl = canvas.getContext('webgl')
    if (!gl) {
      console.error('WebGL not supported')
      return false
    }

    glRef.current = gl

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    )

    if (!vertexShader || !fragmentShader) return false

    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader)
    if (!program) return false

    programRef.current = program

    // Set up geometry (fullscreen quad)
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    return true
  }, [createShader, createProgram])

  // Render frame
  const render = useCallback(() => {
    const gl = glRef.current
    const program = programRef.current
    const canvas = canvasRef.current

    if (!gl || !program || !canvas || !isPlaying) return

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(program)

    // Set uniforms
    const time = (Date.now() - startTimeRef.current) * 0.001
    gl.uniform2f(
      gl.getUniformLocation(program, 'u_resolution'),
      canvas.width,
      canvas.height
    )
    gl.uniform1f(
      gl.getUniformLocation(program, 'u_time'),
      autoRotate ? time : 0
    )
    gl.uniform2f(
      gl.getUniformLocation(program, 'u_mouse'),
      mouseRef.current.x,
      mouseRef.current.y
    )
    gl.uniform1i(gl.getUniformLocation(program, 'u_scene'), currentScene)
    gl.uniform1f(
      gl.getUniformLocation(program, 'u_lightIntensity'),
      lightIntensity[0]
    )
    gl.uniform1f(
      gl.getUniformLocation(program, 'u_shadowSoftness'),
      shadowSoftness[0]
    )
    gl.uniform1f(gl.getUniformLocation(program, 'u_metallic'), metallic[0])
    gl.uniform1f(gl.getUniformLocation(program, 'u_roughness'), roughness[0])

    // Camera position
    const camAngle = autoRotate ? time * 0.3 : 0
    const camX = Math.cos(camAngle) * cameraDistance[0]
    const camZ = Math.sin(camAngle) * cameraDistance[0]
    gl.uniform3f(gl.getUniformLocation(program, 'u_cameraPos'), camX, 2, camZ)

    // Colors
    const colors = colorSchemes[colorScheme].colors
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color1'), colors[0])
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color2'), colors[1])
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color3'), colors[2])

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    if (renderRef.current) {
      animationRef.current = requestAnimationFrame(renderRef.current)
    }
  }, [
    isPlaying,
    autoRotate,
    currentScene,
    lightIntensity,
    shadowSoftness,
    metallic,
    roughness,
    cameraDistance,
    colorSchemes,
    colorScheme,
  ])

  // Update render ref
  renderRef.current = render

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
  }, [])

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: 1 - (e.clientY - rect.top) / rect.height,
    }
  }

  // Reset camera
  const resetCamera = () => {
    setCameraDistance([5])
    mouseRef.current = { x: 0.5, y: 0.5 }
  }

  // Initialize on mount
  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)

    const success = initWebGL()
    if (success) {
      render()
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [handleResize, initWebGL, render])

  // Update render when settings change
  useEffect(() => {
    if (isPlaying && !animationRef.current) {
      render()
    }
  }, [isPlaying, render])

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
              <Shapes className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-display font-semibold">
                Ray Marching Explorer
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore 3D scenes rendered entirely in a fragment shader using ray
              marching. Features soft shadows, ambient occlusion, and PBR
              materials.
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
              onMouseMove={handleMouseMove}
              className="w-full h-[500px] bg-black rounded-lg shadow-2xl cursor-move"
              style={{ imageRendering: 'crisp-edges' }}
            />

            {/* Scene selector */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {scenes.map((scene, index) => {
                const Icon = scene.icon
                return (
                  <Badge
                    key={index}
                    variant={currentScene === index ? 'default' : 'secondary'}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => setCurrentScene(index)}
                  >
                    <Icon className="h-3 w-3" />
                    {scene.name}
                  </Badge>
                )
              })}
            </div>

            {/* Controls overlay */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                size="icon"
                variant={autoRotate ? 'default' : 'outline'}
                onClick={() => setAutoRotate(!autoRotate)}
                title="Toggle auto-rotation"
              >
                <Move3d className="h-4 w-4" />
              </Button>
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
              <Button size="icon" variant="outline" onClick={resetCamera}>
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
            {/* Scene info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">
                {scenes[currentScene].name}
              </h3>
              <p className="text-muted-foreground">
                {scenes[currentScene].description}
              </p>
            </Card>

            {/* Settings */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Camera Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Distance</label>
                      <span className="text-sm text-muted-foreground">
                        {cameraDistance[0].toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={cameraDistance}
                      onValueChange={setCameraDistance}
                      min={2}
                      max={15}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click and drag on the canvas to look around
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Lighting Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">
                        Light Intensity
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {(lightIntensity[0] * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={lightIntensity}
                      onValueChange={setLightIntensity}
                      min={0.2}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">
                        Shadow Softness
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {shadowSoftness[0].toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={shadowSoftness}
                      onValueChange={setShadowSoftness}
                      min={1}
                      max={32}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Material Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Metallic</label>
                      <span className="text-sm text-muted-foreground">
                        {(metallic[0] * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={metallic}
                      onValueChange={setMetallic}
                      min={0}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Roughness</label>
                      <span className="text-sm text-muted-foreground">
                        {(roughness[0] * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={roughness}
                      onValueChange={setRoughness}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Color Scheme</h3>
                <div className="flex flex-wrap gap-2">
                  {colorSchemes.map((scheme, index) => (
                    <Badge
                      key={index}
                      variant={colorScheme === index ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => setColorScheme(index)}
                    >
                      {scheme.name}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>

            {/* Info */}
            <Card className="p-6 bg-muted/30">
              <div className="flex items-start gap-3">
                <Shapes className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Ray marching is a technique for rendering 3D scenes by
                    stepping along rays and evaluating signed distance functions
                    (SDFs). This allows for complex geometry and effects that
                    would be difficult with traditional polygon rendering.
                  </p>
                  <p>
                    The entire scene is calculated per-pixel in real-time,
                    including lighting, shadows, and ambient occlusion. Try
                    different scenes and materials to see the variety of effects
                    possible with this technique.
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
