import { useEffect, useRef } from 'react'

interface LazyCodeBlockOptions {
  rootMargin?: string
  threshold?: number
}

export function useCodeBlockLazyLoading(
  containerRef: React.RefObject<HTMLElement>,
  options: LazyCodeBlockOptions = {}
) {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const { rootMargin = '100px', threshold = 0.1 } = options

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const preElement = entry.target as HTMLElement
            const codeElement = preElement.querySelector('code')

            if (!codeElement) return

            // Get the actual code content from data attribute
            const lazyContent = preElement.getAttribute('data-lazy-content')
            if (lazyContent) {
              // Restore the code content
              codeElement.innerHTML = lazyContent

              // Remove the loading state
              preElement.classList.remove('code-block-loading')
              preElement.removeAttribute('data-lazy-content')

              // Apply syntax highlighting if Prism is available
              if (
                window.Prism &&
                codeElement.classList.toString().includes('language-')
              ) {
                window.Prism.highlightElement(codeElement)
              }

              // Stop observing this element
              observerRef.current?.unobserve(preElement)
            }
          }
        })
      },
      {
        rootMargin,
        threshold,
      }
    )

    // Find all code blocks
    const codeBlocks = containerRef.current.querySelectorAll('pre code')

    codeBlocks.forEach((codeElement) => {
      const preElement = codeElement.parentElement as HTMLPreElement
      if (!preElement) return

      // Get the code content
      const codeContent = codeElement.innerHTML

      // Only lazy load large code blocks (more than 10 lines or 500 characters)
      const lineCount = (codeContent.match(/\n/g) || []).length + 1
      const charCount = codeContent.length

      if (lineCount > 10 || charCount > 500) {
        // Store the original content
        preElement.setAttribute('data-lazy-content', codeContent)

        // Add loading state class
        preElement.classList.add('code-block-loading')

        // Create placeholder content
        const language =
          Array.from(codeElement.classList)
            .find((cls) => cls.startsWith('language-'))
            ?.replace('language-', '') || 'code'

        codeElement.innerHTML = `
          <div class="code-placeholder">
            <div class="flex items-center justify-center py-8 text-muted-foreground">
              <svg class="w-5 h-5 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              <span class="text-sm">Loading ${language} code (${lineCount} lines)...</span>
            </div>
          </div>
        `

        // Start observing
        observerRef.current.observe(preElement)
      }
    })

    // Cleanup
    return () => {
      observerRef.current?.disconnect()
    }
  }, [containerRef, options])
}

// Add Prism to window type
declare global {
  interface Window {
    Prism: {
      highlightElement: (element: Element) => void
    }
  }
}
