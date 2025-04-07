
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TagCloudProps {
  tags: string[];
  className?: string;
}

export default function TagCloud({ tags, className = '' }: TagCloudProps) {
  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {tags.map(tag => (
        <Link to={`/tags/${tag}`} key={tag}>
          <div className="rounded-full px-4 py-2 bg-primary/10 text-primary-foreground border border-primary/20 hover:bg-primary/20 transition-all hover:scale-105 hover:shadow-sm text-sm font-medium">
            {tag.replace(/-/g, ' ')}
          </div>
        </Link>
      ))}
    </div>
  );
}
