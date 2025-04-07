
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
      gfm: true
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
    const rawMarkup = marked.parse(content);
    const cleanHtml = DOMPurify.sanitize(rawMarkup);
    return { __html: cleanHtml };
  };
  
  return (
    <div 
      ref={contentRef}
      className={`prose-custom ${className}`}
      dangerouslySetInnerHTML={createMarkup()} 
    />
  );
}
