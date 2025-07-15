#!/usr/bin/env bun

/**
 * Test script for analytics and service worker functionality
 * Following the existing test pattern in this codebase
 */

import chalk from 'chalk'
import { JSDOM } from 'jsdom'
import fs from 'fs'
import path from 'path'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  details?: string
}

class AnalyticsServiceWorkerTester {
  private results: TestResult[] = []

  async runAllTests(): Promise<void> {
    console.log(chalk.blue('🧪 Testing Analytics and Service Worker Functionality\n'))

    // Test 1: Check Cloudflare script is in index.html
    await this.testCloudflareScriptInHTML()

    // Test 2: Test analytics initialization flags
    await this.testAnalyticsInitializationFlag()

    // Test 3: Test service worker session storage logic
    await this.testServiceWorkerSessionStorage()

    // Test 4: Test analytics module structure
    await this.testAnalyticsModuleStructure()

    // Display results
    this.displayResults()
  }

  private async testCloudflareScriptInHTML(): Promise<void> {
    console.log(chalk.yellow('Testing Cloudflare script in index.html...'))

    try {
      const indexHtmlPath = path.join(process.cwd(), 'index.html')
      const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8')

      const hasCloudflareScript = indexHtmlContent.includes(
        'static.cloudflareinsights.com/beacon.min.js'
      )
      const hasBeaconToken = indexHtmlContent.includes('data-cf-beacon')
      const hasCorrectToken = indexHtmlContent.includes('3cea46866cd24358b17fd3ca37ce1dd5')

      this.results.push({
        name: 'Cloudflare Web Analytics script in index.html',
        passed: hasCloudflareScript && hasBeaconToken && hasCorrectToken,
        details: `Script: ${hasCloudflareScript ? '✓' : '✗'}, Beacon: ${hasBeaconToken ? '✓' : '✗'}, Token: ${hasCorrectToken ? '✓' : '✗'}`,
      })
    } catch (error) {
      this.results.push({
        name: 'Cloudflare Web Analytics script in index.html',
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private async testAnalyticsInitializationFlag(): Promise<void> {
    console.log(chalk.yellow('Testing analytics initialization flag...'))

    try {
      // Read the analytics source file
      const analyticsPath = path.join(process.cwd(), 'src', 'utils', 'analytics.ts')
      const analyticsContent = fs.readFileSync(analyticsPath, 'utf-8')

      const hasInitializedFlag = analyticsContent.includes('analyticsInitialized')
      const hasInitializedCheck = analyticsContent.includes('if (analyticsInitialized)')
      const hasSetFlag = analyticsContent.includes('analyticsInitialized = true')

      this.results.push({
        name: 'Analytics initialization flag implementation',
        passed: hasInitializedFlag && hasInitializedCheck && hasSetFlag,
        details: `Flag var: ${hasInitializedFlag ? '✓' : '✗'}, Check: ${hasInitializedCheck ? '✓' : '✗'}, Set: ${hasSetFlag ? '✓' : '✗'}`,
      })
    } catch (error) {
      this.results.push({
        name: 'Analytics initialization flag implementation',
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private async testServiceWorkerSessionStorage(): Promise<void> {
    console.log(chalk.yellow('Testing service worker session storage logic...'))

    try {
      // Read the service worker hook file
      const swHookPath = path.join(process.cwd(), 'src', 'hooks', 'useServiceWorker.ts')
      const swHookContent = fs.readFileSync(swHookPath, 'utf-8')

      const hasSessionStorageCheck = swHookContent.includes("sessionStorage.getItem('sw-logged')")
      const hasSessionStorageSet = swHookContent.includes(
        "sessionStorage.setItem('sw-logged', 'true')"
      )
      const hasOnlyLogOnce = swHookContent.includes('Only log once per session')

      this.results.push({
        name: 'Service worker session storage prevention',
        passed: hasSessionStorageCheck && hasSessionStorageSet && hasOnlyLogOnce,
        details: `Check: ${hasSessionStorageCheck ? '✓' : '✗'}, Set: ${hasSessionStorageSet ? '✓' : '✗'}, Comment: ${hasOnlyLogOnce ? '✓' : '✗'}`,
      })
    } catch (error) {
      this.results.push({
        name: 'Service worker session storage prevention',
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private async testAnalyticsModuleStructure(): Promise<void> {
    console.log(chalk.yellow('Testing analytics module structure...'))

    try {
      // Test analytics module can be imported and has expected exports
      const analyticsModule = await import('../src/utils/analytics.ts')

      const hasInitialize = typeof analyticsModule.initializeAnalytics === 'function'
      const hasTrackEvent = typeof analyticsModule.trackEvent === 'function'
      const hasAnalyticsObject = typeof analyticsModule.default === 'object'

      this.results.push({
        name: 'Analytics module exports',
        passed: hasInitialize && hasTrackEvent && hasAnalyticsObject,
        details: `initializeAnalytics: ${hasInitialize ? '✓' : '✗'}, trackEvent: ${hasTrackEvent ? '✓' : '✗'}, default: ${hasAnalyticsObject ? '✓' : '✗'}`,
      })

      // Test the analytics hooks can be imported
      const hooksModule = await import('../src/hooks/useAnalytics.ts')

      const hasUseAnalytics = typeof hooksModule.useAnalytics === 'function'
      const hasUseReadingProgress = typeof hooksModule.useReadingProgress === 'function'
      const hasUseExternalLinkTracking = typeof hooksModule.useExternalLinkTracking === 'function'

      this.results.push({
        name: 'Analytics hooks exports',
        passed: hasUseAnalytics && hasUseReadingProgress && hasUseExternalLinkTracking,
        details: `useAnalytics: ${hasUseAnalytics ? '✓' : '✗'}, useReadingProgress: ${hasUseReadingProgress ? '✓' : '✗'}, useExternalLinkTracking: ${hasUseExternalLinkTracking ? '✓' : '✗'}`,
      })
    } catch (error) {
      this.results.push({
        name: 'Analytics module structure',
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private displayResults(): void {
    console.log(chalk.blue('\n📊 Test Results:'))
    console.log(chalk.gray('='.repeat(60)))

    let passed = 0
    let failed = 0

    this.results.forEach((result) => {
      const icon = result.passed ? '✅' : '❌'
      const color = result.passed ? chalk.green : chalk.red

      console.log(`${icon} ${color(result.name)}`)

      if (result.details) {
        console.log(chalk.gray(`   ${result.details}`))
      }

      if (result.error) {
        console.log(chalk.red(`   Error: ${result.error}`))
      }

      console.log()

      if (result.passed) {
        passed++
      } else {
        failed++
      }
    })

    console.log(chalk.gray('='.repeat(60)))
    console.log(`${chalk.green('✅ Passed:')} ${passed}`)
    console.log(`${chalk.red('❌ Failed:')} ${failed}`)

    if (failed === 0) {
      console.log(
        chalk.green('\n🎉 All tests passed! Analytics and Service Worker setup is correct.')
      )
      console.log(chalk.cyan('✨ Ready for production deployment.'))
    } else {
      console.log(chalk.red(`\n💥 ${failed} test(s) failed - please fix before merging`))
      process.exit(1)
    }
  }
}

// Check if running directly
if (import.meta.main) {
  const tester = new AnalyticsServiceWorkerTester()
  await tester.runAllTests()
}
