#!/usr/bin/env bun
// Test script to verify OpenGraph images are accessible

const testUrls = [
  'https://haasonsaas.com/generated/1200x630-building-my-blog--a-modern-react---typescript-journey.webp',
  'https://haasonsaas.com/generated/1200x630-the-100x-developer--what-i-learned-building-with-claude-code.webp',
  'https://haasonsaas.com/generated/1200x630-when-ai-learns-to-write-like-you--a-meta-analysis.webp',
]

console.log('Testing OpenGraph image URLs...\n')

for (const url of testUrls) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')

    console.log(`URL: ${url}`)
    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Content-Type: ${contentType}`)
    console.log(
      `Size: ${contentLength ? `${(parseInt(contentLength) / 1024).toFixed(2)} KB` : 'Unknown'}`
    )
    console.log(`✅ ${response.ok ? 'Accessible' : 'Not accessible'}\n`)
  } catch (error) {
    console.log(`URL: ${url}`)
    console.log(`❌ Error: ${error.message}\n`)
  }
}

// Test the blog post function with a crawler user agent
console.log('\nTesting blog post with crawler user agent...\n')

const testPost = 'building-my-blog--a-modern-react---typescript-journey'
const blogUrl = `https://haasonsaas.com/blog/${testPost}`

try {
  const response = await fetch(blogUrl, {
    headers: {
      'User-Agent': 'Twitterbot/1.0',
    },
  })

  const html = await response.text()
  const hasOgImage = html.includes('og:image')
  const hasTwitterImage = html.includes('twitter:image')

  console.log(`URL: ${blogUrl}`)
  console.log(`Status: ${response.status}`)
  console.log(`Has og:image meta tag: ${hasOgImage ? '✅' : '❌'}`)
  console.log(`Has twitter:image meta tag: ${hasTwitterImage ? '✅' : '❌'}`)

  if (hasOgImage) {
    const ogImageMatch = html.match(
      /<meta property="og:image" content="([^"]+)"/
    )
    if (ogImageMatch) {
      console.log(`og:image URL: ${ogImageMatch[1]}`)
    }
  }
} catch (error) {
  console.log(`❌ Error testing blog post: ${error.message}`)
}
