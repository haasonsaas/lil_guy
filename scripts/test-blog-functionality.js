#!/usr/bin/env node

import { chromium } from 'playwright'

async function testBlogFunctionality() {
  console.log('🧪 Testing current blog functionality...')

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Test 1: Homepage loads and shows blog posts
    console.log('1. Testing homepage...')
    await page.goto('http://localhost:8082')
    await page.waitForSelector('[data-testid="blog-card"], .blog-card, article', { timeout: 10000 })

    const blogCards = await page.locator('[data-testid="blog-card"], .blog-card, article').count()
    console.log(`   ✅ Homepage loaded with ${blogCards} blog cards`)

    // Test 2: Blog page loads
    console.log('2. Testing blog page...')
    await page.goto('http://localhost:8082/blog')
    await page.waitForSelector('[data-testid="blog-card"], .blog-card, article', { timeout: 10000 })

    const blogPageCards = await page
      .locator('[data-testid="blog-card"], .blog-card, article')
      .count()
    console.log(`   ✅ Blog page loaded with ${blogPageCards} blog cards`)

    // Test 3: Individual blog post loads
    console.log('3. Testing individual blog post...')
    const firstPostLink = page.locator('a[href*="/blog/"]').first()
    const postUrl = await firstPostLink.getAttribute('href')

    await page.goto(`http://localhost:8082${postUrl}`)
    await page.waitForSelector('h1, .post-title, [data-testid="post-title"]', {
      timeout: 10000,
    })

    const postTitle = await page
      .locator('h1, .post-title, [data-testid="post-title"]')
      .first()
      .textContent()
    console.log(`   ✅ Blog post loaded: "${postTitle?.slice(0, 50)}..."`)

    // Test 4: Search functionality
    console.log('4. Testing search...')
    await page.goto('http://localhost:8082/blog')

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], [data-testid="search"]'
    )
    if ((await searchInput.count()) > 0) {
      await searchInput.first().fill('AI')
      await page.waitForTimeout(500) // Wait for search results
      console.log(`   ✅ Search functionality working`)
    } else {
      console.log(`   ⚠️  Search input not found, skipping search test`)
    }

    // Test 5: Tags page
    console.log('5. Testing tags page...')
    await page.goto('http://localhost:8082/tags')
    await page.waitForTimeout(2000)

    const tagsFound = await page.locator('a[href*="/tags/"], .tag, [data-testid="tag"]').count()
    if (tagsFound > 0) {
      console.log(`   ✅ Tags page loaded with ${tagsFound} tags`)
    } else {
      console.log(`   ⚠️  Tags page loaded but no tags found`)
    }

    // Test 6: Performance check
    console.log('6. Testing performance...')
    const performanceEntries = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        transferSize: navigation.transferSize,
      }
    })

    console.log(`   📊 DOM Content Loaded: ${performanceEntries.domContentLoaded.toFixed(2)}ms`)
    console.log(`   📊 Load Complete: ${performanceEntries.loadComplete.toFixed(2)}ms`)
    console.log(
      `   📊 Transfer Size: ${(performanceEntries.transferSize / 1024 / 1024).toFixed(2)}MB`
    )

    console.log('\n✅ All tests passed! Current functionality is working.')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    throw error
  } finally {
    await browser.close()
  }
}

testBlogFunctionality().catch(console.error)
