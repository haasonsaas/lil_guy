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
      (img as unknown as { __lazyObserver: IntersectionObserver }).__lazyObserver = observer;
    });

    // Cleanup function
    return () => {
      const container = containerRef.current;
      if (container) {
        const images = container.querySelectorAll('img[data-lazy-processed]');
        images.forEach((img) => {
          const observer = (img as unknown as { __lazyObserver?: IntersectionObserver }).__lazyObserver;
          if (observer) {
            observer.disconnect();
            delete (img as unknown as { __lazyObserver?: IntersectionObserver }).__lazyObserver;
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
  // Try WebP version first if it's a generated image
  const webpSrc = src.startsWith('/generated/') ? src.replace(/\.(png|jpg|jpeg)$/i, '.webp') : src;
  
  // Check if browser supports WebP and we have a WebP version
  const supportsWebP = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };

  const tryLoadImage = (imageSrc: string, fallbackSrc?: string) => {
    const tempImg = new Image();
    
    tempImg.onload = () => {
      // Image loaded successfully
      imgElement.src = imageSrc;
      imgElement.alt = alt;
      imgElement.style.opacity = '1';
      
      // Add loaded class for any additional styling
      imgElement.classList.add('lazy-loaded');
      if (imageSrc.endsWith('.webp')) {
        imgElement.classList.add('webp-loaded');
      }
    };
    
    tempImg.onerror = () => {
      if (fallbackSrc && fallbackSrc !== imageSrc) {
        // Try fallback format
        tryLoadImage(fallbackSrc);
      } else {
        // Image failed to load, show error placeholder
        const errorPlaceholder = createErrorPlaceholder(
          imgElement.width || 400, 
          imgElement.height || 300,
          alt
        );
        imgElement.src = errorPlaceholder;
        imgElement.style.opacity = '1';
        imgElement.classList.add('lazy-error');
      }
    };
    
    // Start loading
    tempImg.src = imageSrc;
  };

  // Try WebP first if supported and available, fallback to original
  if (supportsWebP() && webpSrc !== src) {
    tryLoadImage(webpSrc, src);
  } else {
    tryLoadImage(src);
  }
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