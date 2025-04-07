
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface TagCloudProps {
  tags: string[];
  className?: string;
}

export default function TagCloud({ tags, className = '' }: TagCloudProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map(tag => (
        <Link to={`/tags/${tag}`} key={tag}>
          <Badge variant="outline" className="bg-secondary hover:bg-primary/20 transition-colors">
            {tag.replace(/-/g, ' ')}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
