import React, { useEffect, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  Play, 
  Pause, 
  Upload,
  Mic,
  Volume2,
  BarChart3,
  Radio,
  Waves,
  Circle
} from 'lucide-react';
import { motion } from 'framer-motion';

// Vertex shader for 3D visualization
const vertexShaderSource = `
  attribute vec3 a_position;
  attribute float a_frequency;
  
  uniform mat4 u_matrix;
  uniform float u_time;
  uniform float u_intensity;
  
  varying float v_frequency;
  varying vec3 v_position;
  
  void main() {
    vec3 pos = a_position;
    pos.y = a_frequency * u_intensity * 2.0;
    
    // Add wave motion
    pos.y += sin(u_time * 2.0 + pos.x * 0.5) * 0.1;
    
    gl_Position = u_matrix * vec4(pos, 1.0);
    v_frequency = a_frequency;
    v_position = pos;
  }
`;

// Fragment shader for coloring based on frequency
const fragmentShaderSource = `
  precision mediump float;
  
  varying float v_frequency;
  varying vec3 v_position;
  
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform float u_time;
  
  void main() {
    vec3 color;
    
    if (v_frequency < 0.33) {
      color = mix(u_color1, u_color2, v_frequency * 3.0);
    } else if (v_frequency < 0.66) {
      color = mix(u_color2, u_color3, (v_frequency - 0.33) * 3.0);
    } else {
      color = u_color3;
    }
    
    // Add glow effect
    float glow = v_frequency * 1.5;
    color += vec3(glow * 0.2);
    
    // Fade edges
    float edgeFade = 1.0 - abs(v_position.x) / 10.0;
    
    gl_FragColor = vec4(color, edgeFade);
  }
`;

type VisualizationType = 'bars' | 'waves' | 'circular' | 'particles';

export default function AudioVisualizerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUsingMic, setIsUsingMic] = useState(false);
  const [volume, setVolume] = useState([0.7]);
  const [sensitivity, setSensitivity] = useState([1.0]);
  const [smoothing, setSmoothing] = useState([0.8]);
  const [visualization, setVisualization] = useState<VisualizationType>('bars');
  const [colorScheme, setColorScheme] = useState(0);
  const [beatDetected, setBeatDetected] = useState(false);

  const colorSchemes = [
    {
      name: "Neon",
      colors: [[0.0, 1.0, 1.0], [1.0, 0.0, 1.0], [1.0, 1.0, 0.0]]
    },
    {
      name: "Fire",
      colors: [[1.0, 0.0, 0.0], [1.0, 0.5, 0.0], [1.0, 1.0, 0.0]]
    },
    {
      name: "Ocean",
      colors: [[0.0, 0.2, 0.8], [0.0, 0.6, 1.0], [0.0, 1.0, 1.0]]
    },
    {
      name: "Forest",
      colors: [[0.0, 0.4, 0.0], [0.0, 0.8, 0.2], [0.4, 1.0, 0.4]]
    },
    {
      name: "Galaxy",
      colors: [[0.4, 0.0, 0.8], [0.8, 0.0, 0.8], [1.0, 0.4, 1.0]]
    }
  ];

  // Create shader helper
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

  // Create program helper
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
    
    // Enable transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return true;
  };

  // Initialize audio context
  const initAudio = async (useMicrophone: boolean = false) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create analyser
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = smoothing[0];

      if (useMicrophone) {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        sourceRef.current = audioContext.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        setIsUsingMic(true);
      } else {
        // Use audio element
        if (audioElementRef.current) {
          // Disconnect existing source if any
          if (sourceRef.current) {
            sourceRef.current.disconnect();
          }
          
          // Create new source only if needed
          try {
            sourceRef.current = audioContext.createMediaElementSource(audioElementRef.current);
          } catch (e) {
            // Element might already be connected to another context
            console.log('Audio element already connected, reusing existing connection');
          }
          
          if (sourceRef.current) {
            sourceRef.current.connect(analyserRef.current);
            sourceRef.current.connect(audioContext.destination);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Audio initialization error:', error);
      return false;
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && audioElementRef.current) {
      const url = URL.createObjectURL(file);
      audioElementRef.current.src = url;
      audioElementRef.current.load();
      const success = await initAudio(false);
      if (success && !animationRef.current) {
        render();
      }
    }
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    if (isUsingMic) {
      // Stop microphone
      if (sourceRef.current && 'mediaStream' in sourceRef.current) {
        const stream = (sourceRef.current as MediaStreamAudioSourceNode & { mediaStream: MediaStream }).mediaStream;
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      sourceRef.current = null;
      setIsUsingMic(false);
      setIsPlaying(false);
    } else {
      // Start microphone
      const success = await initAudio(true);
      if (success) {
        setIsPlaying(true);
        if (!animationRef.current) {
          render();
        }
      }
    }
  };

  // Create 3D matrix for perspective
  const createMatrix = (aspect: number, time: number) => {
    const fov = Math.PI / 4;
    const near = 0.1;
    const far = 100;
    
    // Perspective matrix
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    const rangeInv = 1.0 / (near - far);
    
    const matrix = new Float32Array(16);
    matrix[0] = f / aspect;
    matrix[5] = f;
    matrix[10] = (near + far) * rangeInv;
    matrix[11] = -1;
    matrix[14] = near * far * rangeInv * 2;
    
    // Rotation
    const angle = time * 0.5;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    
    // Apply rotation to x and z
    const rotated = new Float32Array(16);
    rotated[0] = matrix[0] * c;
    rotated[2] = matrix[0] * s;
    rotated[5] = matrix[5];
    rotated[8] = -matrix[0] * s;
    rotated[10] = matrix[10] * c + matrix[14] * s;
    rotated[11] = matrix[11];
    rotated[14] = matrix[14] * c - matrix[10] * s;
    rotated[15] = 1;
    
    // Translation
    rotated[12] = 0;
    rotated[13] = -0.5;
    rotated[14] -= 5;
    
    return rotated;
  };

  // Render visualization
  const render = () => {
    const gl = glRef.current;
    const program = programRef.current;
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    
    if (!gl || !program || !analyser || !canvas) return;

    // Get frequency data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Check if we're getting audio data
    const maxValue = Math.max(...dataArray);
    if (maxValue === 0 && isPlaying) {
      console.log('Warning: No audio data detected');
    }

    // Detect beats
    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
    if (average > 128 * sensitivity[0]) {
      setBeatDetected(true);
      setTimeout(() => setBeatDetected(false), 100);
    }

    // Clear canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    // Set uniforms
    const colors = colorSchemes[colorScheme].colors;
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color1'), colors[0]);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color2'), colors[1]);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color3'), colors[2]);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), Date.now() * 0.001);
    gl.uniform1f(gl.getUniformLocation(program, 'u_intensity'), sensitivity[0]);

    // Create visualization based on type
    if (visualization === 'bars') {
      renderBars(gl, program, dataArray, canvas);
    } else if (visualization === 'waves') {
      renderWaves(gl, program, dataArray, canvas);
    } else if (visualization === 'circular') {
      renderCircular(gl, program, dataArray, canvas);
    } else if (visualization === 'particles') {
      renderParticles(gl, program, dataArray, canvas);
    }

    animationRef.current = requestAnimationFrame(render);
  };

  // Render bars visualization
  const renderBars = (gl: WebGLRenderingContext, program: WebGLProgram, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
    const barCount = 64;
    const positions: number[] = [];
    const frequencies: number[] = [];
    
    for (let i = 0; i < barCount; i++) {
      const x = (i / barCount - 0.5) * 20;
      const frequency = dataArray[Math.floor(i * dataArray.length / barCount)] / 255;
      
      // Create a bar (two triangles)
      const width = 20 / barCount * 0.8;
      
      // Triangle 1
      positions.push(x - width/2, 0, 0);
      positions.push(x + width/2, 0, 0);
      positions.push(x - width/2, 1, 0);
      
      // Triangle 2
      positions.push(x + width/2, 0, 0);
      positions.push(x + width/2, 1, 0);
      positions.push(x - width/2, 1, 0);
      
      // Frequency for each vertex
      for (let j = 0; j < 6; j++) {
        frequencies.push(frequency);
      }
    }
    
    // Create buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    
    const frequencyBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, frequencyBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(frequencies), gl.DYNAMIC_DRAW);
    
    const frequencyLocation = gl.getAttribLocation(program, 'a_frequency');
    gl.enableVertexAttribArray(frequencyLocation);
    gl.vertexAttribPointer(frequencyLocation, 1, gl.FLOAT, false, 0, 0);
    
    // Set matrix
    const matrix = createMatrix(canvas.width / canvas.height, Date.now() * 0.001);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_matrix'), false, matrix);
    
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
  };

  // Render waves visualization
  const renderWaves = (gl: WebGLRenderingContext, program: WebGLProgram, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
    const points = 128;
    const positions: number[] = [];
    const frequencies: number[] = [];
    
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < points; i++) {
        const x = (i / (points - 1) - 0.5) * 20;
        const frequency = dataArray[Math.floor(i * dataArray.length / points)] / 255;
        const z = layer * -2;
        
        positions.push(x, 0, z);
        frequencies.push(frequency * (1 - layer * 0.2));
      }
    }
    
    // Create line strip indices
    const indices: number[] = [];
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < points - 1; i++) {
        indices.push(layer * points + i);
        indices.push(layer * points + i + 1);
      }
    }
    
    // Create buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    
    const frequencyBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, frequencyBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(frequencies), gl.DYNAMIC_DRAW);
    
    const frequencyLocation = gl.getAttribLocation(program, 'a_frequency');
    gl.enableVertexAttribArray(frequencyLocation);
    gl.vertexAttribPointer(frequencyLocation, 1, gl.FLOAT, false, 0, 0);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    // Set matrix
    const matrix = createMatrix(canvas.width / canvas.height, Date.now() * 0.001);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_matrix'), false, matrix);
    
    // Draw
    gl.lineWidth(2);
    gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_SHORT, 0);
  };

  // Render circular visualization
  const renderCircular = (gl: WebGLRenderingContext, program: WebGLProgram, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
    const segments = 64;
    const positions: number[] = [];
    const frequencies: number[] = [];
    
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;
      const frequency = dataArray[Math.floor(i * dataArray.length / segments)] / 255;
      const radius = 3 + frequency * 2;
      
      // Center
      positions.push(0, 0, 0);
      frequencies.push(frequency * 0.5);
      
      // Edge point 1
      positions.push(Math.cos(angle1) * radius, Math.sin(angle1) * radius, 0);
      frequencies.push(frequency);
      
      // Edge point 2
      positions.push(Math.cos(angle2) * radius, Math.sin(angle2) * radius, 0);
      frequencies.push(frequency);
    }
    
    // Create buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    
    const frequencyBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, frequencyBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(frequencies), gl.DYNAMIC_DRAW);
    
    const frequencyLocation = gl.getAttribLocation(program, 'a_frequency');
    gl.enableVertexAttribArray(frequencyLocation);
    gl.vertexAttribPointer(frequencyLocation, 1, gl.FLOAT, false, 0, 0);
    
    // Set matrix with modified rotation
    const time = Date.now() * 0.001;
    const matrix = createMatrix(canvas.width / canvas.height, time * 0.3);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_matrix'), false, matrix);
    
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
  };

  // Render particles visualization
  const renderParticles = (gl: WebGLRenderingContext, program: WebGLProgram, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
    const particleCount = 512;
    const positions: number[] = [];
    const frequencies: number[] = [];
    const time = Date.now() * 0.001;
    
    for (let i = 0; i < particleCount; i++) {
      const frequencyIndex = Math.floor(i * dataArray.length / particleCount);
      const frequency = dataArray[frequencyIndex] / 255;
      
      // Particle position with some randomness
      const angle = (i / particleCount) * Math.PI * 2 + time * 0.1;
      const radius = 2 + frequency * 4 + Math.sin(time * 2 + i) * 0.5;
      const height = (Math.random() - 0.5) * 4 * frequency;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = height;
      
      // Create a small quad for each particle
      const size = 0.1 + frequency * 0.1;
      
      // Triangle 1
      positions.push(x - size, y - size, z);
      positions.push(x + size, y - size, z);
      positions.push(x - size, y + size, z);
      
      // Triangle 2
      positions.push(x + size, y - size, z);
      positions.push(x + size, y + size, z);
      positions.push(x - size, y + size, z);
      
      // Frequency for each vertex
      for (let j = 0; j < 6; j++) {
        frequencies.push(frequency);
      }
    }
    
    // Create buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    
    const frequencyBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, frequencyBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(frequencies), gl.DYNAMIC_DRAW);
    
    const frequencyLocation = gl.getAttribLocation(program, 'a_frequency');
    gl.enableVertexAttribArray(frequencyLocation);
    gl.vertexAttribPointer(frequencyLocation, 1, gl.FLOAT, false, 0, 0);
    
    // Set matrix
    const matrix = createMatrix(canvas.width / canvas.height, time);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_matrix'), false, matrix);
    
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
  };

  // Play/pause toggle
  const togglePlayPause = async () => {
    if (!audioElementRef.current) return;
    
    if (isPlaying) {
      audioElementRef.current.pause();
    } else {
      // Resume audio context if needed
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      try {
        await audioElementRef.current.play();
      } catch (error) {
        console.error('Playback error:', error);
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Handle canvas resize
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };

  // Update analyser settings
  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.smoothingTimeConstant = smoothing[0];
    }
  }, [smoothing]);

  // Update volume
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume[0];
    }
  }, [volume]);

  // Initialize on mount
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const success = initWebGL();
    if (success) {
      render();
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Clean up audio
      if (sourceRef.current && 'mediaStream' in sourceRef.current) {
        const stream = (sourceRef.current as MediaStreamAudioSourceNode & { mediaStream: MediaStream }).mediaStream;
        stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
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
              <Music className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-display font-semibold">Audio Visualizer</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time 3D audio visualization using WebGL and Web Audio API. 
              Upload a file or use your microphone to see sound come alive.
            </p>
          </motion.div>

          {/* Hidden audio element */}
          <audio ref={audioElementRef} className="hidden" />

          {/* Canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`mb-8 relative ${beatDetected ? 'animate-pulse' : ''}`}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-[500px] bg-black rounded-lg shadow-2xl"
              style={{ imageRendering: 'crisp-edges' }}
            />
            
            {/* Visualization type badges */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Badge variant={visualization === 'bars' ? 'default' : 'secondary'} 
                     className="cursor-pointer" 
                     onClick={() => setVisualization('bars')}>
                <BarChart3 className="h-3 w-3 mr-1" />
                Bars
              </Badge>
              <Badge variant={visualization === 'waves' ? 'default' : 'secondary'} 
                     className="cursor-pointer" 
                     onClick={() => setVisualization('waves')}>
                <Waves className="h-3 w-3 mr-1" />
                Waves
              </Badge>
              <Badge variant={visualization === 'circular' ? 'default' : 'secondary'} 
                     className="cursor-pointer" 
                     onClick={() => setVisualization('circular')}>
                <Circle className="h-3 w-3 mr-1" />
                Circular
              </Badge>
              <Badge variant={visualization === 'particles' ? 'default' : 'secondary'} 
                     className="cursor-pointer" 
                     onClick={() => setVisualization('particles')}>
                <Radio className="h-3 w-3 mr-1" />
                Particles
              </Badge>
            </div>

            {/* Beat indicator */}
            {beatDetected && (
              <div className="absolute top-4 left-4">
                <Badge variant="destructive" className="animate-bounce">
                  BEAT
                </Badge>
              </div>
            )}
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Audio source controls */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Audio Source</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label htmlFor="audio-upload" className="block">
                    <Button variant="outline" className="w-full cursor-pointer" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Audio File
                      </span>
                    </Button>
                  </label>
                  <input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                
                <Button
                  variant={isUsingMic ? "destructive" : "outline"}
                  onClick={toggleMicrophone}
                  className="flex-1 min-w-[200px]"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {isUsingMic ? 'Stop Microphone' : 'Use Microphone'}
                </Button>
                
                <Button
                  variant={isPlaying ? "destructive" : "default"}
                  onClick={togglePlayPause}
                  disabled={!audioElementRef.current?.src && !isUsingMic}
                  className="flex-1 min-w-[200px]"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Visualization controls */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Audio Settings</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Volume</label>
                      <span className="text-sm text-muted-foreground">{Math.round(volume[0] * 100)}%</span>
                    </div>
                    <Slider
                      value={volume}
                      onValueChange={setVolume}
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Sensitivity</label>
                      <span className="text-sm text-muted-foreground">{Math.round(sensitivity[0] * 100)}%</span>
                    </div>
                    <Slider
                      value={sensitivity}
                      onValueChange={setSensitivity}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Smoothing</label>
                      <span className="text-sm text-muted-foreground">{Math.round(smoothing[0] * 100)}%</span>
                    </div>
                    <Slider
                      value={smoothing}
                      onValueChange={setSmoothing}
                      min={0}
                      max={0.95}
                      step={0.05}
                      className="w-full"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Visual Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Color Scheme</label>
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
                  </div>
                </div>
              </Card>
            </div>

            {/* Info */}
            <Card className="p-6 bg-muted/30">
              <div className="flex items-start gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    This visualizer uses the Web Audio API to analyze audio frequencies in real-time and 
                    WebGL to render 3D graphics based on the audio data.
                  </p>
                  <p>
                    For best results, use high-quality audio files with a good dynamic range. 
                    The visualizer responds to bass, mid, and treble frequencies differently.
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