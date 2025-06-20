import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/atom-one-dark.css';
import SoundCloudEmbed from './SoundCloudEmbed';
import UnitEconomicsCalculator from './UnitEconomicsCalculator';
import ABTestSimulator from './ABTestSimulator';
import TechnicalDebtSimulator from './TechnicalDebtSimulator';
import PricingPsychologySimulator from './PricingPsychologySimulator';
import SaaSMetricsDashboard from './SaaSMetricsDashboard';
import StartupRunwayCalculator from './StartupRunwayCalculator';
import ProductMarketFitScorer from './ProductMarketFitScorer';
import TAMSAMSOMCalculator from './TAMSAMSOMCalculator';
import GrowthStrategySimulator from './GrowthStrategySimulator';
import { useCodeBlockEnhancement } from '@/hooks/useCodeBlockEnhancement';
import { useLazyImageEnhancement } from '@/hooks/useLazyImageEnhancement';

// Configure unified processor for markdown with math support
const processor = unified()
  .use(remarkParse)
  .use(remarkMath, {
    singleDollarTextMath: true
  })
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeKatex, {
    throwOnError: false,
    displayMode: false,
    output: 'html',
    strict: 'ignore',
    trust: false,
    errorColor: 'transparent',
    macros: {}
  })
  .use(rehypeHighlight, {
    detect: true,
    ignoreMissing: true
  })
  .use(rehypeStringify, { allowDangerousHtml: true });

// Component registry
const components = {
  'soundcloud': SoundCloudEmbed,
  'unit-economics-calculator': UnitEconomicsCalculator,
  'ab-test-simulator': ABTestSimulator,
  'technical-debt-simulator': TechnicalDebtSimulator,
  'pricing-psychology-simulator': PricingPsychologySimulator,
  'saas-metrics-dashboard': SaaSMetricsDashboard,
  'startup-runway-calculator': StartupRunwayCalculator,
  'product-market-fit-scorer': ProductMarketFitScorer,
  'tam-sam-som-calculator': TAMSAMSOMCalculator,
  'growth-strategy-simulator': GrowthStrategySimulator
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ 
  content, 
  className = '' 
}: MarkdownRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Add code block enhancement (copy buttons, language labels)
  useCodeBlockEnhancement(contentRef);
  
  // Add lazy loading for images
  useLazyImageEnhancement(contentRef);
  
  // No longer need manual highlight.js application since rehype-highlight handles it
  
  // Safely parse markdown to HTML with math support
  const createMarkup = () => {
    try {
      if (!content) {
        return { __html: '<p>No content available</p>' };
      }
      
      // Make sure the content is a string
      const contentString = typeof content === 'string' ? content : String(content);
      
      // Only render the content, not the frontmatter
      const contentWithoutFrontmatter = contentString.replace(/^---[\s\S]*?---/, '').trim();
      
      
      // Replace custom component tags with placeholders
      let processedContent = contentWithoutFrontmatter;
      const componentMatches = (contentWithoutFrontmatter.match(/<([\w-]+)([^>]*)>/g) || []) as string[];
      
      componentMatches.forEach(match => {
        const componentName = match.match(/<([\w-]+)/)?.[1];
        if (componentName && components[componentName]) {
          const props = match.match(/\s+(\w+)="([^"]+)"/g)?.reduce((acc, prop) => {
            const [key, value] = prop.trim().split('=');
            acc[key] = value.replace(/"/g, '');
            return acc;
          }, {}) || {};
          
          const Component = components[componentName];
          const placeholder = `<div data-component="${componentName}" data-props='${JSON.stringify(props)}'></div>`;
          processedContent = processedContent.replace(match, placeholder);
        }
      });
      
      // Process markdown with math support
      let rawMarkup: string;
      try {
        const result = processor.processSync(processedContent);
        rawMarkup = String(result);
        
      } catch (mathError) {
        console.error('Math processing error:', mathError);
        // Fallback to basic processing without math
        const result = processor.processSync(processedContent);
        rawMarkup = String(result);
      }
      
      // Configure DOMPurify to properly handle KaTeX elements
      const hasMathInOutput = rawMarkup.includes('katex');
      let cleanHtml: string;
      
      if (hasMathInOutput) {
        // Allow all KaTeX-specific elements and attributes
        cleanHtml = DOMPurify.sanitize(rawMarkup, {
          ADD_TAGS: [
            'math', 'semantics', 'mrow', 'msup', 'msub', 'mfrac', 'munder', 'mover', 'munderover',
            'mtable', 'mtr', 'mtd', 'mi', 'mo', 'mn', 'mtext', 'mspace', 'mpadded', 'mphantom',
            'mfenced', 'menclose', 'mstyle', 'mlabeledtr', 'annotation', 'annotation-xml'
          ],
          ADD_ATTR: [
            'xmlns', 'class', 'style', 'data-*', 'mathvariant', 'mathsize', 'mathcolor',
            'mathbackground', 'displaystyle', 'scriptlevel', 'form', 'fence', 'separator',
            'lspace', 'rspace', 'stretchy', 'symmetric', 'maxsize', 'minsize', 'largeop',
            'movablelimits', 'accent', 'linebreak', 'lineleading', 'linebreakstyle',
            'linebreakmultchar', 'indentalign', 'indentshift', 'indenttarget', 'indentalignfirst',
            'indentshiftfirst', 'indentalignlast', 'indentshiftlast', 'depth', 'height', 'width',
            'lquote', 'rquote', 'linethickness', 'munalign', 'denomalign', 'bevelled', 'numalign',
            'align', 'rowalign', 'columnalign', 'columnwidth', 'equalrows', 'equalcolumns',
            'rowspacing', 'columnspacing', 'rowlines', 'columnlines', 'frame', 'framespacing',
            'groupalign', 'alignmentscope', 'side', 'rowspan', 'columnspan', 'edge', 'selection',
            'notation', 'href', 'target', 'rel', 'data-component', 'data-props'
          ]
        });
      } else {
        cleanHtml = DOMPurify.sanitize(rawMarkup, {
          ADD_ATTR: ['target', 'rel', 'data-component', 'data-props', 'class', 'style'],
          ADD_TAGS: ['iframe', 'div', 'span']
        });
      }
      
      
      return { __html: cleanHtml };
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return { __html: `<p>Error rendering content: ${error instanceof Error ? error.message : 'Unknown error'}</p>` };
    }
  };
  
  // Render custom components
  useEffect(() => {
    if (contentRef.current) {
      const componentElements = contentRef.current.querySelectorAll('[data-component]');
      componentElements.forEach(element => {
        const componentName = element.getAttribute('data-component');
        const props = JSON.parse(element.getAttribute('data-props') || '{}');
        
        if (componentName && components[componentName]) {
          const Component = components[componentName];
          const container = document.createElement('div');
          element.replaceWith(container);
          const root = createRoot(container);
          root.render(<Component {...props} />);
        }
      });
    }
  }, [content]);
  
  return (
    <div 
      ref={contentRef}
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={createMarkup()} 
    />
  );
}
