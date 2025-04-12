import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import SoundCloudEmbed from './SoundCloudEmbed';

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
      
      // Only render the content, not the frontmatter
      const contentWithoutFrontmatter = contentString.replace(/^---[\s\S]*?---/, '').trim();
      
      // Replace custom component tags with placeholders
      let processedContent = contentWithoutFrontmatter;
      const componentMatches = contentWithoutFrontmatter.match(/<(\w+)([^>]*)>/g) || [];
      
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
      
      const rawMarkup = marked.parse(processedContent);
      const cleanHtml = DOMPurify.sanitize(rawMarkup, {
        ADD_ATTR: ['target', 'rel', 'data-component', 'data-props'],
        ADD_TAGS: ['iframe', 'div']
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
          // @ts-expect-error ReactDOM.render is deprecated but still works for our use case
          ReactDOM.render(<Component {...props} />, container);
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
