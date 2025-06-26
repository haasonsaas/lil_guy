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
    "script-src 'self' 'unsafe-inline' data: blob: https://static.cloudflareinsights.com https://cdn.jsdelivr.net",
    "script-src-elem 'self' 'unsafe-inline' data: blob: https://static.cloudflareinsights.com https://cdn.jsdelivr.net",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  // Add performance headers
  response.headers.set('Cache-Control', 'public, max-age=3600')
  response.headers.set('Vary', 'Accept-Encoding')

  // Add modern web headers
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  return response
}
