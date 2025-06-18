import { useEffect } from 'react';

export function useLazyImageEnhancement(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!containerRef.current) return;

    const images = containerRef.current.querySelectorAll('img');
    
    images.forEach((img) => {
      // Skip if already processed or is a placeholder
      if (img.dataset.lazyProcessed || img.src.startsWith('data:')) return;

      // Mark as processed
      img.dataset.lazyProcessed = 'true';

      // Store original src
      const originalSrc = img.src;
      const originalAlt = img.alt || '';

      // Create placeholder
      const placeholder = createPlaceholder(img.width || 400, img.height || 300);
      
      // Set up intersection observer for this image
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            loadImage(img, originalSrc, originalAlt);
            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px 0px',
        }
      );

      // Set placeholder initially
      img.src = placeholder;
      img.style.transition = 'opacity 0.3s ease';
      img.style.opacity = '0.6';
      
      // Start observing
      observer.observe(img);

      // Store the observer for cleanup
      (img as any).__lazyObserver = observer;
    });

    // Cleanup function
    return () => {
      if (containerRef.current) {
        const images = containerRef.current.querySelectorAll('img[data-lazy-processed]');
        images.forEach((img) => {
          const observer = (img as any).__lazyObserver;
          if (observer) {
            observer.disconnect();
            delete (img as any).__lazyObserver;
          }
        });
      }
    };
  }, [containerRef]);
}

function createPlaceholder(width: number, height: number): string {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#gradient)" />
      <circle cx="50%" cy="40%" r="20" fill="#d1d5db" opacity="0.5"/>
      <text x="50%" y="60%" text-anchor="middle" dy="0.3em" font-family="system-ui" font-size="12" fill="#9ca3af">Loading image...</text>
    </svg>
  `)}`;
}

function loadImage(imgElement: HTMLImageElement, src: string, alt: string) {
  // Create a new image to preload
  const tempImg = new Image();
  
  tempImg.onload = () => {
    // Image loaded successfully
    imgElement.src = src;
    imgElement.alt = alt;
    imgElement.style.opacity = '1';
    
    // Add loaded class for any additional styling
    imgElement.classList.add('lazy-loaded');
  };
  
  tempImg.onerror = () => {
    // Image failed to load, show error placeholder
    const errorPlaceholder = createErrorPlaceholder(
      imgElement.width || 400, 
      imgElement.height || 300,
      alt
    );
    imgElement.src = errorPlaceholder;
    imgElement.style.opacity = '1';
    imgElement.classList.add('lazy-error');
  };
  
  // Start loading
  tempImg.src = src;
}

function createErrorPlaceholder(width: number, height: number, alt: string): string {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#fef2f2" stroke="#fecaca" stroke-width="1"/>
      <text x="50%" y="40%" text-anchor="middle" dy="0.3em" font-family="system-ui" font-size="14" fill="#ef4444">⚠️ Image failed to load</text>
      <text x="50%" y="60%" text-anchor="middle" dy="0.3em" font-family="system-ui" font-size="11" fill="#991b1b">${alt.substring(0, 30)}${alt.length > 30 ? '...' : ''}</text>
    </svg>
  `)}`;
}