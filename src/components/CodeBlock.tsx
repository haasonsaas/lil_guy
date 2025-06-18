import { useState } from 'react';
import { Button } from './ui/button';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  'data-language'?: string;
}

export default function CodeBlock({ children, className, 'data-language': language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    const codeElement = document.querySelector(`pre.${className} code`);
    if (codeElement) {
      const code = codeElement.textContent || '';
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="relative group">
      <pre className={cn('relative', className)}>
        {children}
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90"
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      {language && (
        <div className="absolute top-2 left-2 opacity-75">
          <span className="text-xs font-mono text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded border border-border/50">
            {language}
          </span>
        </div>
      )}
    </div>
  );
}