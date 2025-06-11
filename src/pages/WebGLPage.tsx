import { useEffect, useRef, useState } from 'react';
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
  Settings,
  Zap,
  Eye,
  MousePointer
} from 'lucide-react';
import { motion } from 'framer-motion';

// Vertex shader source
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// Fragment shader for fluid simulation
const fragmentShaderSource = `
  precision mediump float;
  
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_intensity;
  uniform float u_speed;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  
  varying vec2 v_texCoord;
  
  // Noise function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
  }
  
  // Fractal Brownian Motion
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 mouse = u_mouse / u_resolution.xy;
    
    // Create fluid-like distortion
    vec2 pos = st * 3.0;
    pos.x += u_time * u_speed * 0.1;
    
    // Mouse interaction
    float mouseDistance = distance(st, mouse);
    float mouseEffect = 1.0 - smoothstep(0.0, 0.3, mouseDistance);
    
    // Generate flowing patterns
    float n1 = fbm(pos + u_time * u_speed * 0.15);
    float n2 = fbm(pos + vec2(n1 * 2.0) + u_time * u_speed * 0.1);
    float n3 = fbm(pos + vec2(n2 * 1.5) + u_time * u_speed * 0.05);
    
    // Apply mouse distortion
    n2 += mouseEffect * u_intensity * 0.5;
    
    // Create flowing colors
    vec3 color = mix(u_color1, u_color2, n1);
    color = mix(color, u_color3, n2);
    
    // Add highlights and depth
    float highlight = smoothstep(0.4, 0.8, n3);
    color += highlight * 0.3;
    
    // Add mouse glow effect
    vec3 mouseGlow = vec3(1.0, 0.8, 0.3) * mouseEffect * u_intensity;
    color += mouseGlow;
    
    // Vignette effect
    float vignette = 1.0 - distance(st, vec2(0.5)) * 0.8;
    color *= vignette;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function WebGLPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [intensity, setIntensity] = useState([0.8]);
  const [speed, setSpeed] = useState([1.0]);
  const [colorScheme, setColorScheme] = useState(0);
  const [showControls, setShowControls] = useState(false);

  const colorSchemes = [
    {
      name: "Ocean",
      colors: [[0.1, 0.3, 0.8], [0.0, 0.8, 0.9], [0.3, 0.9, 1.0]]
    },
    {
      name: "Sunset",
      colors: [[0.9, 0.3, 0.1], [0.9, 0.6, 0.1], [1.0, 0.8, 0.3]]
    },
    {
      name: "Forest",
      colors: [[0.1, 0.4, 0.2], [0.3, 0.7, 0.2], [0.6, 0.9, 0.4]]
    },
    {
      name: "Purple Haze",
      colors: [[0.4, 0.1, 0.8], [0.7, 0.2, 0.9], [0.9, 0.5, 1.0]]
    },
    {
      name: "Fire",
      colors: [[0.8, 0.1, 0.0], [1.0, 0.4, 0.0], [1.0, 0.8, 0.2]]
    }
  ];

  // Initialize WebGL
  const initWebGL = () => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return false;
    }

    glRef.current = gl;

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return false;

    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return false;

    programRef.current = program;

    // Set up geometry (full screen quad)
    const positions = new Float32Array([
      -1, -1,  0, 0,
       1, -1,  1, 0,
      -1,  1,  0, 1,
       1,  1,  1, 1
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
    
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);

    return true;
  };

  const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  };

  const render = () => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    
    if (!gl || !program || !canvas) return;

    // Resize canvas to match display size
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      gl.viewport(0, 0, displayWidth, displayHeight);
    }

    gl.useProgram(program);

    // Set uniforms
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
    const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
    const speedLocation = gl.getUniformLocation(program, 'u_speed');
    const color1Location = gl.getUniformLocation(program, 'u_color1');
    const color2Location = gl.getUniformLocation(program, 'u_color2');
    const color3Location = gl.getUniformLocation(program, 'u_color3');

    const currentTime = (Date.now() - startTimeRef.current) / 1000;
    const currentColors = colorSchemes[colorScheme].colors;

    gl.uniform1f(timeLocation, isPlaying ? currentTime : 0);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y);
    gl.uniform1f(intensityLocation, intensity[0]);
    gl.uniform1f(speedLocation, speed[0]);
    gl.uniform3fv(color1Location, currentColors[0]);
    gl.uniform3fv(color2Location, currentColors[1]);
    gl.uniform3fv(color3Location, currentColors[2]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(render);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: event.clientX - rect.left,
      y: canvas.height - (event.clientY - rect.top) // Flip Y coordinate
    };
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      startTimeRef.current = Date.now();
      render();
    }
  };

  const reset = () => {
    startTimeRef.current = Date.now();
    mouseRef.current = { x: 0, y: 0 };
  };

  const nextColorScheme = () => {
    setColorScheme((prev) => (prev + 1) % colorSchemes.length);
  };

  useEffect(() => {
    if (initWebGL()) {
      render();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isPlaying) {
      render();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, intensity, speed, colorScheme]);

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
              <Zap className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-display font-semibold">WebGL Playground</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Interactive fluid simulation powered by WebGL shaders. Move your mouse to create ripples and distortions in the flowing patterns.
            </p>
          </motion.div>

          {/* WebGL Canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mb-8"
          >
            <Card className="overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-[70vh] cursor-crosshair"
                onMouseMove={handleMouseMove}
              />
              
              {/* Overlay Controls */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={togglePlayPause}
                  className="bg-black/20 backdrop-blur-sm hover:bg-black/30"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  onClick={reset}
                  className="bg-black/20 backdrop-blur-sm hover:bg-black/30"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowControls(!showControls)}
                  className="bg-black/20 backdrop-blur-sm hover:bg-black/30"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              <div className="absolute top-4 right-4">
                <Badge className="bg-black/20 backdrop-blur-sm text-white">
                  {colorSchemes[colorScheme].name}
                </Badge>
              </div>

              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/80 text-sm">
                <MousePointer className="h-4 w-4" />
                <span>Move mouse to interact</span>
              </div>
            </Card>
          </motion.div>

          {/* Controls Panel */}
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Controls
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Intensity</label>
                    <Slider
                      value={intensity}
                      onValueChange={setIntensity}
                      min={0}
                      max={2}
                      step={0.1}
                      className="mb-2"
                    />
                    <span className="text-xs text-muted-foreground">{intensity[0].toFixed(1)}</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Speed</label>
                    <Slider
                      value={speed}
                      onValueChange={setSpeed}
                      min={0}
                      max={3}
                      step={0.1}
                      className="mb-2"
                    />
                    <span className="text-xs text-muted-foreground">{speed[0].toFixed(1)}</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Color Scheme</label>
                    <Button
                      onClick={nextColorScheme}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      <Palette className="h-4 w-4" />
                      {colorSchemes[colorScheme].name}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Technical Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                How It Works
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Fragment Shaders:</strong> GPU-accelerated pixel processing</li>
                <li>• <strong>Fractal Noise:</strong> Multiple octaves of Perlin noise create organic patterns</li>
                <li>• <strong>Mouse Interaction:</strong> Real-time distortion based on cursor position</li>
                <li>• <strong>Color Mixing:</strong> Smooth transitions between multiple color layers</li>
                <li>• <strong>Time Animation:</strong> Continuous evolution of the fluid patterns</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Features
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Real-time Rendering:</strong> 60fps fluid simulation</li>
                <li>• <strong>Interactive Controls:</strong> Adjust intensity, speed, and colors</li>
                <li>• <strong>Multiple Themes:</strong> 5 different color schemes</li>
                <li>• <strong>Mouse Effects:</strong> Dynamic distortion and glow effects</li>
                <li>• <strong>Responsive Design:</strong> Adapts to any screen size</li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}