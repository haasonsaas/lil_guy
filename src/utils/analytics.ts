/**
 * Analytics utilities for Cloudflare Web Analytics
 */

// Environment configuration
const config = {
  // Replace with your actual Cloudflare Web Analytics token
  cfAnalyticsToken:
    import.meta.env.VITE_CF_ANALYTICS_TOKEN || 'YOUR_TOKEN_HERE',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}

/**
 * Analytics event types for type safety
 */
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, string | number | boolean>
}

/**
 * Blog-specific analytics events
 */
export const BlogEvents = {
  POST_VIEW: 'post_view',
  POST_READ_COMPLETE: 'post_read_complete',
  POST_SHARE: 'post_share',
  TAG_CLICK: 'tag_click',
  NEWSLETTER_SUBSCRIBE: 'newsletter_subscribe',
  EXTERNAL_LINK_CLICK: 'external_link_click',
  SEARCH_USED: 'search_used',
  THEME_CHANGE: 'theme_change',
} as const

/**
 * Initialize Cloudflare Web Analytics
 * This is automatically called when the script loads
 */
// Global flag to prevent multiple initialization logs
let analyticsInitialized = false

export function initializeAnalytics(): void {
  if (analyticsInitialized) {
    return
  }

  analyticsInitialized = true

  if (config.isDevelopment) {
    console.log('📊 Analytics initialized (development mode)')
    return
  }

  // Check if Cloudflare Web Analytics script is actually loaded
  if (typeof window !== 'undefined' && '__cfRUM' in window) {
    console.log('📊 Cloudflare Web Analytics active')
  } else {
    console.warn(
      '📊 Cloudflare Web Analytics script not found - add script tag to index.html'
    )
  }
}

/**
 * Track custom events (requires Cloudflare Web Analytics Pro)
 * For now, we'll log these events for potential future use
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (config.isDevelopment) {
    console.log('📊 Analytics Event:', event)
    return
  }

  // Store events in localStorage for potential batch sending
  try {
    const events = JSON.parse(localStorage.getItem('pending_analytics') || '[]')
    events.push({
      ...event,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    })

    // Keep only last 50 events
    if (events.length > 50) {
      events.splice(0, events.length - 50)
    }

    localStorage.setItem('pending_analytics', JSON.stringify(events))
  } catch (error) {
    console.error('Failed to store analytics event:', error)
  }
}

/**
 * Track blog post view with metadata
 */
export function trackPostView(
  slug: string,
  title: string,
  tags: string[] = []
): void {
  trackEvent({
    name: BlogEvents.POST_VIEW,
    properties: {
      slug,
      title,
      tags: tags.join(','),
      reading_time: calculateReadingTime(document.body.innerText),
    },
  })
}

/**
 * Track when user completes reading a post (scrolls to bottom)
 */
export function trackPostReadComplete(slug: string, timeSpent: number): void {
  trackEvent({
    name: BlogEvents.POST_READ_COMPLETE,
    properties: {
      slug,
      time_spent_seconds: timeSpent,
    },
  })
}

/**
 * Track social sharing
 */
export function trackPostShare(slug: string, platform: string): void {
  trackEvent({
    name: BlogEvents.POST_SHARE,
    properties: {
      slug,
      platform,
    },
  })
}

/**
 * Track tag clicks for content discovery insights
 */
export function trackTagClick(
  tag: string,
  context: 'post' | 'sidebar' | 'page'
): void {
  trackEvent({
    name: BlogEvents.TAG_CLICK,
    properties: {
      tag,
      context,
    },
  })
}

/**
 * Track newsletter subscriptions
 */
export function trackNewsletterSubscribe(source: string): void {
  trackEvent({
    name: BlogEvents.NEWSLETTER_SUBSCRIBE,
    properties: {
      source,
    },
  })
}

/**
 * Track external link clicks
 */
export function trackExternalLinkClick(url: string, text: string): void {
  trackEvent({
    name: BlogEvents.EXTERNAL_LINK_CLICK,
    properties: {
      url,
      link_text: text,
    },
  })
}

/**
 * Track theme changes for UX insights
 */
export function trackThemeChange(theme: string): void {
  trackEvent({
    name: BlogEvents.THEME_CHANGE,
    properties: {
      theme,
    },
  })
}

/**
 * Calculate reading time from text content
 */
function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

/**
 * Get stored analytics events (for debugging or potential API sending)
 */
export function getStoredEvents(): Array<
  AnalyticsEvent & { timestamp: string; url: string }
> {
  try {
    return JSON.parse(localStorage.getItem('pending_analytics') || '[]')
  } catch {
    return []
  }
}

/**
 * Clear stored analytics events
 */
export function clearStoredEvents(): void {
  localStorage.removeItem('pending_analytics')
}

export default {
  initialize: initializeAnalytics,
  track: trackEvent,
  trackPostView,
  trackPostReadComplete,
  trackPostShare,
  trackTagClick,
  trackNewsletterSubscribe,
  trackExternalLinkClick,
  trackThemeChange,
  getStoredEvents,
  clearStoredEvents,
}
