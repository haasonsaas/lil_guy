import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ReadingProgressProps {
  className?: string
  showPercentage?: boolean
  height?: number
}

export default function ReadingProgress({
  className = '',
  showPercentage = true,
  height = 4,
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const calculateProgress = useCallback(() => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight
    const winHeight = window.innerHeight
    const scrollPercent = scrollTop / (docHeight - winHeight)
    const scrollPercentRounded = Math.round(scrollPercent * 100)

    setProgress(Math.min(100, Math.max(0, scrollPercentRounded)))
    setIsVisible(scrollTop > 100) // Show after scrolling 100px
  }, [])

  useEffect(() => {
    // Calculate initial progress
    calculateProgress()

    // Throttle scroll events for performance
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateProgress()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', calculateProgress)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', calculateProgress)
    }
  }, [calculateProgress])

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isVisible ? 'translate-y-0' : '-translate-y-full',
        className
      )}
      style={{ height: `${height}px` }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800" />

      {/* Progress bar */}
      <div
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      >
        {/* Animated shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>

      {/* Percentage indicator */}
      {showPercentage && progress > 0 && (
        <div
          className={cn(
            'absolute top-full mt-2 px-2 py-1 text-xs font-medium rounded-md shadow-lg transition-all duration-300',
            'bg-background border border-border',
            progress < 10
              ? 'left-0'
              : progress > 90
                ? 'right-0'
                : 'left-1/2 -translate-x-1/2'
          )}
          style={{
            left: progress >= 10 && progress <= 90 ? `${progress}%` : undefined,
          }}
        >
          <span className="text-muted-foreground">{progress}%</span>
        </div>
      )}
    </div>
  )
}

// Add shimmer animation to tailwind
// Add this to your global CSS:
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer {
//   animation: shimmer 2s infinite;
// }
