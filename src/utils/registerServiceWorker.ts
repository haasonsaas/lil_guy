// Service Worker Registration

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Wait for the page to load
      window.addEventListener('load', async () => {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        console.log(
          '[SW] Service Worker registered successfully:',
          registration.scope
        )

        // Check for updates periodically
        setInterval(
          () => {
            registration.update()
          },
          60 * 60 * 1000
        ) // Check every hour

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available
              console.log('[SW] New service worker available')

              // You could show a notification to the user here
              // For now, we'll just log it
              if (confirm('New version available! Reload to update?')) {
                window.location.reload()
              }
            }
          })
        })

        // Handle controller change (when SW takes control)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW] Controller changed')
        })

        // Enable navigation preload if supported
        if ('navigationPreload' in registration) {
          await registration.navigationPreload.enable()
        }
      })
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error)
    }
  } else {
    console.log('[SW] Service Worker not supported')
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
