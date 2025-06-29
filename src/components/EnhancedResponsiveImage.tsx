import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface EnhancedResponsiveImageProps {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  sizes?: string
  width?: number
  height?: number
  priority?: boolean
}

/**
 * Check if the browser supports WebP format
 */
function supportsWebP(): boolean {
  if (typeof window === 'undefined') return true // SSR, assume support

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  return canvas.toDataURL('image/webp').indexOf('image/webp') === 5
}

/**
 * Generate srcset string for responsive images
 */
function generateSrcSet(basePath: string, format: string): string {
  // Define available widths based on our generation sizes
  const responsiveWidths = [400, 640, 768, 1024, 1280, 1920, 2560]

  // Extract current dimensions from path if present
  const dimensionMatch = basePath.match(/(\d+)x(\d+)/)
  if (!dimensionMatch) return '' // Not a generated image

  const currentWidth = parseInt(dimensionMatch[1])
  const currentHeight = parseInt(dimensionMatch[2])
  const aspectRatio = currentHeight / currentWidth

  return responsiveWidths
    .filter((w) => w <= currentWidth * 2) // Don't upscale beyond 2x
    .map((width) => {
      const height = Math.round(width * aspectRatio)
      const responsivePath = basePath.replace(/\d+x\d+/, `${width}x${height}`)
      return `${responsivePath}.${format} ${width}w`
    })
    .join(', ')
}

/**
 * Generate appropriate sizes attribute based on layout
 */
function generateSizes(type?: 'hero' | 'card' | 'thumbnail'): string {
  switch (type) {
    case 'hero':
      return '100vw'
    case 'card':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    case 'thumbnail':
      return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 400px'
    default:
      return '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px'
  }
}

export default function EnhancedResponsiveImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  sizes,
  width,
  height,
  priority = false,
}: EnhancedResponsiveImageProps) {
  const [supportWebP, setSupportWebP] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setSupportWebP(supportsWebP())
  }, [])

  // Extract file info
  const lastDotIndex = src.lastIndexOf('.')
  const basePath = src.substring(0, lastDotIndex)
  const extension = src.substring(lastDotIndex + 1)

  // Check if this is a generated blog image
  const isGeneratedImage = /\d+x\d+/.test(basePath)

  // Determine image type from dimensions
  let imageType: 'hero' | 'card' | 'thumbnail' | undefined
  if (isGeneratedImage) {
    const dimensionMatch = basePath.match(/(\d+)x(\d+)/)
    if (dimensionMatch) {
      const w = parseInt(dimensionMatch[1])
      if (w >= 1200) imageType = 'hero'
      else if (w >= 800) imageType = 'card'
      else imageType = 'thumbnail'
    }
  }

  // Use provided sizes or generate based on image type
  const sizesAttr = sizes || generateSizes(imageType)

  // Generate sources
  const webpSrcSet = isGeneratedImage ? generateSrcSet(basePath, 'webp') : ''
  const fallbackSrcSet = isGeneratedImage ? generateSrcSet(basePath, 'jpg') : ''

  const handleError = () => {
    setImageError(true)
  }

  // Simple img tag for non-generated images or errors
  if (!isGeneratedImage || imageError || !supportWebP) {
    const fallbackSrc = extension === 'webp' ? `${basePath}.jpg` : src

    return (
      <img
        src={imageError ? fallbackSrc : src}
        alt={alt}
        className={cn('max-w-full h-auto', className)}
        loading={priority ? 'eager' : loading}
        width={width}
        height={height}
        onError={handleError}
      />
    )
  }

  return (
    <picture>
      {/* WebP sources with srcset for modern browsers */}
      {supportWebP && webpSrcSet && (
        <source srcSet={webpSrcSet} type="image/webp" sizes={sizesAttr} />
      )}

      {/* Fallback JPG sources with srcset */}
      {fallbackSrcSet && (
        <source srcSet={fallbackSrcSet} type="image/jpeg" sizes={sizesAttr} />
      )}

      {/* Fallback img tag */}
      <img
        src={`${basePath}.jpg`}
        alt={alt}
        className={cn('max-w-full h-auto', className)}
        loading={priority ? 'eager' : loading}
        onError={handleError}
        width={width}
        height={height}
        sizes={sizesAttr}
        srcSet={fallbackSrcSet}
      />
    </picture>
  )
}

// Export a hook for manual WebP detection if needed
export function useWebPSupport() {
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    setIsSupported(supportsWebP())
  }, [])

  return isSupported
}
