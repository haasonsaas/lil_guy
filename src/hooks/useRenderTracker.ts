import { useEffect } from 'react'

const isDevelopment = process.env.NODE_ENV === 'development'
const MAX_RENDER_ENTRIES = 100 // Limit memory usage

interface RenderInfo {
  count: number
  lastRender: number
  avgTime: number
}

const renderMap = new Map<string, RenderInfo>()

// Cleanup old entries to prevent memory accumulation
const cleanupOldEntries = () => {
  if (renderMap.size <= MAX_RENDER_ENTRIES) return

  const now = Date.now()
  const oneHourAgo = now - 60 * 60 * 1000 // 1 hour

  // Remove entries older than 1 hour
  for (const [key, info] of renderMap.entries()) {
    if (info.lastRender < oneHourAgo) {
      renderMap.delete(key)
    }
  }

  // If still too many, remove oldest entries
  if (renderMap.size > MAX_RENDER_ENTRIES) {
    const sortedEntries = Array.from(renderMap.entries()).sort(
      (a, b) => a[1].lastRender - b[1].lastRender
    )

    const toRemove = renderMap.size - MAX_RENDER_ENTRIES
    for (let i = 0; i < toRemove; i++) {
      renderMap.delete(sortedEntries[i][0])
    }
  }
}

// Global cleanup function
const cleanupRenderTracker = () => {
  renderMap.clear()
}

// Setup cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupRenderTracker)
}

export function useRenderTracker(componentName: string) {
  useEffect(() => {
    if (!isDevelopment) return

    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      const info = renderMap.get(componentName) || {
        count: 0,
        lastRender: 0,
        avgTime: 0,
      }

      info.count++
      info.avgTime = (info.avgTime * (info.count - 1) + duration) / info.count
      info.lastRender = Date.now()

      renderMap.set(componentName, info)

      // Periodically cleanup old entries
      if (Math.random() < 0.1) {
        // 10% chance on each render
        cleanupOldEntries()
      }
    }
  })
}

export { renderMap, cleanupRenderTracker }
