// Markdown Processing Web Worker
// Handles heavy markdown parsing off the main thread

// Simple markdown processor for web worker
// Uses a lightweight approach to avoid complex module loading in worker

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypePrismPlus from 'rehype-prism-plus'

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeKatex)
  .use(rehypePrismPlus, { ignoreMissing: true })
  .use(rehypeStringify, { allowDangerousHtml: true })

self.onmessage = async (event) => {
  const { markdown } = event.data
  try {
    const processed = await processor.process(markdown)
    const html = String(processed)
    event.ports[0].postMessage({ html })
  } catch (error) {
    console.error('Markdown processing error in worker:', error)
    event.ports[0].postMessage({ error: error.message })
  }
}

// Signal that worker is ready
self.postMessage({
  type: 'WORKER_READY',
})
