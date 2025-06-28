import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypeStringify from 'rehype-stringify'
import DOMPurify from 'dompurify'
import 'katex/dist/katex.min.css'
// Import Prism themes - using Material Oceanic as base
import 'prism-themes/themes/prism-material-oceanic.css'
import SoundCloudEmbed from './SoundCloudEmbed'
import {
  LazyUnitEconomicsCalculator,
  LazyABTestSimulator,
  LazyTechnicalDebtSimulator,
  LazyPricingPsychologySimulator,
  LazySaaSMetricsDashboard,
  LazyStartupRunwayCalculator,
  LazyProductMarketFitScorer,
  LazyTAMSAMSOMCalculator,
  LazyGrowthStrategySimulator,
  LazyHiringCostCalculator,
  LazyFeaturePrioritizationMatrix,
  LazyTechnicalArchitectureVisualizer,
  LazyCustomerDevelopmentSimulator,
  LazyEngineeringVelocityTracker,
  LazyRetentionCohortAnalyzer,
  LazyPerformanceBudgetCalculator,
  LazyBuildTimeAnalyzer,
} from './LazyInteractiveComponents'
import { useCodeBlockEnhancement } from '@/hooks/useCodeBlockEnhancement'
import { useLazyImageEnhancement } from '@/hooks/useLazyImageEnhancement'
import { useCodeBlockLazyLoading } from '@/hooks/useCodeBlockLazyLoading'
import { useMarkdownWorker } from '@/hooks/useMarkdownWorker'

// Create unified processor for markdown with math support
const createProcessor = () =>
  unified()
    .use(remarkParse)
    .use(remarkMath, {
      singleDollarTextMath: true,
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex, {
      throwOnError: false,
      displayMode: false,
      output: 'html',
      strict: 'ignore',
      trust: false,
      errorColor: 'transparent',
      macros: {},
    })
    .use(rehypePrismPlus, {
      ignoreMissing: true,
      showLineNumbers: false,
    })
    .use(rehypeStringify, { allowDangerousHtml: true })

// Component registry
const components = {
  soundcloud: SoundCloudEmbed,
  'unit-economics-calculator': LazyUnitEconomicsCalculator,
  'ab-test-simulator': LazyABTestSimulator,
  'technical-debt-simulator': LazyTechnicalDebtSimulator,
  'pricing-psychology-simulator': LazyPricingPsychologySimulator,
  'saas-metrics-dashboard': LazySaaSMetricsDashboard,
  'startup-runway-calculator': LazyStartupRunwayCalculator,
  'product-market-fit-scorer': LazyProductMarketFitScorer,
  'tam-sam-som-calculator': LazyTAMSAMSOMCalculator,
  'growth-strategy-simulator': LazyGrowthStrategySimulator,
  'hiring-cost-calculator': LazyHiringCostCalculator,
  'feature-prioritization-matrix': LazyFeaturePrioritizationMatrix,
  'technical-architecture-visualizer': LazyTechnicalArchitectureVisualizer,
  'customer-development-simulator': LazyCustomerDevelopmentSimulator,
  'engineering-velocity-tracker': LazyEngineeringVelocityTracker,
  'retention-cohort-analyzer': LazyRetentionCohortAnalyzer,
  'performance-budget-calculator': LazyPerformanceBudgetCalculator,
  'build-time-analyzer': LazyBuildTimeAnalyzer,
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [processedHTML, setProcessedHTML] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [useWorker, setUseWorker] = useState(false) // Disabled - worker has basic parser that breaks code blocks

  const {
    processMarkdown,
    isReady: workerReady,
    isSupported: workerSupported,
  } = useMarkdownWorker()

  // Memoize the processor for fallback
  const processor = useMemo(() => createProcessor(), [])

  // Add code block enhancement (copy buttons, language labels)
  useCodeBlockEnhancement(contentRef)

  // Add lazy loading for images
  useLazyImageEnhancement(contentRef)

  // Add lazy loading for code blocks
  useCodeBlockLazyLoading(contentRef, {
    rootMargin: '200px',
    threshold: 0.01,
  })

  // Fallback markdown processing function (runs on main thread)
  const processMarkdownMainThread = useCallback(
    (contentString: string): string => {
      try {
        // Only render the content, not the frontmatter
        const contentWithoutFrontmatter = contentString
          .replace(/^---[\s\S]*?---/, '')
          .trim()

        // Replace custom component tags with placeholders
        let processedContent = contentWithoutFrontmatter
        const componentMatches = (contentWithoutFrontmatter.match(
          /<([\w-]+)([^>]*)>/g
        ) || []) as string[]

        componentMatches.forEach((match) => {
          const componentName = match.match(/<([\w-]+)/)?.[1]
          if (componentName && components[componentName]) {
            const props =
              match.match(/\s+(\w+)="([^"]+)"/g)?.reduce((acc, prop) => {
                const [key, value] = prop.trim().split('=')
                acc[key] = value.replace(/"/g, '')
                return acc
              }, {}) || {}

            const placeholder = `<div data-component="${componentName}" data-props='${JSON.stringify(props)}'></div>`
            processedContent = processedContent.replace(match, placeholder)
          }
        })

        // Process markdown with math support
        let rawMarkup: string
        try {
          const result = processor.processSync(processedContent)
          rawMarkup = String(result)
        } catch (mathError) {
          console.error('Math processing error:', mathError)
          // Fallback to basic processing without math
          const result = processor.processSync(processedContent)
          rawMarkup = String(result)
        }

        // Configure DOMPurify to properly handle KaTeX elements
        const hasMathInOutput = rawMarkup.includes('katex')
        let cleanHtml: string

        if (hasMathInOutput) {
          // Allow all KaTeX-specific elements and attributes
          cleanHtml = DOMPurify.sanitize(rawMarkup, {
            ADD_TAGS: [
              'math',
              'semantics',
              'mrow',
              'msup',
              'msub',
              'mfrac',
              'munder',
              'mover',
              'munderover',
              'mtable',
              'mtr',
              'mtd',
              'mi',
              'mo',
              'mn',
              'mtext',
              'mspace',
              'mpadded',
              'mphantom',
              'mfenced',
              'menclose',
              'mstyle',
              'mlabeledtr',
              'annotation',
              'annotation-xml',
            ],
            ADD_ATTR: [
              'xmlns',
              'class',
              'style',
              'data-*',
              'mathvariant',
              'mathsize',
              'mathcolor',
              'mathbackground',
              'displaystyle',
              'scriptlevel',
              'form',
              'fence',
              'separator',
              'lspace',
              'rspace',
              'stretchy',
              'symmetric',
              'maxsize',
              'minsize',
              'largeop',
              'movablelimits',
              'accent',
              'linebreak',
              'lineleading',
              'linebreakstyle',
              'linebreakmultchar',
              'indentalign',
              'indentshift',
              'indenttarget',
              'indentalignfirst',
              'indentshiftfirst',
              'indentalignlast',
              'indentshiftlast',
              'depth',
              'height',
              'width',
              'lquote',
              'rquote',
              'linethickness',
              'munalign',
              'denomalign',
              'bevelled',
              'numalign',
              'align',
              'rowalign',
              'columnalign',
              'columnwidth',
              'equalrows',
              'equalcolumns',
              'rowspacing',
              'columnspacing',
              'rowlines',
              'columnlines',
              'frame',
              'framespacing',
              'groupalign',
              'alignmentscope',
              'side',
              'rowspan',
              'columnspan',
              'edge',
              'selection',
              'notation',
              'href',
              'target',
              'rel',
              'data-component',
              'data-props',
            ],
          })
        } else {
          cleanHtml = DOMPurify.sanitize(rawMarkup, {
            ADD_ATTR: [
              'target',
              'rel',
              'data-component',
              'data-props',
              'class',
              'style',
            ],
            ADD_TAGS: ['iframe', 'div', 'span'],
          })
        }

        return cleanHtml
      } catch (error) {
        console.error('Error parsing markdown:', error)
        return `<p>Error rendering content: ${error instanceof Error ? error.message : 'Unknown error'}</p>`
      }
    },
    [processor]
  )

  // Process markdown content
  useEffect(() => {
    if (!content) {
      setProcessedHTML('<p>No content available</p>')
      return
    }

    const contentString =
      typeof content === 'string' ? content : String(content)

    // Always use main thread processor for now (worker has issues with code blocks)
    const result = processMarkdownMainThread(contentString)
    setProcessedHTML(result)
    return

    // Worker code disabled due to code block parsing issues
    /*
    if (useWorker && workerSupported && workerReady) {
      setIsProcessing(true);
      
      processMarkdown({
        content: contentString,
        onSuccess: (result) => {
          // Apply DOMPurify to worker result
          const cleanHtml = DOMPurify.sanitize(result, {
            ADD_ATTR: ['target', 'rel', 'data-component', 'data-props', 'class', 'style'],
            ADD_TAGS: ['iframe', 'div', 'span']
          });
          setProcessedHTML(cleanHtml);
          setIsProcessing(false);
        },
        onError: (error) => {
          console.warn('Worker processing failed, falling back to main thread:', error);
          const result = processMarkdownMainThread(contentString);
          setProcessedHTML(result);
          setIsProcessing(false);
          setUseWorker(false); // Disable worker for this session
        }
      });
    } else {
      // Fallback to main thread processing
      const result = processMarkdownMainThread(contentString);
      setProcessedHTML(result);
    }
    */
  }, [
    content,
    processMarkdown,
    workerReady,
    workerSupported,
    useWorker,
    processor,
    processMarkdownMainThread,
  ])

  // Render custom components
  useEffect(() => {
    if (contentRef.current && processedHTML) {
      const componentElements =
        contentRef.current.querySelectorAll('[data-component]')
      componentElements.forEach((element) => {
        const componentName = element.getAttribute('data-component')
        const props = JSON.parse(element.getAttribute('data-props') || '{}')

        if (componentName && components[componentName]) {
          const Component = components[componentName]
          const container = document.createElement('div')
          element.replaceWith(container)
          const root = createRoot(container)
          root.render(<Component {...props} />)
        }
      })
    }
  }, [processedHTML])

  // Show loading state for long content being processed
  if (isProcessing) {
    return (
      <div
        className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">
            Processing content...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={contentRef}
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processedHTML }}
    />
  )
}
