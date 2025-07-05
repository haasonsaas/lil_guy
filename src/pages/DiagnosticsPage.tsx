import React, { useCallback, useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Monitor,
  Cpu,
  Globe,
  Zap,
  Volume2,
  Image,
  Database,
  RefreshCw,
  Code2,
} from 'lucide-react'

interface DiagnosticTest {
  name: string
  status: 'pending' | 'success' | 'error' | 'warning'
  message: string
  details?: string
  icon: React.ComponentType<{ className?: string }>
}

export default function DiagnosticsPage() {
  const [tests, setTests] = useState<DiagnosticTest[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [browserInfo, setBrowserInfo] = useState<
    Record<string, string | number | boolean>
  >({})

  useEffect(() => {
    // Gather browser info
    const info: Record<string, string | number | boolean> = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio || 1,
    }
    setBrowserInfo(info)

    // Auto-run tests on mount
    runDiagnostics()
  }, [runDiagnostics])

  const runDiagnostics = useCallback(async () => {
    setIsRunning(true)
    const testResults: DiagnosticTest[] = []

    // Test 1: WebGL Support
    const webglTest = testWebGL()
    testResults.push(webglTest)
    setTests([...testResults])

    // Test 2: Canvas Support
    const canvasTest = testCanvas()
    testResults.push(canvasTest)
    setTests([...testResults])

    // Test 3: Audio API Support
    const audioTest = testAudioAPI()
    testResults.push(audioTest)
    setTests([...testResults])

    // Test 4: Local Storage
    const storageTest = testLocalStorage()
    testResults.push(storageTest)
    setTests([...testResults])

    // Test 5: Service Worker Support
    const swTest = testServiceWorker()
    testResults.push(swTest)
    setTests([...testResults])

    // Test 6: Performance API
    const perfTest = testPerformanceAPI()
    testResults.push(perfTest)
    setTests([...testResults])

    // Test 7: Animation Frame
    const animationTest = await testAnimationFrame()
    testResults.push(animationTest)
    setTests([...testResults])

    // Test 8: WebP Support
    const webpTest = await testWebPSupport()
    testResults.push(webpTest)
    setTests([...testResults])

    // Test 9: Network Speed
    const networkTest = await testNetworkSpeed()
    testResults.push(networkTest)
    setTests([...testResults])

    setIsRunning(false)
  }, [])

  const testWebGL = (): DiagnosticTest => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

      if (!gl) {
        return {
          name: 'WebGL Support',
          status: 'error',
          message: 'WebGL not supported',
          details:
            'Your browser does not support WebGL, which is required for 3D experiments',
          icon: Cpu,
        }
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      const vendor = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : 'Unknown'
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : 'Unknown'

      return {
        name: 'WebGL Support',
        status: 'success',
        message: 'WebGL is supported',
        details: `Vendor: ${vendor}, Renderer: ${renderer}`,
        icon: Cpu,
      }
    } catch (error) {
      return {
        name: 'WebGL Support',
        status: 'error',
        message: 'WebGL test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        icon: Cpu,
      }
    }
  }

  const testCanvas = (): DiagnosticTest => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        return {
          name: 'Canvas 2D Support',
          status: 'error',
          message: 'Canvas 2D not supported',
          details: 'Your browser does not support Canvas 2D',
          icon: Image,
        }
      }

      // Test basic drawing
      ctx.fillRect(0, 0, 10, 10)

      return {
        name: 'Canvas 2D Support',
        status: 'success',
        message: 'Canvas 2D is supported',
        details: 'Canvas 2D context is available and functional',
        icon: Image,
      }
    } catch (error) {
      return {
        name: 'Canvas 2D Support',
        status: 'error',
        message: 'Canvas test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        icon: Image,
      }
    }
  }

  const testAudioAPI = (): DiagnosticTest => {
    try {
      const AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext

      if (!AudioContext) {
        return {
          name: 'Web Audio API',
          status: 'error',
          message: 'Web Audio API not supported',
          details: 'Your browser does not support the Web Audio API',
          icon: Volume2,
        }
      }

      const context = new AudioContext()
      const state = context.state

      return {
        name: 'Web Audio API',
        status: state === 'suspended' ? 'warning' : 'success',
        message: `Web Audio API is supported (state: ${state})`,
        details:
          state === 'suspended'
            ? 'Audio context is suspended. User interaction may be required to start audio.'
            : 'Audio context is ready',
        icon: Volume2,
      }
    } catch (error) {
      return {
        name: 'Web Audio API',
        status: 'error',
        message: 'Audio API test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        icon: Volume2,
      }
    }
  }

  const testLocalStorage = (): DiagnosticTest => {
    try {
      const testKey = '__diagnostic_test__'
      localStorage.setItem(testKey, 'test')
      const value = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)

      if (value !== 'test') {
        throw new Error('LocalStorage read/write failed')
      }

      return {
        name: 'LocalStorage',
        status: 'success',
        message: 'LocalStorage is available',
        details: 'LocalStorage is working correctly',
        icon: Database,
      }
    } catch (error) {
      return {
        name: 'LocalStorage',
        status: 'error',
        message: 'LocalStorage not available',
        details:
          'This might be due to private browsing mode or storage quota exceeded',
        icon: Database,
      }
    }
  }

  const testServiceWorker = (): DiagnosticTest => {
    if (!('serviceWorker' in navigator)) {
      return {
        name: 'Service Worker',
        status: 'warning',
        message: 'Service Worker not supported',
        details: 'Your browser does not support Service Workers',
        icon: Globe,
      }
    }

    return {
      name: 'Service Worker',
      status: 'success',
      message: 'Service Worker is supported',
      details: 'Service Worker API is available',
      icon: Globe,
    }
  }

  const testPerformanceAPI = (): DiagnosticTest => {
    if (!window.performance || !window.performance.now) {
      return {
        name: 'Performance API',
        status: 'error',
        message: 'Performance API not supported',
        details: 'High-resolution timing not available',
        icon: Zap,
      }
    }

    const memory = (
      performance as unknown as {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number }
      }
    ).memory
    const memoryInfo = memory
      ? `Heap: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB / ${(memory.totalJSHeapSize / 1048576).toFixed(2)}MB`
      : 'Memory info not available'

    return {
      name: 'Performance API',
      status: 'success',
      message: 'Performance API is available',
      details: memoryInfo,
      icon: Zap,
    }
  }

  const testAnimationFrame = async (): Promise<DiagnosticTest> => {
    return new Promise((resolve) => {
      if (!window.requestAnimationFrame) {
        resolve({
          name: 'Animation Frame',
          status: 'error',
          message: 'requestAnimationFrame not supported',
          details: 'Smooth animations may not work properly',
          icon: Monitor,
        })
        return
      }

      let frames = 0
      const startTime = performance.now()

      const countFrames = () => {
        frames++
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrames)
        } else {
          resolve({
            name: 'Animation Frame',
            status: frames > 30 ? 'success' : 'warning',
            message: `${frames} FPS measured`,
            details:
              frames > 30
                ? 'Animation performance is good'
                : 'Animation performance may be limited',
            icon: Monitor,
          })
        }
      }

      requestAnimationFrame(countFrames)
    })
  }

  const testWebPSupport = async (): Promise<DiagnosticTest> => {
    return new Promise((resolve) => {
      const webP = new Image()
      webP.onload = webP.onerror = function () {
        const isSupported = webP.height === 2
        resolve({
          name: 'WebP Support',
          status: isSupported ? 'success' : 'warning',
          message: isSupported ? 'WebP is supported' : 'WebP not supported',
          details: isSupported
            ? 'Modern image formats are supported'
            : 'Fallback to JPEG/PNG will be used',
          icon: Image,
        })
      }
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
  }

  const testNetworkSpeed = async (): Promise<DiagnosticTest> => {
    try {
      interface NetworkConnection {
        effectiveType?: string
        downlink?: number
      }

      const connection =
        (
          navigator as unknown as {
            connection?: NetworkConnection
            mozConnection?: NetworkConnection
            webkitConnection?: NetworkConnection
          }
        ).connection ||
        (
          navigator as unknown as {
            connection?: NetworkConnection
            mozConnection?: NetworkConnection
            webkitConnection?: NetworkConnection
          }
        ).mozConnection ||
        (
          navigator as unknown as {
            connection?: NetworkConnection
            mozConnection?: NetworkConnection
            webkitConnection?: NetworkConnection
          }
        ).webkitConnection

      if (!connection) {
        return {
          name: 'Network Speed',
          status: 'warning',
          message: 'Network Information API not supported',
          details: 'Cannot determine network speed',
          icon: Globe,
        }
      }

      const effectiveType = connection.effectiveType || 'unknown'
      const downlink = connection.downlink || 'unknown'

      return {
        name: 'Network Speed',
        status: 'success',
        message: `Connection: ${effectiveType}`,
        details: `Estimated bandwidth: ${downlink} Mbps`,
        icon: Globe,
      }
    } catch (error) {
      return {
        name: 'Network Speed',
        status: 'warning',
        message: 'Could not determine network speed',
        details: 'Network Information API error',
        icon: Globe,
      }
    }
  }

  const getStatusIcon = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
    }
  }

  const getStatusBadge = (status: DiagnosticTest['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'outline',
    } as const

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const overallStatus = tests.every((t) => t.status === 'success')
    ? 'success'
    : tests.some((t) => t.status === 'error')
      ? 'error'
      : 'warning'

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Browser Diagnostics</h1>
          <p className="text-muted-foreground mb-6">
            This page tests your browser's capabilities for running interactive
            experiments.
          </p>

          {tests.length > 0 && !isRunning && (
            <Alert
              className={
                overallStatus === 'success'
                  ? 'border-green-500'
                  : overallStatus === 'error'
                    ? 'border-red-500'
                    : 'border-yellow-500'
              }
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {overallStatus === 'success' && 'All Systems Operational'}
                {overallStatus === 'error' && 'Some Features May Not Work'}
                {overallStatus === 'warning' &&
                  'Limited Functionality Detected'}
              </AlertTitle>
              <AlertDescription>
                {overallStatus === 'success' &&
                  'Your browser supports all required features for the best experience.'}
                {overallStatus === 'error' &&
                  'Some experiments may not work properly in your current browser.'}
                {overallStatus === 'warning' &&
                  'You may experience reduced functionality in some experiments.'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Capability Tests</h2>
              <Button onClick={runDiagnostics} disabled={isRunning} size="sm">
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`}
                />
                {isRunning ? 'Running...' : 'Run Tests'}
              </Button>
            </div>

            <div className="space-y-3">
              {tests.map((test, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(test.status)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-1">
                        <test.icon className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-medium">{test.name}</h3>
                        {getStatusBadge(test.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {test.message}
                      </p>
                      {test.details && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {test.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {tests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Code2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Click "Run Tests" to start diagnostics</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Browser Information</h2>
            <div className="space-y-2">
              {Object.entries(browserInfo).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between py-2 border-b last:border-0"
                >
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {typeof value === 'boolean'
                      ? value
                        ? 'Yes'
                        : 'No'
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Troubleshooting Tips</h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Update Your Browser</p>
                  <p className="text-muted-foreground">
                    Ensure you're using the latest version of Chrome, Firefox,
                    Safari, or Edge.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Enable Hardware Acceleration</p>
                  <p className="text-muted-foreground">
                    Check your browser settings to ensure GPU acceleration is
                    enabled.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Disable Extensions</p>
                  <p className="text-muted-foreground">
                    Some browser extensions may interfere with WebGL or Canvas
                    rendering.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Check Privacy Settings</p>
                  <p className="text-muted-foreground">
                    Ensure your browser isn't blocking features due to
                    privacy/tracking settings.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
