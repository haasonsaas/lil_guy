#!/usr/bin/env bun

/**
 * Test script to verify Core Web Vitals monitoring is working
 * This tests both the metrics collection endpoint and fetches real data
 */

import chalk from 'chalk'

const SITE_URL = 'https://www.haasonsaas.com'
const METRICS_API = `${SITE_URL}/api/metrics`

interface TestMetric {
  type: string
  metric: string
  value: number
  rating: string
  url: string
  timestamp: number
  userAgent: string
  connection: string
}

// Test metrics data
const testMetrics: TestMetric[] = [
  {
    type: 'web-vitals',
    metric: 'LCP',
    value: 1800,
    rating: 'good',
    url: `${SITE_URL}/`,
    timestamp: Date.now(),
    userAgent: 'Mozilla/5.0 (Test) Performance Monitor',
    connection: 'wifi',
  },
  {
    type: 'web-vitals',
    metric: 'FID',
    value: 50,
    rating: 'good',
    url: `${SITE_URL}/blog`,
    timestamp: Date.now(),
    userAgent: 'Mozilla/5.0 (Test) Performance Monitor',
    connection: 'wifi',
  },
]

async function testMetricsEndpoint() {
  console.log(chalk.blue('🧪 Testing metrics collection endpoint...'))

  try {
    for (const metric of testMetrics) {
      const response = await fetch(METRICS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      })

      if (response.ok) {
        console.log(chalk.green(`✅ ${metric.metric} metric sent successfully`))
      } else {
        console.log(
          chalk.red(
            `❌ Failed to send ${metric.metric}: ${response.status} ${response.statusText}`
          )
        )
        const text = await response.text()
        console.log(chalk.gray(`Response: ${text}`))
      }
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error testing metrics endpoint: ${error}`))
  }

  console.log()
}

async function checkRealTimeMonitoring() {
  console.log(chalk.blue('📊 Checking if real-time monitoring is active...'))

  try {
    // Try to fetch the main page and see if performance monitoring scripts are loaded
    const response = await fetch(SITE_URL)
    const html = await response.text()

    // Check for Cloudflare Analytics
    const hasCFAnalytics = html.includes('static.cloudflareinsights.com')
    console.log(
      hasCFAnalytics
        ? chalk.green('✅ Cloudflare Analytics detected')
        : chalk.yellow('⚠️ Cloudflare Analytics not found')
    )

    // Check for performance monitoring script references
    const hasPerformanceScripts =
      html.includes('performance') || html.includes('vitals')
    console.log(
      hasPerformanceScripts
        ? chalk.green('✅ Performance monitoring scripts detected')
        : chalk.yellow('⚠️ Performance monitoring scripts not found')
    )

    // Test if we can access the site quickly
    const startTime = Date.now()
    await fetch(`${SITE_URL}/blog`)
    const loadTime = Date.now() - startTime

    console.log(chalk.blue(`⚡ Page load time test: ${loadTime}ms`))

    if (loadTime < 1000) {
      console.log(chalk.green('✅ Good response time'))
    } else if (loadTime < 2000) {
      console.log(chalk.yellow('⚠️ Moderate response time'))
    } else {
      console.log(chalk.red('❌ Slow response time'))
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error checking site: ${error}`))
  }

  console.log()
}

async function generateLighthouseReport() {
  console.log(chalk.blue('🔍 Simulating Lighthouse-style performance check...'))

  try {
    const startTime = Date.now()

    // Test multiple pages for performance
    const testPages = [
      '/',
      '/blog',
      '/blog/building-better-engineering-culture',
      '/about',
    ]

    for (const page of testPages) {
      const pageStart = Date.now()
      const response = await fetch(`${SITE_URL}${page}`)
      const pageTime = Date.now() - pageStart

      if (response.ok) {
        const contentLength = response.headers.get('content-length')
        console.log(
          chalk.green(
            `✅ ${page}: ${pageTime}ms (${contentLength || 'unknown'} bytes)`
          )
        )
      } else {
        console.log(chalk.red(`❌ ${page}: ${response.status}`))
      }
    }

    const totalTime = Date.now() - startTime
    console.log(chalk.blue(`Total test time: ${totalTime}ms`))
  } catch (error) {
    console.log(chalk.red(`❌ Error running performance tests: ${error}`))
  }

  console.log()
}

async function checkBundleOptimization() {
  console.log(chalk.blue('📦 Checking bundle optimization impact...'))

  try {
    // Test the main JavaScript bundle loading
    const response = await fetch(SITE_URL)
    const html = await response.text()

    // Extract script tags to see bundle strategy
    const scriptMatches = html.match(/<script[^>]*src="[^"]*"[^>]*>/g) || []
    const moduleScripts = scriptMatches.filter((script) =>
      script.includes('type="module"')
    )

    console.log(chalk.blue(`📋 Found ${scriptMatches.length} script tags`))
    console.log(chalk.blue(`📋 Found ${moduleScripts.length} ES modules`))

    // Check for lazy loading indicators
    const hasLazyLoading = html.includes('lazy') || html.includes('import(')
    console.log(
      hasLazyLoading
        ? chalk.green('✅ Lazy loading detected')
        : chalk.yellow('⚠️ No obvious lazy loading found')
    )
  } catch (error) {
    console.log(chalk.red(`❌ Error checking bundle optimization: ${error}`))
  }

  console.log()
}

async function main() {
  console.log(chalk.bold('🚀 Core Web Vitals Performance Testing'))
  console.log(chalk.gray('='.repeat(50)))
  console.log()

  await testMetricsEndpoint()
  await checkRealTimeMonitoring()
  await generateLighthouseReport()
  await checkBundleOptimization()

  console.log(chalk.bold('📋 Summary'))
  console.log(chalk.gray('-'.repeat(50)))
  console.log(
    chalk.blue('1. Test the live site at: https://www.haasonsaas.com')
  )
  console.log(
    chalk.blue('2. Open DevTools → Lighthouse → Run Performance audit')
  )
  console.log(chalk.blue('3. Check DevTools Console for Web Vitals logs'))
  console.log(
    chalk.blue('4. Use PageSpeed Insights: https://pagespeed.web.dev/')
  )
  console.log(
    chalk.blue('5. Monitor metrics via Cloudflare Analytics dashboard')
  )
  console.log()
  console.log(
    chalk.green('🎯 Next steps: Set up real-time monitoring dashboard')
  )
}

main().catch(console.error)
