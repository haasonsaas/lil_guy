import { useMemo, useCallback } from 'react'

interface NumberFormatterOptions {
  locale?: string
  currency?: string
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact'
}

interface NumberFormatters {
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string
  formatPercent: (value: number, options?: Intl.NumberFormatOptions) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  formatCompact: (value: number) => string
  formatWithSuffix: (value: number) => string
  formatDelta: (value: number, includeSign?: boolean) => string
}

/**
 * Custom hook for consistent number formatting across the app
 * Handles currency, percentages, and various number formats
 */
export function useNumberFormatter(
  options?: NumberFormatterOptions
): NumberFormatters {
  const locale = options?.locale || 'en-US'
  const currency = options?.currency || 'USD'

  // Memoized formatter instances
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [locale, currency]
  )

  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [locale]
  )

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [locale]
  )

  const compactFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
      }),
    [locale]
  )

  // Format functions
  const formatCurrency = useCallback(
    (value: number, customOptions?: Intl.NumberFormatOptions) => {
      if (isNaN(value) || !isFinite(value)) return '$0'

      if (customOptions) {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          ...customOptions,
        }).format(value)
      }

      return currencyFormatter.format(value)
    },
    [locale, currency, currencyFormatter]
  )

  const formatPercent = useCallback(
    (value: number, customOptions?: Intl.NumberFormatOptions) => {
      if (isNaN(value) || !isFinite(value)) return '0%'

      if (customOptions) {
        return new Intl.NumberFormat(locale, {
          style: 'percent',
          ...customOptions,
        }).format(value)
      }

      return percentFormatter.format(value)
    },
    [locale, percentFormatter]
  )

  const formatNumber = useCallback(
    (value: number, customOptions?: Intl.NumberFormatOptions) => {
      if (isNaN(value) || !isFinite(value)) return '0'

      if (customOptions) {
        return new Intl.NumberFormat(locale, customOptions).format(value)
      }

      return numberFormatter.format(value)
    },
    [locale, numberFormatter]
  )

  const formatCompact = useCallback(
    (value: number) => {
      if (isNaN(value) || !isFinite(value)) return '0'
      return compactFormatter.format(value)
    },
    [compactFormatter]
  )

  const formatWithSuffix = useCallback(
    (value: number) => {
      if (isNaN(value) || !isFinite(value)) return '0'

      const absValue = Math.abs(value)

      if (absValue >= 1e9) {
        return `${(value / 1e9).toFixed(1)}B`
      } else if (absValue >= 1e6) {
        return `${(value / 1e6).toFixed(1)}M`
      } else if (absValue >= 1e3) {
        return `${(value / 1e3).toFixed(1)}K`
      }

      return formatNumber(value)
    },
    [formatNumber]
  )

  const formatDelta = useCallback(
    (value: number, includeSign = true) => {
      if (isNaN(value) || !isFinite(value)) return '0'

      const formatted = formatNumber(Math.abs(value))

      if (!includeSign || value === 0) return formatted

      return value > 0 ? `+${formatted}` : `-${formatted}`
    },
    [formatNumber]
  )

  return {
    formatCurrency,
    formatPercent,
    formatNumber,
    formatCompact,
    formatWithSuffix,
    formatDelta,
  }
}

// Convenience hooks for specific formats
export function useCurrencyFormatter(currency?: string) {
  const { formatCurrency } = useNumberFormatter({ currency })
  return formatCurrency
}

export function usePercentFormatter() {
  const { formatPercent } = useNumberFormatter()
  return formatPercent
}
