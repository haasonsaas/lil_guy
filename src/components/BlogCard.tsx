
import { Link } from 'react-router-dom';
import { BlogPost } from '@/types/blog';
import { formatDate } from '@/utils/blogUtils';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { generateThumbnailUrl, getImageData } from '@/utils/blog/imageUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

const optimizeImage = (url: string, width: number = 800) => {
  if (!url) {
    console.warn('Image URL is empty or undefined');
    return generateThumbnailUrl('Fallback Image');
  }

  // Add a timestamp to force refresh
  const timestamp = new Date().getTime();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${timestamp}`;
};

// Function to truncate text with ellipsis
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const { slug, frontmatter } = post;
  const [imageError, setImageError] = useState(false);
  
  // Get image data directly from frontmatter with fallback to dynamic generation
  const imageData = getImageData(frontmatter);
  const imageUrl = imageError ? generateThumbnailUrl(frontmatter.title) : imageData.url;
  const imageAlt = imageData.alt;
  
  // Truncate title and description for card display
  const truncatedTitle = featured ? 
    truncateText(frontmatter.title, 80) : 
    truncateText(frontmatter.title, 60);
  
  const truncatedDescription = featured ? 
    truncateText(frontmatter.description, 140) : 
    truncateText(frontmatter.description, 100);
  
  if (featured) {
    return (
      <div className="group relative mb-10 animate-fade-up">
        <Link to={`/blog/${slug}`} className="block">
          <div className="relative h-[400px] overflow-hidden rounded-xl">
            <img 
              src={optimizeImage(imageUrl, 1200)} 
              alt={imageAlt}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => {
                console.error('Featured image failed to load:', imageUrl);
                setImageError(true);
              }}
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
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{truncatedTitle}</h2>
              <p className="text-white/80 mb-4">{truncatedDescription}</p>
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
              src={optimizeImage(imageUrl, 800)} 
              alt={imageAlt}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => {
                console.error('Image failed to load:', imageUrl);
                setImageError(true);
              }}
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
            <h3 className="text-lg font-bold mb-2 h-14 overflow-hidden">{truncatedTitle}</h3>
            <p className="text-muted-foreground text-sm mb-4 h-10 overflow-hidden">{truncatedDescription}</p>
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
