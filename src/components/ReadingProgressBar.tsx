import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ReadingProgressBarProps {
  showPercentage?: boolean
}

export const ReadingProgressBar = ({
  showPercentage = true,
}: ReadingProgressBarProps = {}) => {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateProgress = () => {
      try {
        const mainContent = document.querySelector('main')
        const relatedTopics = Array.from(document.querySelectorAll('h2')).find(
          (h2) => h2.textContent?.includes('Related Topics')
        )

        if (!mainContent) return

        // Check if we've scrolled enough to show the progress bar
        const scrollTop = window.scrollY
        setIsVisible(scrollTop > 100)

        if (!relatedTopics) {
          // Fallback to document height if Related Topics not found
          const windowHeight = window.innerHeight
          const documentHeight =
            document.documentElement.scrollHeight - windowHeight
          const progress = (scrollTop / documentHeight) * 100
          setProgress(Math.min(Math.round(progress), 100))
          return
        }

        const mainContentTop = mainContent.getBoundingClientRect().top
        const relatedTopicsTop = relatedTopics.getBoundingClientRect().top

        // Calculate progress based on the distance to Related Topics
        const totalDistance = relatedTopicsTop - mainContentTop
        const scrolledDistance = Math.max(0, -mainContentTop)
        const progress = Math.min((scrolledDistance / totalDistance) * 100, 100)

        setProgress(Math.round(progress))
      } catch (error) {
        // Silently handle errors
      }
    }

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      window.addEventListener('scroll', updateProgress)
      window.addEventListener('resize', updateProgress)
      updateProgress()
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  return (
    <>
      <div
        className={cn(
          'fixed top-0 left-0 w-full h-1.5 bg-muted/30 z-[100] no-print backdrop-blur-sm overflow-visible transition-transform duration-300',
          isVisible ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div
          className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-300 ease-out shadow-sm relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          {/* Add a subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          {/* Add a moving shine effect when progress is active */}
          {progress > 0 && progress < 100 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
          )}
        </div>
      </div>

      {/* Percentage indicator */}
      {showPercentage && isVisible && progress > 0 && (
        <div
          className={cn(
            'fixed top-2 z-[101] px-2 py-1 text-xs font-medium rounded-md shadow-lg transition-all duration-300',
            'bg-background/95 backdrop-blur-sm border border-border no-print',
            progress < 10
              ? 'left-2'
              : progress > 90
                ? 'right-2'
                : 'left-1/2 -translate-x-1/2'
          )}
          style={{
            left: progress >= 10 && progress <= 90 ? `${progress}%` : undefined,
            transform:
              progress >= 10 && progress <= 90 ? 'translateX(-50%)' : undefined,
          }}
        >
          <span className="text-foreground font-semibold">{progress}%</span>
          <span className="text-muted-foreground ml-1">read</span>
        </div>
      )}
    </>
  )
}
