import React, { useState, useEffect } from 'react'
import { Bug, Activity, Zap, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { renderMap } from '../hooks/useRenderTracker'

const isDevelopment = process.env.NODE_ENV === 'development'

interface RenderInfo {
  count: number
  lastRender: number
  avgTime: number
}

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'renders' | 'performance' | 'state'
  >('renders')
  const [renderStats, setRenderStats] = useState<[string, RenderInfo][]>([])

  useEffect(() => {
    if (!isDevelopment || !isOpen) return

    const interval = setInterval(() => {
      setRenderStats(Array.from(renderMap.entries()))
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isDevelopment) {
    return null
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        title="Open DevTools"
      >
        <Bug className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-96 h-96 bg-background border-l border-t rounded-tl-lg shadow-2xl">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Bug className="w-4 h-4" />
          DevTools
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-muted rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('renders')}
          className={cn(
            'flex-1 p-2 text-sm',
            activeTab === 'renders' && 'border-b-2 border-primary'
          )}
        >
          Renders
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={cn(
            'flex-1 p-2 text-sm',
            activeTab === 'performance' && 'border-b-2 border-primary'
          )}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveTab('state')}
          className={cn(
            'flex-1 p-2 text-sm',
            activeTab === 'state' && 'border-b-2 border-primary'
          )}
        >
          State
        </button>
      </div>

      <div className="p-3 overflow-auto h-[280px]">
        {activeTab === 'renders' && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground mb-2">
              Component render counts
            </div>
            {renderStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No components tracked yet. Use useRenderTracker hook.
              </p>
            ) : (
              renderStats
                .sort((a, b) => b[1].count - a[1].count)
                .map(([name, info]) => (
                  <div key={name} className="flex justify-between text-sm">
                    <span className="font-mono">{name}</span>
                    <div className="flex gap-4 text-muted-foreground">
                      <span>{info.count} renders</span>
                      <span>{info.avgTime.toFixed(1)}ms avg</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground mb-2">
              Performance metrics
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span className="font-mono">
                  {performance.memory
                    ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)}MB`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>DOM Nodes</span>
                <span className="font-mono">
                  {document.getElementsByTagName('*').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Event Listeners</span>
                <span className="font-mono">
                  {Array.from(document.querySelectorAll('*')).reduce(
                    (count, el) => {
                      const listeners = (
                        el as Element & {
                          getEventListeners?: () => Record<string, unknown[]>
                        }
                      ).getEventListeners?.()
                      return (
                        count + (listeners ? Object.keys(listeners).length : 0)
                      )
                    },
                    0
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'state' && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground mb-2">
              Application state
            </div>
            <p className="text-sm text-muted-foreground">
              Connect your state management to see live state
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
