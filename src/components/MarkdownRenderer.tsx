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
import { useCodeBlockEnhancement } from '@/hooks/useCodeBlockEnhancement';
import { useLazyImageEnhancement } from '@/hooks/useLazyImageEnhancement';

// Configure unified processor for markdown with math support
const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeKatex)
  .use(rehypeHighlight, {
    detect: true,
    ignoreMissing: true
  })
  .use(rehypeStringify, { allowDangerousHtml: true });

// Component registry
const components = {
  'soundcloud': SoundCloudEmbed
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
      
      // Debug: log if we have math content
      const hasMath = contentWithoutFrontmatter.includes('$$') || contentWithoutFrontmatter.includes('$');
      if (hasMath) {
        console.log('Math content detected in markdown');
      }
      
      // Replace custom component tags with placeholders
      let processedContent = contentWithoutFrontmatter;
      const componentMatches = (contentWithoutFrontmatter.match(/<(\w+)([^>]*)>/g) || []) as string[];
      
      componentMatches.forEach(match => {
        const componentName = match.match(/<(\w+)/)?.[1];
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
      const result = processor.processSync(processedContent);
      const rawMarkup = String(result);
      
      // Debug: log processed output
      if (hasMath) {
        console.log('Processed HTML contains KaTeX:', rawMarkup.includes('katex'));
        console.log('First 500 chars of processed HTML:', rawMarkup.substring(0, 500));
      }
      
      const cleanHtml = DOMPurify.sanitize(rawMarkup, {
        ADD_ATTR: [
          'target', 'rel', 'data-component', 'data-props', 'class', 'style', 'xmlns',
          // KaTeX specific attributes
          'aria-hidden', 'aria-label', 'role', 'data-lexer', 'data-katex'
        ],
        ADD_TAGS: [
          'iframe', 'div', 'span',
          // MathML tags
          'math', 'annotation', 'semantics', 'mtext', 'mn', 'mo', 'mrow', 'msup', 'msub', 
          'mfrac', 'mfenced', 'mtable', 'mtr', 'mtd', 'msqrt', 'mroot', 'mpadded', 'mphantom',
          'mspace', 'menclose', 'maligngroup', 'malignmark', 'mlongdiv', 'mscarries',
          'mscarry', 'msgroup', 'msline', 'msrow', 'mstack', 'munder', 'mover', 'munderover',
          'mlabeledtr', 'mmultiscripts', 'mprescripts'
        ]
      });
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
