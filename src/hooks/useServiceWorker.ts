import { useEffect, useState, useCallback, useRef } from 'react'

const isDevelopment = process.env.NODE_ENV === 'development'

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isOnline: boolean
  registration: ServiceWorkerRegistration | null
  error: string | null
  updateAvailable: boolean
}

interface CacheStatus {
  totalCached: number
  blogPostsCached: number
  lastUpdated: number
  error?: string
}

interface ServiceWorkerActions {
  registerSW: () => Promise<void>
  updateSW: () => Promise<void>
  cacheBlogPost: (url: string) => void
  getCacheStatus: () => Promise<CacheStatus>
}

export function useServiceWorker(): ServiceWorkerState & ServiceWorkerActions {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOnline: navigator.onLine,
    registration: null,
    error: null,
    updateAvailable: false,
  })

  // Store event listeners for cleanup
  const eventListenersRef = useRef<{
    registration?: {
      updatefound: () => void
    }
    navigator?: {
      controllerchange: () => void
      message: (event: MessageEvent) => void
    }
    window?: {
      online: () => void
      offline: () => void
    }
  }>({})

  // Register service worker
  const registerSW = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Service Workers are not supported in this browser',
      }))
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports',
      })

      // Only log once per session to avoid console spam
      if (!sessionStorage.getItem('sw-logged')) {
        if (isDevelopment) {
          console.log('[SW] Registration successful:', registration)
        }
        sessionStorage.setItem('sw-logged', 'true')
      }

      setState((prev) => ({
        ...prev,
        isRegistered: true,
        registration,
        error: null,
      }))

      // Check for updates
      const updatefoundHandler = () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              if (isDevelopment) {
                console.log('[SW] New content available, update pending')
              }
              setState((prev) => ({ ...prev, updateAvailable: true }))
            }
          })
        }
      }
      registration.addEventListener('updatefound', updatefoundHandler)
      eventListenersRef.current.registration = {
        updatefound: updatefoundHandler,
      }

      // Handle controller change (new service worker activated)
      const controllerchangeHandler = () => {
        if (isDevelopment) {
          console.log('[SW] New service worker activated')
        }
        window.location.reload()
      }
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        controllerchangeHandler
      )
      eventListenersRef.current.navigator = {
        ...eventListenersRef.current.navigator,
        controllerchange: controllerchangeHandler,
      }
    } catch (error) {
      console.error('[SW] Registration failed:', error)
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Service worker registration failed',
      }))
    }
  }, [state.isSupported])

  // Update service worker
  const updateSW = useCallback(async () => {
    if (state.registration) {
      try {
        const registration = await state.registration.update()
        if (isDevelopment) {
          console.log('[SW] Update triggered:', registration)
        }
      } catch (error) {
        console.error('[SW] Update failed:', error)
      }
    }
  }, [state.registration])

  // Cache a specific blog post
  const cacheBlogPost = useCallback((url: string) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_BLOG_POST',
        url,
      })
    }
  }, [])

  // Get cache status
  const getCacheStatus = useCallback((): Promise<CacheStatus> => {
    return new Promise((resolve) => {
      if (navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel()

        messageChannel.port1.onmessage = (event) => {
          resolve(event.data)
        }

        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2]
        )
      } else {
        resolve({ error: 'No service worker controller available' })
      }
    })
  }, [])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }))
    const handleOffline = () =>
      setState((prev) => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Store for cleanup
    eventListenersRef.current.window = {
      online: handleOnline,
      offline: handleOffline,
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-register service worker on mount
  useEffect(() => {
    if (state.isSupported && !state.isRegistered) {
      registerSW()
    }
  }, [state.isSupported, state.isRegistered, registerSW])

  // Listen for service worker messages
  useEffect(() => {
    if (!state.isSupported) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
        setState((prev) => ({ ...prev, updateAvailable: true }))
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    // Store for cleanup
    eventListenersRef.current.navigator = {
      ...eventListenersRef.current.navigator,
      message: handleMessage,
    }

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [state.isSupported])

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all event listeners
      const listeners = eventListenersRef.current
      const registration = state.registration

      if (registration && listeners.registration) {
        registration.removeEventListener(
          'updatefound',
          listeners.registration.updatefound
        )
      }

      if (listeners.navigator) {
        if (listeners.navigator.controllerchange) {
          navigator.serviceWorker.removeEventListener(
            'controllerchange',
            listeners.navigator.controllerchange
          )
        }
        if (listeners.navigator.message) {
          navigator.serviceWorker.removeEventListener(
            'message',
            listeners.navigator.message
          )
        }
      }

      if (listeners.window) {
        window.removeEventListener('online', listeners.window.online)
        window.removeEventListener('offline', listeners.window.offline)
      }
    }
  }, [state.registration])

  return {
    ...state,
    registerSW,
    updateSW,
    cacheBlogPost,
    getCacheStatus,
  }
}

// Hook for automatic blog post caching
export function useAutoCacheBlogPost(slug: string | undefined) {
  const { cacheBlogPost, isOnline } = useServiceWorker()

  useEffect(() => {
    if (slug && isOnline) {
      // Cache the current blog post for offline reading
      const url = `/blog/${slug}`
      cacheBlogPost(url)
    }
  }, [slug, isOnline, cacheBlogPost])
}

// Hook for offline status with blog-specific features
export function useOfflineStatus() {
  const { isOnline, getCacheStatus } = useServiceWorker()
  const [hasOfflineContent, setHasOfflineContent] = useState(false)

  useEffect(() => {
    const checkOfflineContent = async () => {
      try {
        const status = await getCacheStatus()
        setHasOfflineContent(status.blogPostsCached > 0)
      } catch (error) {
        if (isDevelopment) {
          console.log('Failed to check offline content:', error)
        }
      }
    }

    checkOfflineContent()
  }, [getCacheStatus])

  return {
    isOnline,
    isOffline: !isOnline,
    hasOfflineContent,
  }
}
