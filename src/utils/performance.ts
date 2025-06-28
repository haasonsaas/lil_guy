/**
 * Core Web Vitals and Performance Monitoring
 * Tracks LCP, FID, CLS, FCP, and TTFB metrics
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
  // Send to Cloudflare Analytics via beacon API
  if ('sendBeacon' in navigator) {
    const data = JSON.stringify({
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
    })

    navigator.sendBeacon('/api/metrics', data)
  }

  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log(
      `[Web Vitals] ${metric.name}: ${metric.value}ms (${metric.rating})`
    )
  }
}

// Largest Contentful Paint (LCP)
function measureLCP() {
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
  } catch (error) {
    console.warn('LCP measurement not supported')
  }
}

// First Input Delay (FID)
function measureFID() {
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
  } catch (error) {
    console.warn('FID measurement not supported')
  }
}

// Cumulative Layout Shift (CLS)
function measureCLS() {
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

    // Send CLS when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendMetric({
          name: 'CLS',
          value: Math.round(clsValue * 1000) / 1000,
          rating: getRating('CLS', clsValue),
          timestamp: Date.now(),
          url: window.location.href,
        })
      }
    })
  } catch (error) {
    console.warn('CLS measurement not supported')
  }
}

// First Contentful Paint (FCP)
function measureFCP() {
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
  } catch (error) {
    console.warn('FCP measurement not supported')
  }
}

// Time to First Byte (TTFB)
function measureTTFB() {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(
        (
          entry: PerformanceEntry & {
            responseStart: number
            requestStart: number
            name: string
          }
        ) => {
          if (entry.name === window.location.href) {
            const ttfb = entry.responseStart - entry.requestStart
            sendMetric({
              name: 'TTFB',
              value: Math.round(ttfb),
              rating: getRating('TTFB', ttfb),
              timestamp: Date.now(),
              url: window.location.href,
            })
          }
        }
      )
    })

    observer.observe({ type: 'navigation', buffered: true })
  } catch (error) {
    console.warn('TTFB measurement not supported')
  }
}

// Custom metrics
function measureCustomMetrics() {
  // Blog-specific metrics
  if (window.location.pathname.startsWith('/blog/')) {
    // Time to interactive content
    const observer = new MutationObserver(() => {
      const content = document.querySelector('[data-content="blog-post"]')
      if (content) {
        const loadTime = performance.now()
        sendMetric({
          name: 'BlogContentReady',
          value: Math.round(loadTime),
          rating:
            loadTime < 1000
              ? 'good'
              : loadTime < 2000
                ? 'needs-improvement'
                : 'poor',
          timestamp: Date.now(),
          url: window.location.href,
        })
        observer.disconnect()
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }
}

// Initialize all performance monitoring
export function initPerformanceMonitoring() {
  // Only run in browser environment
  if (typeof window === 'undefined') return

  // Wait for page load to start monitoring
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(startMonitoring, 0)
    })
  } else {
    setTimeout(startMonitoring, 0)
  }
}

function startMonitoring() {
  measureLCP()
  measureFID()
  measureCLS()
  measureFCP()
  measureTTFB()
  measureCustomMetrics()

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
