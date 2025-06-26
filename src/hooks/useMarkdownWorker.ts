import { useEffect, useRef, useCallback, useState } from 'react'

interface WorkerMessage {
  id: string
  type: string
  result?: string
  error?: string
}

interface ProcessMarkdownOptions {
  content: string
  onSuccess: (result: string) => void
  onError: (error: string) => void
}

export function useMarkdownWorker() {
  const workerRef = useRef<Worker | null>(null)
  const [isReady, setIsReady] = useState(false)
  const pendingRequests = useRef<Map<string, ProcessMarkdownOptions>>(new Map())

  // Initialize worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker('/markdown-worker.js')

        workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
          const { id, type, result, error } = event.data

          if (type === 'WORKER_READY') {
            setIsReady(true)
            console.log('📝 Markdown worker ready')
            return
          }

          if (type === 'MARKDOWN_PROCESSED' && id && result) {
            const request = pendingRequests.current.get(id)
            if (request) {
              request.onSuccess(result)
              pendingRequests.current.delete(id)
            }
          }

          if (type === 'MARKDOWN_ERROR' && id && error) {
            const request = pendingRequests.current.get(id)
            if (request) {
              request.onError(error)
              pendingRequests.current.delete(id)
            }
          }
        }

        workerRef.current.onerror = (error) => {
          console.error('Markdown worker error:', error)
          setIsReady(false)
        }
      } catch (error) {
        console.warn('Failed to create markdown worker:', error)
        setIsReady(false)
      }
    }

    const requests = pendingRequests.current
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      requests.clear()
    }
  }, [workerRef, pendingRequests])

  const processMarkdown = useCallback(
    (options: ProcessMarkdownOptions) => {
      if (!workerRef.current || !isReady) {
        // Fallback to immediate processing if worker not available
        console.warn('Worker not ready, processing on main thread')
        options.onError('Worker not available')
        return
      }

      const id = Math.random().toString(36).substr(2, 9)
      pendingRequests.current.set(id, options)

      workerRef.current.postMessage({
        id,
        type: 'PROCESS_MARKDOWN',
        content: options.content,
      })
    },
    [isReady]
  )

  return {
    processMarkdown,
    isReady,
    isSupported: typeof Worker !== 'undefined',
  }
}
