import { Link } from 'react-router-dom'
import { BlogPost } from '@/types/blog'
import { formatDate, calculateReadingTime } from '@/utils/blogUtils'
import { Badge } from '@/components/ui/badge'
import { Tag, Clock, User, ArrowRight } from 'lucide-react'
import { generateThumbnailUrl, getImageData } from '@/utils/blog/imageUtils'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useBlogCardPreloading } from '@/hooks/useIntelligentPreloading'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
  hideAuthor?: boolean
}

const optimizeImage = (url: string, width: number = 800) => {
  if (!url) {
    console.warn('Image URL is empty or undefined')
    return generateThumbnailUrl('Fallback Image')
  }
  const timestamp = new Date().getTime()
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}_t=${timestamp}`
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

export default function BlogCard({
  post,
  featured = false,
  hideAuthor = false,
}: BlogCardProps) {
  const { slug, frontmatter, content } = post
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { onMouseEnter, onTouchStart } = useBlogCardPreloading()

  const imageData = getImageData(frontmatter)
  const imageUrl = imageError
    ? generateThumbnailUrl(frontmatter.title)
    : imageData.url
  const imageAlt = imageData.alt

  const truncatedTitle = featured
    ? truncateText(frontmatter.title, 80)
    : truncateText(frontmatter.title, 60)

  const truncatedDescription = featured
    ? truncateText(frontmatter.description, 140)
    : truncateText(frontmatter.description, 100)

  // Use pre-calculated reading time if available, otherwise calculate from content
  const readTime = frontmatter.readingTime || calculateReadingTime(content)
  const wordCount =
    frontmatter.readingTime?.wordCount || content.trim().split(/\s+/).length

  if (featured) {
    return (
      <div
        className="group relative mb-10 animate-fade-up"
        onMouseEnter={() => {
          setIsHovered(true)
          onMouseEnter(slug)
        }}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => onTouchStart(slug)}
      >
        <Link to={`/blog/${slug}`} className="block">
          <div className="relative h-[400px] overflow-hidden rounded-lg shadow-md">
            {isLoading && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            <img
              src={optimizeImage(imageUrl, 1200)}
              alt={imageAlt}
              className={cn(
                'h-full w-full object-cover transition-all duration-500',
                isHovered
                  ? 'scale-105 brightness-110'
                  : 'scale-100 brightness-100',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                console.error('Featured image failed to load:', imageUrl)
                if (!imageError) {
                  setImageError(true)
                  setIsLoading(true)
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
            <div className="absolute bottom-0 p-8 text-left">
              <div className="flex flex-wrap gap-2 mb-4">
                {frontmatter.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="default"
                    className="flex items-center gap-1.5 bg-secondary text-secondary-foreground border-secondary px-3 py-1 hover:bg-secondary/80 transition-colors"
                  >
                    <Tag size={12} />
                    {tag.replace(/-/g, ' ')}
                  </Badge>
                ))}
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-semibold text-white mb-3 leading-tight">
                {truncatedTitle}
              </h2>
              <p className="text-white/80 mb-6 text-base leading-relaxed">
                {truncatedDescription}
              </p>
              <div className="flex items-center gap-4 text-white/80 text-sm">
                {!hideAuthor && (
                  <div className="flex items-center gap-1.5">
                    <User size={14} />
                    <span>{frontmatter.author}</span>
                  </div>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{readTime.minutes} min read</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Based on {wordCount} words at 200 words per minute</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>{formatDate(frontmatter.pubDate)}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  return (
    <div
      className="group relative mb-6 animate-fade-up"
      onMouseEnter={() => {
        setIsHovered(true)
        onMouseEnter(slug)
      }}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => onTouchStart(slug)}
    >
      <Link to={`/blog/${slug}`} className="block">
        <div
          className={cn(
            'relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-300',
            'hover:border-primary/20 hover:shadow-md',
            'group'
          )}
        >
          <div className="relative aspect-[16/9] overflow-hidden">
            {isLoading && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            <img
              src={optimizeImage(imageUrl, 800)}
              alt={imageAlt}
              className={cn(
                'h-full w-full object-cover transition-all duration-500',
                isHovered
                  ? 'scale-105 brightness-110'
                  : 'scale-100 brightness-100',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                console.error('Image failed to load:', imageUrl)
                if (!imageError) {
                  setImageError(true)
                  setIsLoading(true)
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex flex-wrap gap-2">
                {frontmatter.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="default"
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground border-secondary px-2 py-0.5 text-xs hover:bg-secondary/80 transition-colors"
                  >
                    <Tag size={10} />
                    {tag.replace(/-/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              {!hideAuthor && (
                <div className="flex items-center gap-1.5">
                  <User size={12} />
                  <span>{frontmatter.author}</span>
                </div>
              )}
              <span>•</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>{readTime.minutes} min read</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Based on {wordCount} words at 200 words per minute</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span>•</span>
              <span>{formatDate(frontmatter.pubDate)}</span>
            </div>

            <h3 className="text-lg font-display font-medium mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {truncatedTitle}
            </h3>

            <p
              className={cn(
                'text-muted-foreground text-sm mb-4 leading-relaxed transition-all duration-300',
                isHovered ? 'line-clamp-none' : 'line-clamp-2'
              )}
            >
              {truncatedDescription}
            </p>

            <div className="flex items-center gap-2 text-sm font-medium text-primary/80 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
              Read article
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
