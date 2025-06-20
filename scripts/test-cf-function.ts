#!/usr/bin/env bun
// Test the Cloudflare Pages function directly

const slugs = [
  'building-my-blog--a-modern-react---typescript-journey',
  'the-100x-developer--what-i-learned-building-with-claude-code',
  'when-ai-learns-to-write-like-you--a-meta-analysis'
];

// Test with different crawler user agents
const userAgents = [
  'Twitterbot/1.0',
  'facebookexternalhit/1.1',
  'LinkedInBot/1.0',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebookbot Twitterbot/1.0'
];

console.log('Testing Cloudflare Pages function with various crawlers...\n');

for (const slug of slugs) {
  console.log(`\nTesting slug: ${slug}`);
  console.log('='.repeat(60));
  
  for (const ua of userAgents) {
    const url = `https://haasonsaas.com/blog/${slug}`;
    const uaName = ua.split('/')[0] || ua.substring(0, 20);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': ua
        }
      });
      
      const html = await response.text();
      const hasOgImage = html.includes('<meta property="og:image"');
      const hasTwitterImage = html.includes('<meta name="twitter:image"');
      const hasReactApp = html.includes('id="root"');
      
      // Extract actual image URL if present
      let ogImageUrl = '';
      const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
      if (ogMatch) {
        ogImageUrl = ogMatch[1];
      }
      
      console.log(`${uaName.padEnd(20)} - OG: ${hasOgImage ? '✅' : '❌'} Twitter: ${hasTwitterImage ? '✅' : '❌'} React: ${hasReactApp ? '✅' : '❌'}`);
      if (ogImageUrl) {
        console.log(`  Image URL: ${ogImageUrl}`);
      }
    } catch (error) {
      console.log(`${uaName.padEnd(20)} - Error: ${error.message}`);
    }
  }
}

// Also test with curl-like user agent (regular browser)
console.log('\n\nTesting with regular browser user agent:');
console.log('='.repeat(60));

const regularUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
const testSlug = slugs[0];
const url = `https://haasonsaas.com/blog/${testSlug}`;

try {
  const response = await fetch(url, {
    headers: {
      'User-Agent': regularUA
    }
  });
  
  const html = await response.text();
  const hasOgImage = html.includes('<meta property="og:image"');
  const hasTwitterImage = html.includes('<meta name="twitter:image"');
  const hasReactApp = html.includes('id="root"');
  
  console.log(`Regular Browser - OG: ${hasOgImage ? '✅' : '❌'} Twitter: ${hasTwitterImage ? '✅' : '❌'} React: ${hasReactApp ? '✅' : '❌'}`);
} catch (error) {
  console.log(`Regular Browser - Error: ${error.message}`);
}