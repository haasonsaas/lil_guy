import { useEffect, useRef } from 'react';
import { useTheme } from '@/components/use-theme';

interface CommentsProps {
  className?: string;
}

export default function Comments({ className = "" }: CommentsProps) {
  const commentsRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!commentsRef.current) return;

    // Clear any existing giscus
    const existingScript = commentsRef.current.querySelector('script[src*="giscus"]');
    if (existingScript) {
      commentsRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'haasonsaas/haas-blog');
    script.setAttribute('data-repo-id', 'R_kgDONJXXXX'); // You'll need to get this from GitHub
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDONJXXXX'); // You'll need to get this from GitHub
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;

    commentsRef.current.appendChild(script);
  }, [theme]);

  return (
    <div className={`mt-16 ${className}`}>
      <div className="border-t border-border pt-8">
        <h3 className="text-2xl font-bold mb-6 font-display">Comments</h3>
        <div ref={commentsRef} />
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            Comments are powered by{' '}
            <a 
              href="https://github.com/haasonsaas/haas-blog/discussions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub Discussions
            </a>
            . You'll need a GitHub account to participate.
          </p>
        </div>
      </div>
    </div>
  );
}