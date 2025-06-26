import { useEffect, useCallback, useRef } from 'react'
import analytics, { BlogEvents } from '@/utils/analytics'

/**
 * Custom hook for analytics tracking with React components
 */
export function useAnalytics() {
  const initialized = useRef(false)

  // Initialize analytics on mount
  useEffect(() => {
    if (!initialized.current) {
      analytics.initialize()
      initialized.current = true
    }
  }, [])

  const trackPageView = useCallback(() => {
    // Cloudflare Web Analytics automatically tracks page views
    // This is here for potential future custom tracking
  }, [])

  const trackPostView = useCallback(
    (slug: string, title: string, tags: string[] = []) => {
      analytics.trackPostView(slug, title, tags)
    },
    []
  )

  const trackPostReadComplete = useCallback(
    (slug: string, timeSpent: number) => {
      analytics.trackPostReadComplete(slug, timeSpent)
    },
    []
  )

  const trackPostShare = useCallback((slug: string, platform: string) => {
    analytics.trackPostShare(slug, platform)
  }, [])

  const trackTagClick = useCallback(
    (tag: string, context: 'post' | 'sidebar' | 'page') => {
      analytics.trackTagClick(tag, context)
    },
    []
  )

  const trackNewsletterSubscribe = useCallback((source: string) => {
    analytics.trackNewsletterSubscribe(source)
  }, [])

  const trackExternalLinkClick = useCallback((url: string, text: string) => {
    analytics.trackExternalLinkClick(url, text)
  }, [])

  const trackThemeChange = useCallback((theme: string) => {
    analytics.trackThemeChange(theme)
  }, [])

  return {
    trackPageView,
    trackPostView,
    trackPostReadComplete,
    trackPostShare,
    trackTagClick,
    trackNewsletterSubscribe,
    trackExternalLinkClick,
    trackThemeChange,
  }
}

/**
 * Hook for tracking reading progress and completion
 */
export function useReadingProgress(slug: string) {
  const startTime = useRef<number>(Date.now())
  const hasTrackedCompletion = useRef<boolean>(false)
  const { trackPostReadComplete } = useAnalytics()

  const trackCompletion = useCallback(() => {
    if (!hasTrackedCompletion.current) {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000)
      trackPostReadComplete(slug, timeSpent)
      hasTrackedCompletion.current = true
    }
  }, [slug, trackPostReadComplete])

  // Track when user scrolls near the end of the post
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercentage =
        (window.scrollY + window.innerHeight) /
        document.documentElement.scrollHeight

      // Track completion when user scrolls to 90% of the page
      if (scrollPercentage >= 0.9) {
        trackCompletion()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [trackCompletion])

  // Also track completion when user leaves the page (if they spent meaningful time)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000)
      if (timeSpent > 30) {
        // Only track if they spent more than 30 seconds
        trackCompletion()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [trackCompletion])

  return { trackCompletion }
}

/**
 * Hook for tracking external link clicks
 */
export function useExternalLinkTracking() {
  const { trackExternalLinkClick } = useAnalytics()

  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest('a')

      if (link && link.href && link.hostname !== window.location.hostname) {
        trackExternalLinkClick(link.href, link.textContent || link.href)
      }
    }

    document.addEventListener('click', handleLinkClick)
    return () => document.removeEventListener('click', handleLinkClick)
  }, [trackExternalLinkClick])
}

export default useAnalytics
