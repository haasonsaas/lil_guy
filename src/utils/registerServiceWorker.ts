// Service Worker Registration

const isDevelopment = process.env.NODE_ENV === 'development'

// Global cleanup storage
let registrationCleanup: (() => void) | null = null

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Store listeners for cleanup
      const eventListeners: Array<{
        target: EventTarget
        type: string
        listener: EventListener
      }> = []

      let updateInterval: NodeJS.Timeout | null = null

      const loadHandler = async () => {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        if (isDevelopment) {
          console.log(
            '[SW] Service Worker registered successfully:',
            registration.scope
          )
        }

        // Check for updates periodically
        updateInterval = setInterval(
          () => {
            registration.update()
          },
          60 * 60 * 1000
        ) // Check every hour

        // Handle updates
        const updatefoundHandler = () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available
              if (isDevelopment) {
                console.log('[SW] New service worker available')
              }

              // You could show a notification to the user here
              // For now, we'll just log it
              if (confirm('New version available! Reload to update?')) {
                window.location.reload()
              }
            }
          })
        }
        registration.addEventListener('updatefound', updatefoundHandler)
        eventListeners.push({
          target: registration,
          type: 'updatefound',
          listener: updatefoundHandler,
        })

        // Handle controller change (when SW takes control)
        const controllerchangeHandler = () => {
          if (isDevelopment) {
            console.log('[SW] Controller changed')
          }
        }
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          controllerchangeHandler
        )
        eventListeners.push({
          target: navigator.serviceWorker,
          type: 'controllerchange',
          listener: controllerchangeHandler,
        })

        // Enable navigation preload if supported
        if ('navigationPreload' in registration) {
          await registration.navigationPreload.enable()
        }
      }

      // Wait for the page to load
      window.addEventListener('load', loadHandler)
      eventListeners.push({
        target: window,
        type: 'load',
        listener: loadHandler,
      })

      // Setup global cleanup
      registrationCleanup = () => {
        // Clear interval
        if (updateInterval) {
          clearInterval(updateInterval)
          updateInterval = null
        }

        // Remove all event listeners
        eventListeners.forEach(({ target, type, listener }) => {
          try {
            target.removeEventListener(type, listener)
          } catch (error) {
            console.warn('Failed to remove event listener:', error)
          }
        })
        eventListeners.length = 0
      }

      // Auto-cleanup on page unload
      window.addEventListener('beforeunload', () => {
        if (registrationCleanup) {
          registrationCleanup()
        }
      })
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error)
    }
  } else {
    if (isDevelopment) {
      console.log('[SW] Service Worker not supported')
    }
  }
}

// Cleanup function
export function cleanupServiceWorkerRegistration() {
  if (registrationCleanup) {
    registrationCleanup()
    registrationCleanup = null
  }
}

// Function to cache a specific blog post
export async function cacheBlogPost(url: string) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_BLOG_POST',
      url,
    })
  }
}

// Function to get cache status
export async function getCacheStatus(): Promise<{
  totalCached: number
  blogPostsCached: number
  blogPosts: Array<{ url: string; title: string }>
  lastUpdated: number
} | null> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data)
      }

      navigator.serviceWorker.controller.postMessage(
        {
          type: 'GET_CACHE_STATUS',
        },
        [messageChannel.port2]
      )

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000)
    })
  }

  return null
}

// Function to check if we're offline
export function isOffline(): boolean {
  return !navigator.onLine
}

// Function to listen for online/offline events
export function listenForNetworkChanges(
  onOnline: () => void,
  onOffline: () => void
) {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}
