import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  quality?: number;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
}

export default function LazyImage({ 
  src, 
  alt, 
  className,
  placeholder,
  quality = 75,
  width,
  height,
  loading = 'lazy'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px 0px', // Start loading 50px before the image comes into view
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  // Generate optimized image URL
  const getOptimizedSrc = (originalSrc: string) => {
    // If it's already optimized or external, return as-is
    if (originalSrc.includes('cloudflare') || originalSrc.startsWith('http')) {
      return originalSrc;
    }
    
    // For local images, you could add optimization params here
    // For now, just return the original
    return originalSrc;
  };

  // Generate placeholder - could be blur hash, solid color, or skeleton
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    // Generate a simple blur placeholder
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#gradient)" />
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="system-ui" font-size="16" fill="#9ca3af">Loading...</text>
      </svg>
    `)}`;
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div 
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse">
          <img
            src={getPlaceholder()}
            alt=""
            className="w-full h-full object-cover opacity-60"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={hasError ? getPlaceholder() : getOptimizedSrc(src)}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
          width={width}
          height={height}
          {...(width && height && {
            style: { aspectRatio: `${width} / ${height}` }
          })}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center">
            <div className="text-sm">Failed to load image</div>
            <div className="text-xs opacity-60 mt-1">{alt}</div>
          </div>
        </div>
      )}
    </div>
  );
}