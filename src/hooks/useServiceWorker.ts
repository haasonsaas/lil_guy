import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
  updateAvailable: boolean;
}

interface CacheStatus {
  totalCached: number;
  blogPostsCached: number;
  lastUpdated: number;
  error?: string;
}

interface ServiceWorkerActions {
  registerSW: () => Promise<void>;
  updateSW: () => Promise<void>;
  cacheBlogPost: (url: string) => void;
  getCacheStatus: () => Promise<CacheStatus>;
}

export function useServiceWorker(): ServiceWorkerState & ServiceWorkerActions {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOnline: navigator.onLine,
    registration: null,
    error: null,
    updateAvailable: false,
  });

  // Register service worker
  const registerSW = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ 
        ...prev, 
        error: 'Service Workers are not supported in this browser' 
      }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports'
      });

      console.log('[SW] Registration successful:', registration);

      setState(prev => ({
        ...prev,
        isRegistered: true,
        registration,
        error: null
      }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New content available, update pending');
              setState(prev => ({ ...prev, updateAvailable: true }));
            }
          });
        }
      });

      // Handle controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] New service worker activated');
        window.location.reload();
      });

    } catch (error) {
      console.error('[SW] Registration failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Service worker registration failed'
      }));
    }
  }, [state.isSupported]);

  // Update service worker
  const updateSW = useCallback(async () => {
    if (state.registration) {
      try {
        const registration = await state.registration.update();
        console.log('[SW] Update triggered:', registration);
      } catch (error) {
        console.error('[SW] Update failed:', error);
      }
    }
  }, [state.registration]);

  // Cache a specific blog post
  const cacheBlogPost = useCallback((url: string) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_BLOG_POST',
        url
      });
    }
  }, []);

  // Get cache status
  const getCacheStatus = useCallback((): Promise<CacheStatus> => {
    return new Promise((resolve) => {
      if (navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2]
        );
      } else {
        resolve({ error: 'No service worker controller available' });
      }
    });
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-register service worker on mount
  useEffect(() => {
    if (state.isSupported && !state.isRegistered) {
      registerSW();
    }
  }, [state.isSupported, state.isRegistered, registerSW]);

  // Listen for service worker messages
  useEffect(() => {
    if (!state.isSupported) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
        setState(prev => ({ ...prev, updateAvailable: true }));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [state.isSupported]);

  return {
    ...state,
    registerSW,
    updateSW,
    cacheBlogPost,
    getCacheStatus,
  };
}

// Hook for automatic blog post caching
export function useAutoCacheBlogPost(slug: string | undefined) {
  const { cacheBlogPost, isOnline } = useServiceWorker();

  useEffect(() => {
    if (slug && isOnline) {
      // Cache the current blog post for offline reading
      const url = `/blog/${slug}`;
      cacheBlogPost(url);
    }
  }, [slug, isOnline, cacheBlogPost]);
}

// Hook for offline status with blog-specific features
export function useOfflineStatus() {
  const { isOnline, getCacheStatus } = useServiceWorker();
  const [hasOfflineContent, setHasOfflineContent] = useState(false);

  useEffect(() => {
    const checkOfflineContent = async () => {
      try {
        const status = await getCacheStatus();
        setHasOfflineContent(status.blogPostsCached > 0);
      } catch (error) {
        console.log('Failed to check offline content:', error);
      }
    };

    checkOfflineContent();
  }, [getCacheStatus]);

  return {
    isOnline,
    isOffline: !isOnline,
    hasOfflineContent,
  };
}