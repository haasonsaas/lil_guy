
import { Link } from 'react-router-dom';
import { BlogPost } from '@/types/blog';
import { formatDate } from '@/utils/blogUtils';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { generateThumbnailUrl } from '@/utils/blog/imageUtils';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

const optimizeImage = (url: string, width: number = 800) => {
  if (!url) {
    console.warn('Image URL is empty or undefined');
    return generateThumbnailUrl('Fallback Image');
  }

  // Check if it's already a Cloudflare-optimized image
  if (url.includes('/cdn-cgi/image') || url.includes('cloudinary.com')) {
    return url;
  }

  // For Unsplash and Pexels images, use their optimization parameters
  if (url.includes('unsplash.com')) {
    return `${url}${url.includes('?') ? '&' : '?'}w=${width}&q=80&auto=format`;
  }
  if (url.includes('pexels.com')) {
    return url; // Pexels already provides optimized images
  }

  // For other images, don't use Cloudflare's Image Resizing as it might not be available
  return url;
};

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const { slug, frontmatter } = post;
  
  // Ensure image data exists or generate a dynamic one
  const imageUrl = frontmatter.image?.url || generateThumbnailUrl(frontmatter.title);
  const imageAlt = frontmatter.image?.alt || frontmatter.title || 'Blog post image';
  
  console.log('BlogCard rendering with image:', imageUrl);
  
  if (featured) {
    return (
      <div className="group relative mb-10 animate-fade-up">
        <Link to={`/blog/${slug}`} className="block">
          <div className="relative h-[400px] overflow-hidden rounded-xl">
            <img 
              src={optimizeImage(imageUrl, 1200)} 
              alt={imageAlt}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                e.currentTarget.src = generateThumbnailUrl(frontmatter.title);
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
              src={optimizeImage(imageUrl, 800)} 
              alt={imageAlt}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                e.currentTarget.src = generateThumbnailUrl(frontmatter.title);
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
