import { useTableOfContents, type TocItem } from '@/hooks/useTableOfContents';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLElement>;
  className?: string;
}

export default function TableOfContents({ contentRef, className }: TableOfContentsProps) {
  const { tocItems, activeId, scrollToHeading } = useTableOfContents(contentRef);

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <nav className={cn('space-y-1', className)} aria-label="Table of contents">
      <h4 className="font-semibold text-sm text-foreground mb-3">Table of Contents</h4>
      <ul className="space-y-1">
        {tocItems.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => scrollToHeading(item.id)}
              aria-label={`Jump to section: ${item.text}`}
              className={cn(
                'block w-full text-left text-sm transition-all duration-200',
                'border-l-2 border-transparent pl-3 py-1',
                'hover:text-foreground hover:border-primary/50 hover:bg-primary/5',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-r',
                {
                  'text-primary border-primary bg-primary/10 font-medium': activeId === item.id,
                  'text-muted-foreground': activeId !== item.id,
                  'pl-3': item.level === 1,
                  'pl-5': item.level === 2,
                  'pl-7': item.level === 3,
                  'pl-9': item.level >= 4,
                }
              )}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}