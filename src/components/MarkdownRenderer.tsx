
import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ 
  content, 
  className = '' 
}: MarkdownRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Configure marked with syntax highlighting
    marked.setOptions({
      highlight: function(code, lang) {
        try {
          if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
          return hljs.highlightAuto(code).value;
        } catch (e) {
          console.error('Highlight error:', e);
          return code;
        }
      },
      breaks: true,
      gfm: true,
      mangle: false,
      headerIds: true
    });
    
    // Apply syntax highlighting to any code blocks
    if (contentRef.current) {
      const codeBlocks = contentRef.current.querySelectorAll('pre code');
      codeBlocks.forEach(block => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [content]);
  
  // Safely parse markdown to HTML
  const createMarkup = () => {
    try {
      if (!content) {
        return { __html: '<p>No content available</p>' };
      }
      
      // Make sure the content is a string
      const contentString = typeof content === 'string' ? content : String(content);
      const rawMarkup = marked.parse(contentString);
      const cleanHtml = DOMPurify.sanitize(rawMarkup, {
        ADD_ATTR: ['target', 'rel'],
        ADD_TAGS: ['iframe']
      });
      return { __html: cleanHtml };
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return { __html: `<p>Error rendering content: ${error instanceof Error ? error.message : 'Unknown error'}</p>` };
    }
  };
  
  return (
    <div 
      ref={contentRef}
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={createMarkup()} 
    />
  );
}
