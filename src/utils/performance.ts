/**
 * Core Web Vitals and Performance Monitoring
 * Tracks LCP, FID, CLS, FCP, and TTFB metrics
 * Fixed memory leaks by implementing proper cleanup
 */

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
}

// Core Web Vitals thresholds (Google recommended)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
}

// Global cleanup registry
class PerformanceMonitor {
  private observers: PerformanceObserver[] = []
  private mutationObservers: MutationObserver[] = []
  private eventListeners: Array<{
    target: EventTarget
    type: string
    listener: EventListener
  }> = []
  private isInitialized = false

  // Cleanup all resources
  cleanup() {
    // Disconnect all PerformanceObservers
    this.observers.forEach((observer) => {
      try {
        observer.disconnect()
      } catch (error) {
        console.warn('Error disconnecting PerformanceObserver:', error)
      }
    })
    this.observers = []

    // Disconnect all MutationObservers
    this.mutationObservers.forEach((observer) => {
      try {
        observer.disconnect()
      } catch (error) {
        console.warn('Error disconnecting MutationObserver:', error)
      }
    })
    this.mutationObservers = []

    // Remove all event listeners
    this.eventListeners.forEach(({ target, type, listener }) => {
      try {
        target.removeEventListener(type, listener)
      } catch (error) {
        console.warn('Error removing event listener:', error)
      }
    })
    this.eventListeners = []

    this.isInitialized = false
  }

  // Register observers for cleanup
  private addObserver(observer: PerformanceObserver) {
    this.observers.push(observer)
  }

  private addMutationObserver(observer: MutationObserver) {
    this.mutationObservers.push(observer)
  }

  private addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener
  ) {
    target.addEventListener(type, listener)
    this.eventListeners.push({ target, type, listener })
  }

  init() {
    // Prevent multiple initializations
    if (this.isInitialized) {
      this.cleanup() // Clean up previous instance
    }

    // Only run in browser environment
    if (typeof window === 'undefined') return

    this.isInitialized = true

    // Wait for page load to start monitoring
    if (document.readyState === 'loading') {
      const loadListener = () => {
        setTimeout(() => this.startMonitoring(), 0)
      }
      this.addEventListener(document, 'DOMContentLoaded', loadListener)
    } else {
      setTimeout(() => this.startMonitoring(), 0)
    }

    // Cleanup on page unload
    const unloadListener = () => this.cleanup()
    this.addEventListener(window, 'beforeunload', unloadListener)
    this.addEventListener(window, 'unload', unloadListener)
  }

  private startMonitoring() {
    this.measureLCP()
    this.measureFID()
    this.measureCLS()
    this.measureFCP()
    this.measureTTFB()
    this.measureCustomMetrics()
    this.trackBundleSize()
  }

  private measureLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          startTime: number
        }

        if (lastEntry) {
          sendMetric({
            name: 'LCP',
            value: Math.round(lastEntry.startTime),
            rating: getRating('LCP', lastEntry.startTime),
            timestamp: Date.now(),
            url: window.location.href,
          })
        }
      })

      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      this.addObserver(observer)
    } catch (error) {
      console.warn('LCP measurement not supported')
    }
  }

  private measureFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(
          (
            entry: PerformanceEntry & {
              processingStart: number
              startTime: number
            }
          ) => {
            sendMetric({
              name: 'FID',
              value: Math.round(entry.processingStart - entry.startTime),
              rating: getRating('FID', entry.processingStart - entry.startTime),
              timestamp: Date.now(),
              url: window.location.href,
            })
          }
        )
      })

      observer.observe({ type: 'first-input', buffered: true })
      this.addObserver(observer)
    } catch (error) {
      console.warn('FID measurement not supported')
    }
  }

  private measureCLS() {
    try {
      let clsValue = 0
      const clsEntries: PerformanceEntry[] = []

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(
          (
            entry: PerformanceEntry & { hadRecentInput: boolean; value: number }
          ) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
              clsEntries.push(entry)
            }
          }
        )
      })

      observer.observe({ type: 'layout-shift', buffered: true })
      this.addObserver(observer)

      // Send CLS when page becomes hidden
      const visibilityListener = () => {
        if (document.visibilityState === 'hidden') {
          sendMetric({
            name: 'CLS',
            value: Math.round(clsValue * 1000) / 1000,
            rating: getRating('CLS', clsValue),
            timestamp: Date.now(),
            url: window.location.href,
          })
        }
      }
      this.addEventListener(document, 'visibilitychange', visibilityListener)
    } catch (error) {
      console.warn('CLS measurement not supported')
    }
  }

  private measureFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: PerformanceEntry & { startTime: number }) => {
          sendMetric({
            name: 'FCP',
            value: Math.round(entry.startTime),
            rating: getRating('FCP', entry.startTime),
            timestamp: Date.now(),
            url: window.location.href,
          })
        })
      })

      observer.observe({ type: 'paint', buffered: true })
      this.addObserver(observer)
    } catch (error) {
      console.warn('FCP measurement not supported')
    }
  }

  private measureTTFB() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(
          (
            entry: PerformanceEntry & {
              responseStart: number
              requestStart: number
            }
          ) => {
            sendMetric({
              name: 'TTFB',
              value: Math.round(entry.responseStart - entry.requestStart),
              rating: getRating(
                'TTFB',
                entry.responseStart - entry.requestStart
              ),
              timestamp: Date.now(),
              url: window.location.href,
            })
          }
        )
      })

      observer.observe({ type: 'navigation', buffered: true })
      this.addObserver(observer)
    } catch (error) {
      console.warn('TTFB measurement not supported')
    }
  }

  private measureCustomMetrics() {
    if (window.location.pathname.startsWith('/blog/')) {
      const observer = new MutationObserver(() => {
        const content = document.querySelector('[data-content="blog-post"]')
        if (content) {
          // Found content, send metric and cleanup
          sendMetric({
            name: 'BlogPostLoad',
            value: Math.round(performance.now()),
            rating: 'good',
            timestamp: Date.now(),
            url: window.location.href,
          })
          observer.disconnect()
          clearTimeout(timeoutId)
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })
      this.addMutationObserver(observer)

      // Cleanup after 10 seconds if content not found
      const timeoutId = setTimeout(() => {
        observer.disconnect()
      }, 10000)
    }
  }

  private trackBundleSize() {
    // Track bundle size and loading performance
    if (performance.getEntriesByType) {
      const resources = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[]
      const jsResources = resources.filter((r) => r.name.includes('.js'))
      const totalJSSize = jsResources.reduce((size, resource) => {
        return size + (resource.transferSize || 0)
      }, 0)

      if (totalJSSize > 0) {
        sendMetric({
          name: 'BundleSize',
          value: Math.round(totalJSSize / 1024), // KB
          rating:
            totalJSSize < 250000
              ? 'good'
              : totalJSSize < 500000
                ? 'needs-improvement'
                : 'poor',
          timestamp: Date.now(),
          url: window.location.href,
        })
      }
    }
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor()

function getRating(
  metric: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

function sendMetric(metric: PerformanceMetric) {
  const data = {
    type: 'web-vitals',
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    url: metric.url,
    timestamp: metric.timestamp,
    userAgent: navigator.userAgent,
    connection:
      (navigator as Navigator & { connection?: { effectiveType: string } })
        .connection?.effectiveType || 'unknown',
  }

  // Try to send via beacon API first (most reliable)
  if ('sendBeacon' in navigator) {
    try {
      const success = navigator.sendBeacon('/api/metrics', JSON.stringify(data))
      if (success) {
        logMetric(metric)
        return
      }
    } catch (error) {
      // Fall through to fetch
    }
  }

  // Fallback to fetch with keepalive
  try {
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(() => {
      // Store for later if network fails
      storeMetricForLater(metric)
    })
  } catch (error) {
    storeMetricForLater(metric)
  }

  logMetric(metric)
}

function logMetric(metric: PerformanceMetric) {
  if (import.meta.env.DEV) {
    const unit = metric.name === 'CLS' ? '' : 'ms'
    const color =
      metric.rating === 'good'
        ? '🟢'
        : metric.rating === 'needs-improvement'
          ? '🟡'
          : '🔴'
    console.log(
      `[Web Vitals] ${color} ${metric.name}: ${metric.value}${unit} (${metric.rating})`
    )
  }
}

function storeMetricForLater(metric: PerformanceMetric) {
  try {
    const stored = JSON.parse(
      localStorage.getItem('web-vitals-metrics') || '[]'
    )
    stored.push(metric)
    // Keep only last 50 metrics to prevent localStorage bloat
    if (stored.length > 50) {
      stored.splice(0, stored.length - 50)
    }
    localStorage.setItem('web-vitals-metrics', JSON.stringify(stored))
  } catch (error) {
    console.warn('Failed to store metric for later:', error)
  }
}

// Initialize all performance monitoring
export function initPerformanceMonitoring() {
  performanceMonitor.init()
}

// Cleanup function for manual cleanup
export function cleanupPerformanceMonitoring() {
  performanceMonitor.cleanup()
}

// Export for manual monitoring
export function trackCustomEvent(name: string, value: number, url?: string) {
  sendMetric({
    name,
    value,
    rating: 'good', // Custom events don't have standard ratings
    timestamp: Date.now(),
    url: url || window.location.href,
  })
}

// Performance budget checker
export function checkPerformanceBudget() {
  const budget = {
    LCP: 2500,
    FID: 100,
    CLS: 0.1,
    BundleSize: 250, // KB
  }

  return budget
}

// Get stored metrics for debugging
export function getStoredMetrics() {
  try {
    const stored = localStorage.getItem('web-vitals-metrics') || '[]'
    return JSON.parse(stored)
  } catch {
    return []
  }
}

// Clear stored metrics
export function clearStoredMetrics() {
  localStorage.removeItem('web-vitals-metrics')
}

// Get real-time performance status
export function getPerformanceStatus() {
  if (typeof window === 'undefined') return null

  const navigation = performance.getEntriesByType(
    'navigation'
  )[0] as PerformanceNavigationTiming

  return {
    // Navigation timing
    domContentLoaded: navigation
      ? Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart)
      : 0,
    loadComplete: navigation
      ? Math.round(navigation.loadEventEnd - navigation.fetchStart)
      : 0,

    // Connection info
    connection: (
      navigator as unknown as {
        connection?: { effectiveType: string; downlink: number; rtt: number }
      }
    ).connection
      ? {
          effectiveType: (
            navigator as unknown as { connection: { effectiveType: string } }
          ).connection.effectiveType,
          downlink: (
            navigator as unknown as { connection: { downlink: number } }
          ).connection.downlink,
          rtt: (navigator as unknown as { connection: { rtt: number } })
            .connection.rtt,
        }
      : null,

    // Device info
    deviceMemory:
      (navigator as unknown as { deviceMemory?: number }).deviceMemory ||
      'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',

    // Performance now
    timeOrigin: performance.timeOrigin,
    now: performance.now(),
  }
}

// Manual performance measurement for React components
export function measureComponentPerformance(name: string, fn: () => void) {
  const start = performance.now()
  fn()
  const end = performance.now()

  trackCustomEvent(`Component_${name}`, Math.round(end - start))
}

// Batch send stored metrics (useful for offline scenarios)
export async function flushStoredMetrics() {
  const metrics = getStoredMetrics()
  if (metrics.length === 0) return

  try {
    const response = await fetch('/api/metrics/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics }),
    })

    if (response.ok) {
      clearStoredMetrics()
      if (import.meta.env.DEV) {
        console.log(`[Web Vitals] Flushed ${metrics.length} stored metrics`)
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Web Vitals] Failed to flush stored metrics:', error)
    }
  }
}

// Performance monitoring summary for debugging
export function getPerformanceSummary() {
  const storedMetrics = getStoredMetrics()
  const status = getPerformanceStatus()
  const budget = checkPerformanceBudget()

  return {
    monitoring: {
      active: typeof window !== 'undefined',
      storedMetrics: storedMetrics.length,
      lastMetric: storedMetrics[storedMetrics.length - 1]?.timestamp || null,
    },
    performance: status,
    budget,
    url: typeof window !== 'undefined' ? window.location.href : null,
    timestamp: Date.now(),
  }
}
