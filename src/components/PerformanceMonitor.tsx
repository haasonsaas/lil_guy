import React from 'react'
import { useRenderTracker } from '../hooks/useRenderTracker'

export function PerformanceMonitor({
  children,
  name,
}: {
  children: React.ReactNode
  name: string
}) {
  useRenderTracker(name)
  return <>{children}</>
}
