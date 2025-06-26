import { ArrowRight } from 'lucide-react'

interface ArticleCardProps {
  title: string
  description: string
  date: string
  readTime: string
  tags: string[]
  imageUrl: string
  isFeatured?: boolean
  href: string
}

const ArticleCard = ({
  title,
  description,
  date,
  readTime,
  tags,
  imageUrl,
  isFeatured = false,
  href,
}: ArticleCardProps) => {
  return (
    <article
      className={`group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg ${
        isFeatured ? 'md:col-span-2' : ''
      }`}
    >
      <a href={href} className="block h-full">
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading={isFeatured ? 'eager' : 'lazy'}
            fetchPriority={isFeatured ? 'high' : 'low'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <time dateTime={date}>{date}</time>
            <span>•</span>
            <span>{readTime} read</span>
          </div>
          <h2 className="mb-2 font-display text-xl font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mb-4 text-muted-foreground line-clamp-2">
            {description}
          </p>
          <div className="flex items-center text-sm font-medium text-primary">
            Read more
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </a>
    </article>
  )
}

export default ArticleCard
