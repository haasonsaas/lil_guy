import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  className?: string
  sizes?: string
  fallbackFormat?: 'jpg' | 'png'
}

/**
 * Check if browser supports WebP
 */
function supportsWebP(): boolean {
  if (typeof window === 'undefined') return true // Assume support for SSR

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 5
}

/**
 * ResponsiveImage component with WebP support and fallback
 */
export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  loading = 'lazy',
  className,
  sizes,
  fallbackFormat = 'jpg',
}: ResponsiveImageProps) {
  const [isWebPSupported, setIsWebPSupported] = useState(true)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setIsWebPSupported(supportsWebP())
  }, [])

  // Generate fallback URL by replacing .webp extension
  const getFallbackSrc = (webpSrc: string): string => {
    if (!webpSrc.endsWith('.webp')) return webpSrc
    return webpSrc.replace(/\.webp$/, `.${fallbackFormat}`)
  }

  // Handle image load error
  const handleError = () => {
    if (!imgError && src.endsWith('.webp')) {
      setImgError(true)
    }
  }

  // If WebP is not supported or there was an error, use fallback
  const imageSrc =
    (!isWebPSupported || imgError) && src.endsWith('.webp')
      ? getFallbackSrc(src)
      : src

  return (
    <picture>
      {/* WebP source for modern browsers */}
      {src.endsWith('.webp') && isWebPSupported && !imgError && (
        <source srcSet={src} type="image/webp" />
      )}

      {/* Fallback source */}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={cn('max-w-full h-auto', className)}
        sizes={sizes}
        onError={handleError}
      />
    </picture>
  )
}

/**
 * Hook to check WebP support
 */
export function useWebPSupport() {
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    setIsSupported(supportsWebP())
  }, [])

  return isSupported
}
