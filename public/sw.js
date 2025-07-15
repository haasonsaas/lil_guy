// Service Worker for Haas on SaaS Blog
// Provides offline reading capabilities for blog posts

const CACHE_NAME = 'haas-blog-v1'
const OFFLINE_URL = '/offline'

const isDevelopment = self.location.hostname === 'localhost'

// Resources to cache immediately
const STATIC_RESOURCES = ['/', '/blog', '/offline', '/favicon.ico', '/favicon.svg']

// Install event - cache static resources
self.addEventListener('install', (event) => {
  if (isDevelopment) {
    console.log('[SW] Install event')
  }

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        if (isDevelopment) {
          console.log('[SW] Caching static resources')
        }
        return cache.addAll(STATIC_RESOURCES)
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  if (isDevelopment) {
    console.log('[SW] Activate event')
  }

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              if (isDevelopment) {
                console.log('[SW] Deleting old cache:', cacheName)
              }
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // Claim control of all open pages
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)

  // Handle different types of requests
  if (url.pathname.startsWith('/blog/') && !url.pathname.includes('.')) {
    // Blog post requests - cache for offline reading
    event.respondWith(handleBlogPostRequest(event.request))
  } else if (url.pathname === '/' || url.pathname === '/blog') {
    // Main pages - serve from cache, update in background
    event.respondWith(handleMainPageRequest(event.request))
  } else if (url.pathname.startsWith('/generated/') || url.pathname.startsWith('/images/')) {
    // Images - cache with longer expiry
    event.respondWith(handleImageRequest(event.request))
  } else if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    // Static assets - cache first
    event.respondWith(handleStaticAssetRequest(event.request))
  } else {
    // Other requests - network first
    event.respondWith(handleNetworkFirstRequest(event.request))
  }
})

// Handle blog post requests - cache for offline reading
async function handleBlogPostRequest(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache successful responses
      await cache.put(request, networkResponse.clone())
      return networkResponse
    }

    // If network fails, try cache
    return await getCachedResponse(request, cache)
  } catch (error) {
    // Network failed, try cache
    return await getCachedResponse(request, cache)
  }
}

// Handle main page requests - stale while revalidate
async function handleMainPageRequest(request) {
  const cache = await caches.open(CACHE_NAME)

  // Get cached version immediately
  const cachedResponse = await cache.match(request)

  // Fetch fresh version in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cachedResponse)

  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise
}

// Handle image requests - cache first with fallback
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAME)

  // Try cache first
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    // Try network
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache successful responses
      await cache.put(request, networkResponse.clone())
      return networkResponse
    }

    return networkResponse
  } catch (error) {
    // Return a placeholder image or offline message
    return new Response('Image not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    })
  }
}

// Handle static asset requests - cache first
async function handleStaticAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME)

  // Try cache first
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    // Try network
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache successful responses
      await cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // Return offline fallback if available
    return await getCachedResponse(request, cache)
  }
}

// Handle other requests - network first
async function handleNetworkFirstRequest(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Optionally cache successful responses
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // Try cache as fallback
    const cache = await caches.open(CACHE_NAME)
    return await getCachedResponse(request, cache)
  }
}

// Helper function to get cached response with offline fallback
async function getCachedResponse(request, cache) {
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  // If no cached version exists, return offline page for navigation requests
  if (request.mode === 'navigate') {
    const offlineResponse = await cache.match(OFFLINE_URL)
    if (offlineResponse) {
      return offlineResponse
    }
  }

  // Return a basic offline response
  return new Response('Content not available offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

// Handle background sync for caching blog posts when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'cache-blog-posts') {
    event.waitUntil(cacheImportantBlogPosts())
  }
})

// Cache important blog posts in background
async function cacheImportantBlogPosts() {
  try {
    // Fetch the blog index to get list of posts
    const response = await fetch('/blog')
    if (!response.ok) return

    const cache = await caches.open(CACHE_NAME)

    // Cache the blog index page
    await cache.put('/blog', response.clone())

    if (isDevelopment) {
      console.log('[SW] Background caching completed')
    }
  } catch (error) {
    if (isDevelopment) {
      console.log('[SW] Background caching failed:', error)
    }
  }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_BLOG_POST') {
    const url = event.data.url
    if (url) {
      cacheBlogPost(url)
    }
  }

  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then((status) => {
      event.ports[0].postMessage(status)
    })
  }
})

// Cache a specific blog post
async function cacheBlogPost(url) {
  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.add(url)
    if (isDevelopment) {
      console.log('[SW] Cached blog post:', url)
    }
  } catch (error) {
    if (isDevelopment) {
      console.log('[SW] Failed to cache blog post:', url, error)
    }
  }
}

// Get cache status
async function getCacheStatus() {
  const cache = await caches.open(CACHE_NAME)
  const keys = await cache.keys()

  const blogPostRequests = keys.filter(
    (request) => request.url.includes('/blog/') && !request.url.includes('.')
  )

  const blogPosts = await Promise.all(
    blogPostRequests.map(async (request) => {
      const response = await cache.match(request)
      if (response) {
        const text = await response.text()
        const titleMatch = text.match(/<title>(.*?)<\/title>/)
        const title = titleMatch ? titleMatch[1] : 'Untitled'
        return { url: request.url, title }
      }
      return null
    })
  )

  return {
    totalCached: keys.length,
    blogPostsCached: blogPosts.length,
    blogPosts: blogPosts.filter((p) => p),
    lastUpdated: Date.now(),
  }
}
