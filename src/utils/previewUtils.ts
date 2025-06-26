// Secret key for generating preview tokens - in production, use environment variable
const PREVIEW_SECRET =
  import.meta.env.VITE_PREVIEW_SECRET ||
  'default-preview-secret-change-in-production'

/**
 * Simple hash function for client-side use
 * @param str - String to hash
 * @returns Hash string
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Generate a preview token for a draft post
 * @param slug - The post slug
 * @param expiresIn - Hours until expiration (default 168 = 7 days)
 * @returns Preview token
 */
export async function generatePreviewToken(
  slug: string,
  expiresIn: number = 168
): Promise<string> {
  const expiresAt = Date.now() + expiresIn * 60 * 60 * 1000
  const data = `${slug}:${expiresAt}:${PREVIEW_SECRET}`
  const hash = await hashString(data)

  // Create a URL-safe token that includes slug and expiration
  const token = btoa(`${slug}:${expiresAt}:${hash.substring(0, 16)}`)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return token
}

/**
 * Validate a preview token
 * @param token - The preview token to validate
 * @param slug - The post slug to validate against
 * @returns Whether the token is valid
 */
export async function validatePreviewToken(
  token: string,
  slug: string
): Promise<boolean> {
  try {
    // Decode base64url token
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    const decoded = atob(base64 + padding)
    const [tokenSlug, expiresAtStr, tokenHash] = decoded.split(':')

    // Check if slug matches
    if (tokenSlug !== slug) {
      return false
    }

    // Check if token has expired
    const expiresAt = parseInt(expiresAtStr, 10)
    if (Date.now() > expiresAt) {
      return false
    }

    // Verify the hash
    const data = `${tokenSlug}:${expiresAtStr}:${PREVIEW_SECRET}`
    const expectedHash = (await hashString(data)).substring(0, 16)

    return tokenHash === expectedHash
  } catch {
    return false
  }
}

/**
 * Generate a shareable preview URL
 * @param slug - The post slug
 * @param baseUrl - The base URL of the site
 * @param expiresIn - Hours until expiration
 * @returns Full preview URL
 */
export async function generatePreviewUrl(
  slug: string,
  baseUrl: string = window.location.origin,
  expiresIn: number = 168
): Promise<string> {
  const token = await generatePreviewToken(slug, expiresIn)
  return `${baseUrl}/blog/${slug}?preview=${token}`
}

/**
 * Parse preview token expiration time
 * @param token - The preview token
 * @returns Expiration date or null if invalid
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    // Decode base64url token
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    const decoded = atob(base64 + padding)
    const [, expiresAtStr] = decoded.split(':')
    const expiresAt = parseInt(expiresAtStr, 10)
    return new Date(expiresAt)
  } catch {
    return null
  }
}
