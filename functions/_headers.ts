import type { PagesFunction } from '@cloudflare/workers-types'

export const onRequest: PagesFunction = async ({ request, next }) => {
  const response = await next()

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )

  // Add CSP that allows your app scripts
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://static.cloudflareinsights.com https://cdn.jsdelivr.net",
    "script-src-elem 'self' 'unsafe-inline' data: blob: https://static.cloudflareinsights.com https://cdn.jsdelivr.net",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')

  // Set both regular CSP and Report-Only to override any defaults
  response.headers.set('Content-Security-Policy', csp)
  // Remove any report-only header that might be set by Cloudflare
  response.headers.delete('Content-Security-Policy-Report-Only')

  // Enhanced differential caching strategy
  const url = new URL(request.url)
  const pathname = url.pathname

  // Immutable assets with hash in filename (JS, CSS, fonts, images with hash)
  if (
    /-[a-f0-9]{8,}\./.test(pathname) &&
    /\.(js|css|woff2?|png|jpg|jpeg|webp|avif|svg|ico)$/.test(pathname)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    response.headers.set('CF-Cache-Tag', 'static-assets')
  }
  // Generated blog images (long cache with revalidation)
  else if (
    pathname.startsWith('/generated/') ||
    pathname.startsWith('/placeholders/')
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
    )
    response.headers.set('CF-Cache-Tag', 'blog-images')
  }
  // Static assets without hash (shorter cache)
  else if (
    /\.(js|css|woff2?|png|jpg|jpeg|webp|avif|svg|ico|pdf|txt|xml)$/.test(
      pathname
    )
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=3600, s-maxage=86400'
    )
    response.headers.set('CF-Cache-Tag', 'static-assets')
  }
  // Blog post pages (moderate cache with stale-while-revalidate)
  else if (pathname.startsWith('/blog/') && !pathname.endsWith('/')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=1800, s-maxage=7200, stale-while-revalidate=3600'
    )
    response.headers.set('CF-Cache-Tag', 'blog-content')
  }
  // Main pages (home, about, blog index)
  else if (
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/blog' ||
    pathname === '/experiments'
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=600, s-maxage=3600, stale-while-revalidate=1800'
    )
    response.headers.set('CF-Cache-Tag', 'main-pages')
  }
  // RSS and sitemap (moderate cache)
  else if (
    pathname === '/rss.xml' ||
    pathname === '/atom.xml' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=3600, s-maxage=86400'
    )
    response.headers.set('CF-Cache-Tag', 'feeds')
  }
  // API endpoints (no cache by default, let specific endpoints override)
  else if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-cache')
  }
  // Default fallback (short cache)
  else {
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=1800')
  }

  // Always set Vary header for proper caching
  response.headers.set('Vary', 'Accept-Encoding, Accept')

  // Add modern web headers
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  return response
}
