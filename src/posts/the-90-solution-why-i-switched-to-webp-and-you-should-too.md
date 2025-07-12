---
author: Jonathan Haas
pubDate: '2025-07-12'
title: 'The 90% Solution: Why I Switched to WebP and You Should Too'
description: "The 90% Solution: Why I Switched to WebP and You Should Too: One afternoon of work. Here's exactly how I did it and what I learned along the way."
featured: false
draft: false
tags:
  - performance
  - webp
  - optimization
  - developer-experience
---

I just deleted 15MB of PNG files from my blog and replaced them with 1.5MB of WebP images.

Same visual quality. 90% smaller files. One afternoon of work.

Here's exactly how I did it and what I learned along the way.

## The Problem Was Staring Me in the Face

Every blog post on my site generates three social media images:

- Open Graph: 1200×630px
- Twitter Card: 1200×400px
- LinkedIn: 800×384px

That's 3 PNGs per post. With 50+ posts, I was serving 150+ PNG files totaling over 15MB.

For context, Cloudflare Pages has a 25MB limit for the entire build. I was burning 60% of my budget on social media images that most visitors never see.

## The Numbers Don't Lie

Here's what switching to WebP got me:

**Before (PNG):**

```text
Average file size: 95KB
Total for 3 images: 285KB per post
50 posts × 285KB = 14.25MB
```

**After (WebP):**

```text
Average file size: 12KB
Total for 3 images: 36KB per post
50 posts × 36KB = 1.8MB
```

That's an 87% reduction in file size with zero visible quality loss.

## The Migration Was Surprisingly Simple

Instead of a complex migration script, I went straight to the source. My blog already auto-generates social images using Sharp, so I just changed one line:

```typescript
// Before
await sharp(svgBuffer).png().toFile(outputPath)

// After
await sharp(svgBuffer).webp({ quality: 90 }).toFile(outputPath)
```

Then I updated the file extensions in my image generation logic and deleted all the old PNGs. Done.

## The Gotchas Nobody Mentions

### Social Media Compatibility

The big question: do social platforms support WebP?

- **Twitter/X**: ✅ Full support since 2019
- **LinkedIn**: ✅ Supports WebP for shared links
- **Facebook**: ✅ Converts to JPEG on their end
- **Slack**: ✅ Shows previews correctly

I tested shares on all platforms. Zero issues.

### Browser Support

WebP has 97% browser support. The 3% that don't support it are mostly Internet Explorer users. If they're reading your developer blog in 2025, they have bigger problems than image formats.

### Local Development

One minor annoyance: macOS Preview doesn't show WebP thumbnails in Finder by default. But VS Code, browsers, and every modern image viewer handles them fine.

## Implementation Details That Matter

### Quality Settings

I experimented with different quality levels:

- **100**: 45KB average (still 50% smaller than PNG)
- **90**: 12KB average (my sweet spot)
- **80**: 8KB average (slight artifacts on text)
- **70**: 5KB average (noticeable quality loss)

For social media images with text overlays, 90 is perfect. For photographs, you could go lower.

### Build Performance

Generating WebP is actually faster than PNG:

```bash
# PNG generation
✓ Generated 150 images in 12.3s

# WebP generation
✓ Generated 150 images in 8.7s
```

That's 30% faster builds as a bonus.

### Caching Considerations

I updated my build cache keys to include the format:

```typescript
const cacheKey = `${slug}-${width}x${height}-${format}-v2`
```

This prevented serving cached PNGs with WebP extensions during the transition.

## The Tooling Made It Trivial

Sharp made this migration effortless. Here's my complete WebP generation function:

```typescript
export async function generateWebPImage(
  svgContent: string,
  outputPath: string,
  width: number,
  height: number
) {
  const svgBuffer = Buffer.from(svgContent)

  await sharp(svgBuffer, { density: 144 })
    .resize(width, height)
    .webp({
      quality: 90,
      effort: 4, // Balance between compression and speed
    })
    .toFile(outputPath)
}
```

The `effort` parameter (0-6) controls compression efficiency. Higher values = smaller files but slower generation. 4 is a good balance for build-time generation.

## Should You Make the Switch?

If you're generating images programmatically: **absolutely yes**.

If you're manually creating images: **probably yes**, unless you need specific PNG features like transparency for non-web use.

The migration took me 2 hours including testing. The benefits are permanent:

- 90% smaller image files
- Faster page loads
- More headroom under hosting limits
- Better Core Web Vitals scores

## What About AVIF?

AVIF offers even better compression (another 20-30% smaller than WebP) but has two problems:

1. Only 80% browser support
2. Significantly slower encoding times

I'll revisit AVIF in a year. For now, WebP is the sweet spot of compatibility, performance, and file size.

## Next Steps

Now that I've freed up 13MB of build space, I'm implementing:

1. Responsive images with multiple sizes
2. Lazy loading for below-the-fold images
3. Picture elements with WebP/JPEG fallbacks

But those are optimizations. The WebP migration alone was the 90% solution.

Start there. You can optimize forever, but switching to WebP gives you the biggest win for the least effort.

Your images will load faster. Your builds will be smaller. Your users will be happier.

What are you waiting for?
