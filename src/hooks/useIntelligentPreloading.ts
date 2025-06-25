import { useEffect, useRef } from 'react';
import { preloadBlogPost } from '@/utils/blog/dynamicLoader';

interface PreloadOptions {
  delay?: number;
  priority?: 'high' | 'medium' | 'low';
  onIdle?: boolean;
}

/**
 * Hook for intelligent preloading of resources
 */
export function useIntelligentPreloading() {
  const preloadQueue = useRef<Array<{ slug: string; options: PreloadOptions }>>([]);
  const isProcessing = useRef(false);

  // Process preload queue
  const processQueue = async () => {
    if (isProcessing.current || preloadQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;

    while (preloadQueue.current.length > 0) {
      const item = preloadQueue.current.shift();
      if (!item) continue;

      const { slug, options } = item;

      // Respect user preferences and connection
      if (shouldSkipPreload()) {
        continue;
      }

      try {
        // Add delay for low priority items
        if (options.priority === 'low' && options.delay) {
          await new Promise(resolve => setTimeout(resolve, options.delay));
        }

        await preloadBlogPost(slug);
        console.log(`📖 Preloaded blog post: ${slug}`);
      } catch (error) {
        console.warn(`Failed to preload blog post: ${slug}`, error);
      }

      // Small delay between preloads to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    isProcessing.current = false;
  };

  // Check if we should skip preloading (slow connection, data saver, etc.)
  const shouldSkipPreload = (): boolean => {
    // Check for data saver mode
    if ('connection' in navigator) {
      const connection = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (connection?.saveData) {
        return true;
      }
      
      // Skip on slow connections
      if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
        return true;
      }
    }

    // Check if battery is low (if available)
    if ('getBattery' in navigator) {
      // Note: Battery API is deprecated but still check if available
      return false; // Skip complex battery check for now
    }

    return false;
  };

  // Queue a blog post for preloading
  const queuePreload = (slug: string, options: PreloadOptions = {}) => {
    const defaultOptions: PreloadOptions = {
      delay: 1000,
      priority: 'medium',
      onIdle: true,
      ...options
    };

    preloadQueue.current.push({ slug, options: defaultOptions });

    // Process immediately for high priority
    if (options.priority === 'high') {
      processQueue();
    } else if (options.onIdle && 'requestIdleCallback' in window) {
      // Use requestIdleCallback for low priority preloads
      requestIdleCallback(() => {
        processQueue();
      }, { timeout: 5000 });
    } else {
      // Fallback to setTimeout
      setTimeout(processQueue, defaultOptions.delay);
    }
  };

  // Preload on link hover (for blog links)
  const handleLinkHover = (slug: string) => {
    queuePreload(slug, { priority: 'high', delay: 200 });
  };

  // Preload related content
  const preloadRelated = (slugs: string[]) => {
    slugs.forEach((slug, index) => {
      queuePreload(slug, {
        priority: 'low',
        delay: 2000 + (index * 500), // Stagger the preloads
        onIdle: true
      });
    });
  };

  return {
    queuePreload,
    handleLinkHover,
    preloadRelated
  };
}

/**
 * Hook specifically for blog card hover preloading
 */
export function useBlogCardPreloading() {
  const { handleLinkHover } = useIntelligentPreloading();
  
  return {
    onMouseEnter: (slug: string) => handleLinkHover(slug),
    onTouchStart: (slug: string) => handleLinkHover(slug), // Mobile support
  };
}