import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  quality?: number
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  preferWebP?: boolean
  sizes?: string
}

export default function LazyImage({
  src,
  alt,
  className,
  placeholder,
  quality = 75,
  width,
  height,
  loading = 'lazy',
  preferWebP = true,
  sizes,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px 0px', // Start loading 50px before the image comes into view
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [loading])

  // Generate optimized image sources with AVIF support
  const getOptimizedSources = (originalSrc: string) => {
    // If it's already external, return as-is
    if (originalSrc.startsWith('http')) {
      return { avif: originalSrc, webp: originalSrc, fallback: originalSrc }
    }

    // For local generated images, prefer AVIF > WebP > fallback
    if (originalSrc.startsWith('/generated/')) {
      const basePath = originalSrc.replace(/\.(png|jpg|jpeg|webp|avif)$/i, '')
      
      // Generate all format sources
      const avifSrc = `${basePath}.avif`
      const webpSrc = `${basePath}.webp`
      const fallbackSrc = originalSrc.endsWith('.png') ? originalSrc : `${basePath}.png`
      
      return { 
        avif: avifSrc, 
        webp: webpSrc, 
        fallback: fallbackSrc 
      }
    }

    return { avif: originalSrc, webp: originalSrc, fallback: originalSrc }
  }

  // Generate placeholder - could be blur hash, solid color, or skeleton
  const getPlaceholder = () => {
    if (placeholder) return placeholder

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
    `)}`
  }

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoaded(true)
  }

  const sources = getOptimizedSources(src)

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

      {/* Actual image with WebP support */}
      {isInView && !hasError && (
        <picture
          className={cn(
            'w-full h-full transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        >
          {/* AVIF source (best compression, newest browsers) */}
          {sources.avif !== sources.fallback && (
            <source
              srcSet={sources.avif}
              type="image/avif"
              {...(sizes && { sizes })}
            />
          )}

          {/* WebP source (good compression, wide support) */}
          {sources.webp !== sources.fallback && (
            <source
              srcSet={sources.webp}
              type="image/webp"
              {...(sizes && { sizes })}
            />
          )}

          {/* Fallback image */}
          <img
            src={sources.fallback}
            alt={alt}
            className="w-full h-full object-cover"
            onLoad={handleLoad}
            onError={handleError}
            loading={loading}
            width={width}
            height={height}
            {...(sizes && { sizes })}
            {...(width &&
              height && {
                style: { aspectRatio: `${width} / ${height}` },
              })}
          />
        </picture>
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
  )
}
