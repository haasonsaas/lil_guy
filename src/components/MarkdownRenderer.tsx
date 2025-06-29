import { useEffect, useRef, useMemo } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypeStringify from 'rehype-stringify'
import DOMPurify from 'dompurify'
import 'katex/dist/katex.min.css'
import 'prism-themes/themes/prism-material-oceanic.css'
import { useCodeBlockEnhancement } from '@/hooks/useCodeBlockEnhancement'
import { useLazyImageEnhancement } from '@/hooks/useLazyImageEnhancement'

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeKatex)
  .use(rehypePrismPlus, { showLineNumbers: false, ignoreMissing: true })
  .use(rehypeStringify, { allowDangerousHtml: true })

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useCodeBlockEnhancement(contentRef)
  useLazyImageEnhancement(contentRef)

  const processedHTML = useMemo(() => {
    try {
      const contentWithoutFrontmatter = content
        .replace(/^---[\s\S]*?---/, '')
        .trim()
      const rawHtml = processor
        .processSync(contentWithoutFrontmatter)
        .toString()
      return DOMPurify.sanitize(rawHtml, {
        USE_PROFILES: { html: true },
        ADD_TAGS: ['math', 'semantics', 'annotation', 'annotation-xml'],
        ADD_ATTR: ['encoding'],
      })
    } catch (error) {
      console.error('Error processing markdown:', error)
      return '<p>Error rendering content.</p>'
    }
  }, [content])

  return (
    <div
      ref={contentRef}
      className={`prose prose-quoteless prose-neutral dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processedHTML }}
    />
  )
}
