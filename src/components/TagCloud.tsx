
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tag } from 'lucide-react';

interface TagCloudProps {
  tags: string[];
  className?: string;
}

export default function TagCloud({ tags, className = '' }: TagCloudProps) {
  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {tags.map(tag => (
        <Link to={`/tags/${tag}`} key={tag}>
          <div className="rounded-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-md text-sm font-medium flex items-center gap-2">
            <Tag size={14} />
            {tag.replace(/-/g, ' ')}
          </div>
        </Link>
      ))}
    </div>
  );
}
