/**
 * Performance Dashboard Component
 * Displays real-time Core Web Vitals metrics
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'

interface Metric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

interface PerformanceData {
  LCP?: Metric
  FID?: Metric
  CLS?: Metric
  FCP?: Metric
  TTFB?: Metric
  BundleSize?: Metric
}

const METRIC_INFO = {
  LCP: {
    name: 'Largest Contentful Paint',
    unit: 'ms',
    description: 'Time to render the largest content element',
    thresholds: { good: 2500, poor: 4000 },
  },
  FID: {
    name: 'First Input Delay',
    unit: 'ms',
    description: 'Time from first user interaction to browser response',
    thresholds: { good: 100, poor: 300 },
  },
  CLS: {
    name: 'Cumulative Layout Shift',
    unit: '',
    description: 'Amount of unexpected layout shift',
    thresholds: { good: 0.1, poor: 0.25 },
  },
  FCP: {
    name: 'First Contentful Paint',
    unit: 'ms',
    description: 'Time to render the first content element',
    thresholds: { good: 1800, poor: 3000 },
  },
  TTFB: {
    name: 'Time to First Byte',
    unit: 'ms',
    description: 'Time from request to first byte received',
    thresholds: { good: 800, poor: 1800 },
  },
  BundleSize: {
    name: 'Bundle Size',
    unit: 'KB',
    description: 'Total JavaScript bundle size',
    thresholds: { good: 250, poor: 500 },
  },
}

function getRatingColor(rating: string): string {
  switch (rating) {
    case 'good':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
    case 'needs-improvement':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
    case 'poor':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
  }
}

function formatValue(value: number, unit: string): string {
  if (unit === 'ms') {
    return `${Math.round(value)}ms`
  } else if (unit === 'KB') {
    return `${Math.round(value)}KB`
  } else if (unit === '') {
    return value.toFixed(3)
  }
  return `${value}${unit}`
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceData>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Listen for performance metrics from our monitoring system
    const handlePerformanceMetric = (event: CustomEvent<Metric>) => {
      const { name, value, rating, timestamp } = event.detail
      setMetrics((prev) => ({
        ...prev,
        [name]: { name, value, rating, timestamp },
      }))
    }

    // Add listener for custom performance events
    window.addEventListener(
      'performance-metric',
      handlePerformanceMetric as EventListener
    )

    // Show dashboard only in development or with special flag
    const showDashboard =
      new URLSearchParams(window.location.search).has('perf') ||
      import.meta.env.DEV ||
      localStorage.getItem('show-performance-dashboard') === 'true'

    setIsVisible(showDashboard)

    return () => {
      window.removeEventListener(
        'performance-metric',
        handlePerformanceMetric as EventListener
      )
    }
  }, [])

  // Don't render if not visible
  if (!isVisible) return null

  const metricEntries = Object.entries(metrics)
  if (metricEntries.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="border-2 shadow-lg bg-white/95 backdrop-blur dark:bg-gray-900/95">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            Core Web Vitals
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close performance dashboard"
            >
              ×
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {metricEntries.map(([key, metric]) => {
            const info = METRIC_INFO[key as keyof typeof METRIC_INFO]
            if (!info) return null

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {info.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={getRatingColor(metric.rating)}
                  >
                    {metric.rating.replace('-', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">
                    {formatValue(metric.value, info.unit)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {info.description}
                </div>
                {key !== metricEntries[metricEntries.length - 1][0] && (
                  <Separator className="mt-2" />
                )}
              </div>
            )
          })}

          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Real-time performance monitoring
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceDashboard
