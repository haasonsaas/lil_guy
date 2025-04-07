
import { Link } from 'react-router-dom';
import { BlogPost } from '@/types/blog';
import { formatDate } from '@/utils/blogUtils';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const { slug, frontmatter } = post;
  
  if (featured) {
    return (
      <div className="group relative mb-10 animate-fade-up">
        <Link to={`/blog/${slug}`} className="block">
          <div className="relative h-[400px] overflow-hidden rounded-xl">
            <img 
              src={frontmatter.image.url} 
              alt={frontmatter.image.alt}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
            <div className="absolute bottom-0 p-6 text-left">
              <div className="flex flex-wrap gap-2 mb-3">
                {frontmatter.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="default" className="flex items-center gap-1.5 bg-primary border-primary/40 px-3 py-1.5">
                    <Tag size={12} />
                    {tag.replace(/-/g, ' ')}
                  </Badge>
                ))}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{frontmatter.title}</h2>
              <p className="text-white/80 mb-4 line-clamp-2">{frontmatter.description}</p>
              <div className="flex items-center text-white/60 text-sm">
                <span>{frontmatter.author}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(frontmatter.pubDate)}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="group animate-fade-up">
      <Link to={`/blog/${slug}`} className="block">
        <div className="overflow-hidden rounded-lg bg-card border border-border transition-all hover:border-primary/30 hover:shadow-md">
          <div className="relative h-48 w-full overflow-hidden">
            <img 
              src={frontmatter.image.url} 
              alt={frontmatter.image.alt}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="p-4 text-left">
            <div className="flex flex-wrap gap-2 mb-3">
              {frontmatter.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="default" className="flex items-center gap-1.5 bg-primary text-primary-foreground">
                  <Tag size={12} />
                  {tag.replace(/-/g, ' ')}
                </Badge>
              ))}
            </div>
            <h3 className="text-lg font-bold mb-2 line-clamp-2">{frontmatter.title}</h3>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{frontmatter.description}</p>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{frontmatter.author}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(frontmatter.pubDate)}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
