#!/usr/bin/env bun

/**
 * Performance Report Generator
 * Analyzes Core Web Vitals data and generates insights
 */

import { parseArgs } from 'util'
import chalk from 'chalk'

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
  clientIP?: string
  userAgent?: string
  connection?: string
}

interface MetricSummary {
  name: string
  count: number
  average: number
  median: number
  p95: number
  min: number
  max: number
  goodPercent: number
  needsImprovementPercent: number
  poorPercent: number
}

// Simulate metrics for demo (in production, this would fetch from KV)
function generateMockMetrics(): PerformanceMetric[] {
  const metrics: PerformanceMetric[] = []
  const metricTypes = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB']
  const urls = [
    'https://haasonsaas.com/',
    'https://haasonsaas.com/blog',
    'https://haasonsaas.com/blog/some-post',
    'https://haasonsaas.com/about',
  ]

  // Generate 30 days of mock data
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

  for (let i = 0; i < 1000; i++) {
    const metricType =
      metricTypes[Math.floor(Math.random() * metricTypes.length)]
    const url = urls[Math.floor(Math.random() * urls.length)]

    let value: number
    let rating: 'good' | 'needs-improvement' | 'poor'

    // Generate realistic values based on metric type
    switch (metricType) {
      case 'LCP':
        value = Math.random() * 5000 + 1000 // 1-6 seconds
        rating =
          value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
        break
      case 'FID':
        value = Math.random() * 500 + 10 // 10-510ms
        rating =
          value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
        break
      case 'CLS':
        value = Math.random() * 0.5 // 0-0.5
        rating =
          value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
        break
      case 'FCP':
        value = Math.random() * 4000 + 500 // 0.5-4.5 seconds
        rating =
          value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
        break
      case 'TTFB':
        value = Math.random() * 2000 + 200 // 200-2200ms
        rating =
          value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor'
        break
      default:
        value = 0
        rating = 'good'
    }

    metrics.push({
      name: metricType,
      value: Math.round(value * 100) / 100,
      rating,
      timestamp: thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo),
      url,
      clientIP: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0...',
      connection: ['4g', 'wifi', '3g'][Math.floor(Math.random() * 3)],
    })
  }

  return metrics.sort((a, b) => b.timestamp - a.timestamp)
}

function analyzeMetrics(
  metrics: PerformanceMetric[]
): Map<string, MetricSummary> {
  const summaries = new Map<string, MetricSummary>()
  const metricsByType = new Map<string, PerformanceMetric[]>()

  // Group metrics by type
  metrics.forEach((metric) => {
    if (!metricsByType.has(metric.name)) {
      metricsByType.set(metric.name, [])
    }
    metricsByType.get(metric.name)!.push(metric)
  })

  // Calculate summaries for each metric type
  metricsByType.forEach((typeMetrics, metricName) => {
    const values = typeMetrics.map((m) => m.value).sort((a, b) => a - b)
    const ratings = typeMetrics.map((m) => m.rating)

    const count = values.length
    const sum = values.reduce((a, b) => a + b, 0)
    const average = sum / count
    const median = values[Math.floor(count / 2)]
    const p95Index = Math.floor(count * 0.95)
    const p95 = values[p95Index]
    const min = values[0]
    const max = values[count - 1]

    const goodCount = ratings.filter((r) => r === 'good').length
    const needsImprovementCount = ratings.filter(
      (r) => r === 'needs-improvement'
    ).length
    const poorCount = ratings.filter((r) => r === 'poor').length

    summaries.set(metricName, {
      name: metricName,
      count,
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      goodPercent: Math.round((goodCount / count) * 100),
      needsImprovementPercent: Math.round(
        (needsImprovementCount / count) * 100
      ),
      poorPercent: Math.round((poorCount / count) * 100),
    })
  })

  return summaries
}

function formatMetricValue(name: string, value: number): string {
  switch (name) {
    case 'CLS':
      return value.toFixed(3)
    case 'LCP':
    case 'FID':
    case 'FCP':
    case 'TTFB':
      return `${Math.round(value)}ms`
    default:
      return value.toString()
  }
}

function getPerformanceScore(summaries: Map<string, MetricSummary>): number {
  let totalScore = 0
  let metricCount = 0

  summaries.forEach((summary) => {
    // Weight based on Core Web Vitals importance
    const weight = ['LCP', 'FID', 'CLS'].includes(summary.name) ? 2 : 1
    const score = summary.goodPercent
    totalScore += score * weight
    metricCount += weight
  })

  return Math.round(totalScore / metricCount)
}

function printReport(summaries: Map<string, MetricSummary>, format: string) {
  if (format === 'json') {
    console.log(JSON.stringify(Object.fromEntries(summaries), null, 2))
    return
  }

  const score = getPerformanceScore(summaries)
  const scoreColor = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red'

  console.log(chalk.bold('🚀 Core Web Vitals Performance Report'))
  console.log(chalk.gray('═'.repeat(50)))
  console.log()

  console.log(chalk.bold('📊 Overall Performance Score'))
  console.log(chalk[scoreColor](`${score}/100`))
  console.log()

  console.log(chalk.bold('📈 Metric Details'))
  console.log(chalk.gray('─'.repeat(50)))

  summaries.forEach((summary) => {
    const isCore = ['LCP', 'FID', 'CLS'].includes(summary.name)
    const nameColor = isCore ? 'cyan' : 'blue'

    console.log(chalk[nameColor].bold(summary.name))
    console.log(`  Count: ${summary.count.toLocaleString()} measurements`)
    console.log(
      `  Average: ${formatMetricValue(summary.name, summary.average)}`
    )
    console.log(`  Median: ${formatMetricValue(summary.name, summary.median)}`)
    console.log(
      `  95th percentile: ${formatMetricValue(summary.name, summary.p95)}`
    )

    // Rating distribution
    const goodBar = '█'.repeat(Math.floor(summary.goodPercent / 5))
    const needsBar = '█'.repeat(Math.floor(summary.needsImprovementPercent / 5))
    const poorBar = '█'.repeat(Math.floor(summary.poorPercent / 5))

    console.log(`  ${chalk.green(goodBar)} ${summary.goodPercent}% good`)
    console.log(
      `  ${chalk.yellow(needsBar)} ${summary.needsImprovementPercent}% needs improvement`
    )
    console.log(`  ${chalk.red(poorBar)} ${summary.poorPercent}% poor`)
    console.log()
  })

  // Recommendations
  console.log(chalk.bold('💡 Recommendations'))
  console.log(chalk.gray('─'.repeat(50)))

  summaries.forEach((summary) => {
    if (summary.poorPercent > 20) {
      console.log(
        chalk.red(`⚠️  ${summary.name}: ${summary.poorPercent}% poor ratings`)
      )
      switch (summary.name) {
        case 'LCP':
          console.log('   • Optimize images and use responsive sizes')
          console.log('   • Preload critical resources')
          console.log('   • Reduce server response times')
          break
        case 'FID':
          console.log('   • Reduce JavaScript execution time')
          console.log('   • Split code and load non-critical JS later')
          console.log('   • Use web workers for heavy computations')
          break
        case 'CLS':
          console.log('   • Set dimensions for images and videos')
          console.log('   • Reserve space for dynamic content')
          console.log('   • Avoid inserting content above existing content')
          break
        case 'FCP':
          console.log('   • Optimize critical rendering path')
          console.log('   • Reduce render-blocking resources')
          console.log('   • Use efficient CSS selectors')
          break
        case 'TTFB':
          console.log('   • Optimize server performance')
          console.log('   • Use a CDN')
          console.log('   • Enable caching')
          break
      }
      console.log()
    }
  })
}

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      period: { type: 'string', short: 'p', default: '7d' },
      format: { type: 'string', short: 'f', default: 'table' },
      help: { type: 'boolean', short: 'h' },
    },
  })

  if (values.help) {
    console.log(`
Performance Report Generator

Usage: bun run performance-report [options]

Options:
  -p, --period   Time period (7d, 30d, 90d) [default: 7d]
  -f, --format   Output format (table, json) [default: table]
  -h, --help     Show this help message

Examples:
  bun run performance-report -p 30d
  bun run performance-report -f json
`)
    process.exit(0)
  }

  try {
    // In production, this would fetch from Cloudflare KV
    console.log(chalk.gray('Generating mock performance data...'))
    const metrics = generateMockMetrics()

    // Filter by period if needed
    const periodMs =
      values.period === '30d'
        ? 30 * 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000
    const cutoff = Date.now() - periodMs
    const filteredMetrics = metrics.filter((m) => m.timestamp >= cutoff)

    console.log(
      chalk.gray(
        `Analyzing ${filteredMetrics.length} metrics from the last ${values.period}...`
      )
    )
    console.log()

    const summaries = analyzeMetrics(filteredMetrics)
    printReport(summaries, values.format as string)
  } catch (error) {
    console.error(chalk.red('Error generating performance report:'), error)
    process.exit(1)
  }
}

main().catch(console.error)
