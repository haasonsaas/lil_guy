import { useEffect } from 'react'

export function useCodeBlockEnhancement(
  containerRef: React.RefObject<HTMLElement>
) {
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current // Capture ref value early
    const codeBlocks = container.querySelectorAll('pre code')

    codeBlocks.forEach((codeElement) => {
      const preElement = codeElement.parentElement as HTMLPreElement
      if (!preElement || preElement.querySelector('.code-copy-button')) return

      // Create wrapper div
      const wrapper = document.createElement('div')
      wrapper.className = 'relative group'

      // Move pre element into wrapper
      preElement.parentNode?.insertBefore(wrapper, preElement)
      wrapper.appendChild(preElement)

      // Add relative positioning to pre
      preElement.style.position = 'relative'

      // Get language from class name
      const languageClass = Array.from(codeElement.classList).find(
        (cls) => cls.startsWith('language-') || cls.startsWith('hljs ')
      )
      const language = languageClass?.replace(/^(language-|hljs ?)/, '') || ''

      // Create language label if language exists
      if (language && language !== 'hljs') {
        const languageLabel = document.createElement('div')
        languageLabel.className = 'absolute top-2 left-2 opacity-75 z-10'
        languageLabel.innerHTML = `
          <span class="text-xs font-mono text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded border border-border/50">
            ${language}
          </span>
        `
        wrapper.appendChild(languageLabel)
      }

      // Create copy button container
      const buttonContainer = document.createElement('div')
      buttonContainer.className =
        'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10'

      // Create copy button
      const copyButton = document.createElement('button')
      copyButton.className =
        'code-copy-button inline-flex items-center justify-center gap-1 h-8 px-2 text-xs font-medium border border-border/50 bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
      copyButton.innerHTML = `
        <svg class="copy-icon w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span class="copy-text">Copy</span>
        <svg class="check-icon w-3 h-3 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
      `

      // Add click handler
      copyButton.addEventListener('click', async () => {
        const code = codeElement.textContent || ''
        try {
          await navigator.clipboard.writeText(code)

          // Update button state
          const copyIcon = copyButton.querySelector('.copy-icon') as HTMLElement
          const checkIcon = copyButton.querySelector(
            '.check-icon'
          ) as HTMLElement
          const copyText = copyButton.querySelector('.copy-text') as HTMLElement

          copyIcon.classList.add('hidden')
          checkIcon.classList.remove('hidden')
          copyText.textContent = 'Copied'

          // Reset after 2 seconds
          setTimeout(() => {
            copyIcon.classList.remove('hidden')
            checkIcon.classList.add('hidden')
            copyText.textContent = 'Copy'
          }, 2000)
        } catch (err) {
          console.error('Failed to copy:', err)
        }
      })

      buttonContainer.appendChild(copyButton)
      wrapper.appendChild(buttonContainer)
    })

    // Cleanup function
    return () => {
      if (container) {
        const copyButtons = container.querySelectorAll('.code-copy-button')
        copyButtons.forEach((button) => button.remove())
      }
    }
  }, [containerRef])
}
