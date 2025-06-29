import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNumberFormatter } from './useNumberFormatter'

interface AnimatedCounterOptions {
  duration?: number
  format?: 'number' | 'currency' | 'percent' | 'compact'
  decimals?: number
  easing?: 'linear' | 'easeInOut' | 'easeOut' | 'easeIn'
  prefix?: string
  suffix?: string
}

/**
 * Animates number transitions with customizable formatting
 * Perfect for dashboard metrics and interactive calculators
 */
export function useAnimatedCounter(
  endValue: number,
  options?: AnimatedCounterOptions
): string {
  const {
    duration = 500,
    format = 'number',
    decimals = 0,
    easing = 'easeInOut',
    prefix = '',
    suffix = '',
  } = options || {}

  const [displayValue, setDisplayValue] = useState(endValue)
  const startValueRef = useRef(endValue)
  const startTimeRef = useRef<number | null>(null)
  const requestRef = useRef<number | null>(null)

  const { formatNumber, formatCurrency, formatPercent, formatCompact } =
    useNumberFormatter()

  // Easing functions (memoized to prevent unnecessary re-renders)
  const easingFunctions = useMemo(
    () => ({
      linear: (t: number) => t,
      easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
      easeOut: (t: number) => t * (2 - t),
      easeIn: (t: number) => t * t,
    }),
    []
  )

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const progress = Math.min(
        (timestamp - startTimeRef.current) / duration,
        1
      )
      const easedProgress = easingFunctions[easing](progress)

      const currentValue =
        startValueRef.current +
        (endValue - startValueRef.current) * easedProgress
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate)
      }
    },
    [duration, easing, endValue, easingFunctions]
  )

  useEffect(() => {
    // Only animate if the value actually changed and is finite
    if (
      startValueRef.current !== endValue &&
      isFinite(endValue) &&
      isFinite(startValueRef.current)
    ) {
      startTimeRef.current = null
      requestRef.current = requestAnimationFrame(animate)
    } else {
      setDisplayValue(endValue)
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      startValueRef.current = endValue
    }
  }, [endValue, duration, easing, animate])

  // Format the display value
  let formatted: string

  switch (format) {
    case 'currency':
      formatted = formatCurrency(displayValue, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
      break
    case 'percent':
      formatted = formatPercent(displayValue / 100, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
      break
    case 'compact':
      formatted = formatCompact(displayValue)
      break
    default:
      formatted = formatNumber(displayValue, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
  }

  return `${prefix}${formatted}${suffix}`
}

/**
 * Hook for animating multiple counters with different formats
 * Useful for dashboards with multiple metrics
 */
export function useAnimatedCounters<T extends Record<string, number>>(
  values: T,
  options?: Record<keyof T, AnimatedCounterOptions>
): Record<keyof T, string> {
  const animatedValues: Record<string, string> = {}

  Object.entries(values).forEach(([key, value]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    animatedValues[key] = useAnimatedCounter(value, options?.[key])
  })

  return animatedValues as Record<keyof T, string>
}
