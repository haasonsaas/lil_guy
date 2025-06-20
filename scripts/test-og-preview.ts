#!/usr/bin/env bun
// Test the OG preview pages to ensure they work correctly

const testUrls = [
  'https://haasonsaas.com/og/building-my-blog.html',
  'https://haasonsaas.com/og/the-100x-developer-what-i-learned-building-with-claude-code.html',
  'https://haasonsaas.com/og/building-smart-search-how-i-added-ai-powered-search-to-my-blog-in-30-minutes.html'
];

console.log('Testing OG preview pages with Twitter validator format...\n');

for (const url of testUrls) {
  console.log(`\nTesting: ${url}`);
  console.log('='.repeat(60));
  
  try {
    // Test with Twitterbot user agent
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Twitterbot/1.0'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      continue;
    }
    
    const html = await response.text();
    
    // Check for meta tags
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const twitterImageMatch = html.match(/<meta name="twitter:image" content="([^"]+)"/);
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    
    if (ogImageMatch) {
      console.log(`✅ OG Image: ${ogImageMatch[1]}`);
    } else {
      console.log('❌ No OG image found');
    }
    
    if (twitterImageMatch) {
      console.log(`✅ Twitter Image: ${twitterImageMatch[1]}`);
    } else {
      console.log('❌ No Twitter image found');
    }
    
    if (titleMatch) {
      console.log(`✅ Title: ${titleMatch[1]}`);
    } else {
      console.log('❌ No title found');
    }
    
    // Check for redirect
    const redirectMatch = html.match(/window\.location\.href = "([^"]+)"/);
    if (redirectMatch) {
      console.log(`✅ Redirects to: ${redirectMatch[1]}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

console.log(`\n\n💡 To test with Twitter Card Validator:`);
console.log(`   1. Go to: https://cards-dev.twitter.com/validator`);
console.log(`   2. Enter: https://haasonsaas.com/og/[your-post-slug].html`);
console.log(`   3. The preview should show the correct image and metadata`);
console.log(`\n💡 For regular sharing, users visiting these URLs will be`);
console.log(`   automatically redirected to the actual blog post.`);