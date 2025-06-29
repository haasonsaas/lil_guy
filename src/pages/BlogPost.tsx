import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import TagCloud from '@/components/TagCloud'
import BlogCard from '@/components/BlogCard'
import { BlogCardSkeleton } from '@/components/BlogCardSkeleton'
import AuthorBio from '@/components/AuthorBio'
import SocialShare from '@/components/SocialShare'
import { ReadingProgressBar } from '@/components/ReadingProgressBar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Tag, Calendar, Clock, Eye } from 'lucide-react'
import SeriesNavigation from '@/components/SeriesNavigation'
import {
  getPostBySlug,
  formatDate,
  calculateReadingTime,
  getRelatedPosts,
  getAllTags,
  getAllPosts,
} from '@/utils/blogUtils'
import { loadBlogPost, preloadBlogPost } from '@/utils/blog/dynamicLoader'
import {
  generateDynamicImageUrl,
  generateOgImageUrl,
  getImageData,
} from '@/utils/blog/imageUtils'
import { validatePreviewToken, getTokenExpiration } from '@/utils/previewUtils'
import {
  generateBlogPostStructuredData,
  generateBreadcrumbStructuredData,
  calculateReadingTime as seoCalculateReadingTime,
} from '@/utils/seo/structuredData'
import StructuredData from '@/components/SEO/StructuredData'
import { BlogPostMeta } from '@/components/SEO/MetaTags'
import { AdvancedSEO } from '@/components/SEO/AdvancedSEO'
import { AgentStructuredData } from '@/components/SEO/AgentStructuredData'
import {
  useAnalytics,
  useReadingProgress,
  useExternalLinkTracking,
} from '@/hooks/useAnalytics'
import { useAutoCacheBlogPost } from '@/hooks/useServiceWorker'
import type { BlogPost } from '@/types/blog'
import WeeklyPlaybook from '@/components/WeeklyPlaybook'
import { Subscribe } from '@/components/Subscribe'
import TableOfContents from '@/components/TableOfContents'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [seriesPosts, setSeriesPosts] = useState<BlogPost[]>([])
  const [relatedPostsLoading, setRelatedPostsLoading] = useState(false)

  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([])
  const [isPreview, setIsPreview] = useState(false)
  const [previewExpiration, setPreviewExpiration] = useState<Date | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Analytics hooks
  const { trackPostView, trackTagClick } = useAnalytics()
  useReadingProgress(slug || '')
  useExternalLinkTracking()

  // Auto-cache this blog post for offline reading
  useAutoCacheBlogPost(slug)

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) return

      // Check for preview token
      const previewToken = searchParams.get('preview')
      let includesDrafts = false

      if (previewToken) {
        const isValid = await validatePreviewToken(previewToken, slug)
        if (isValid) {
          includesDrafts = true
          setIsPreview(true)
          const expiration = getTokenExpiration(previewToken)
          setPreviewExpiration(expiration)
        }
      }

      const loadedPost = await getPostBySlug(slug, includesDrafts)

      if (!loadedPost) {
        navigate('/blog')
        return
      }

      setPost(loadedPost)

      // Now fetch other data
      const allPosts = await getAllPosts()

      // Load related posts separately
      if (loadedPost.frontmatter.tags) {
        setRelatedPostsLoading(true)
        try {
          const related = await getRelatedPosts(loadedPost)
          setRelatedPosts(related)
        } catch (error) {
          console.error('Error loading related posts:', error)
        } finally {
          setRelatedPostsLoading(false)
        }
      }

      // Load all tags
      const tags = await getAllTags()
      setAllTags(tags)

      // Load series posts
      if (loadedPost.frontmatter.series) {
        const series = allPosts.filter(
          (p) =>
            p.frontmatter.series?.name === loadedPost.frontmatter.series?.name
        )
        series.sort(
          (a, b) =>
            (a.frontmatter.series?.part || 0) -
            (b.frontmatter.series?.part || 0)
        )
        setSeriesPosts(series)
      }
    }

    loadPost()
  }, [slug, navigate, searchParams])

  useEffect(() => {
    if (!post || !slug) return

    // Track post view for analytics
    trackPostView(slug, post.frontmatter.title, post.frontmatter.tags || [])

    // Scroll to top when post loads
    window.scrollTo(0, 0)

    // BlogPostMeta component handles all meta tags via Helmet
    // Manual DOM manipulation removed to avoid conflicts
  }, [post, slug, trackPostView])

  if (!post) {
    return null
  }

  const { frontmatter, content } = post

  // Get image data with proper fallbacks
  const imageData = getImageData(frontmatter)

  // Generate structured data
  const readingTime = seoCalculateReadingTime(content)
  const blogPostStructuredData = generateBlogPostStructuredData(
    frontmatter,
    slug!,
    content,
    readingTime
  )
  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: 'https://haasonsaas.com' },
    { name: 'Blog', url: 'https://haasonsaas.com/blog' },
    { name: frontmatter.title, url: `https://haasonsaas.com/blog/${slug}` },
  ])

  return (
    <Layout>
      <BlogPostMeta
        frontmatter={frontmatter}
        slug={slug!}
        content={content}
        readingTime={readingTime}
      />
      <AdvancedSEO
        frontmatter={frontmatter}
        slug={slug!}
        content={content}
        readingTime={readingTime}
        enableFAQ={true}
        enableBreadcrumbs={true}
      />
      <AgentStructuredData
        frontmatter={frontmatter}
        slug={slug!}
        content={content}
        readingTime={readingTime}
      />
      <ReadingProgressBar />
      <article className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/blog">
            <Button
              variant="ghost"
              className="mb-6 flex items-center gap-2 group"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-1 transition-transform"
              />{' '}
              Back to Blog
            </Button>
          </Link>

          <div className="max-w-4xl mx-auto">
            {/* Preview Mode Banner */}
            {isPreview && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Eye className="h-5 w-5" />
                  <span className="font-medium">Preview Mode</span>
                  {previewExpiration && (
                    <span className="text-sm">
                      • Expires{' '}
                      {formatDate(
                        previewExpiration.toISOString().split('T')[0]
                      )}
                    </span>
                  )}
                </div>
                {frontmatter.draft && (
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    This is a draft post and is not publicly visible.
                  </p>
                )}
              </div>
            )}

            <div className="mb-8 animate-fade-in">
              {post.frontmatter.series && (
                <SeriesNavigation
                  currentPost={post}
                  seriesPosts={seriesPosts}
                />
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {frontmatter?.tags &&
                  Array.isArray(frontmatter.tags) &&
                  frontmatter.tags.map((tag) => (
                    <Link key={tag} to={`/tags/${tag}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs flex items-center gap-1.5 bg-primary text-primary-foreground border-primary/20 hover:bg-primary/90"
                      >
                        <Tag size={12} />
                        {tag.replace(/-/g, ' ')}
                      </Button>
                    </Link>
                  ))}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance font-serif">
                {frontmatter?.title || 'Untitled Post'}
              </h1>

              <div className="article-meta flex items-center gap-4 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{formatDate(frontmatter.pubDate)}</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>
                          {calculateReadingTime(content).minutes} min read
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Based on {calculateReadingTime(content).wordCount} words
                        at 200 words per minute
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="print-only">
                  • {calculateReadingTime(content).wordCount} words
                </span>
              </div>

              <div className="mb-6">
                <AuthorBio />
              </div>

              <div className="mb-8 flex items-center justify-between no-print">
                <div className="text-sm text-muted-foreground">
                  Found this helpful? Share it with others:
                </div>
                <SocialShare
                  title={frontmatter.title}
                  url={`https://www.haasonsaas.com/blog/${post.slug}`}
                  description={frontmatter.description}
                  slug={post.slug}
                />
              </div>
            </div>

            {/* Desktop layout with TOC sidebar */}
            <div className="relative animate-fade-up">
              <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                {/* Main content */}
                <div className="lg:col-span-9">
                  <div ref={contentRef}>
                    <MarkdownRenderer
                      content={content}
                      className="prose-headings:font-serif prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-base prose-p:leading-7 prose-a:text-primary hover:prose-a:text-primary/80 prose-pre:bg-slate-800 prose-pre:rounded-lg prose-pre:shadow-sm prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-img:rounded-md prose-img:shadow-sm"
                    />
                  </div>
                </div>

                {/* TOC sidebar - hidden on mobile, sticky on desktop */}
                <div className="hidden lg:block lg:col-span-3">
                  <div className="sticky top-8">
                    <TableOfContents
                      contentRef={contentRef}
                      className="bg-card border rounded-lg p-4 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 no-print">
              <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">
                    Get the Weekly Playbook
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                    One tactical post per week on scaling SaaS with AI — zero
                    fluff, all signal
                  </p>
                  <Subscribe source="blog_post" />
                  <p className="text-xs md:text-sm text-muted-foreground mt-4">
                    Join SaaS builders and founders building the future
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border mt-16 pt-8 no-print">
              {(relatedPostsLoading || relatedPosts.length > 0) && (
                <div>
                  <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedPostsLoading
                      ? // Show skeleton cards while loading related posts
                        Array.from({ length: 3 }).map((_, index) => (
                          <BlogCardSkeleton key={index} hideAuthor={true} />
                        ))
                      : // Show actual related posts
                        relatedPosts.map((relatedPost) => (
                          <BlogCard
                            key={relatedPost.slug}
                            post={relatedPost}
                            hideAuthor={true}
                          />
                        ))}
                  </div>
                </div>
              )}

              <div className="mt-8 text-center">
                <Link to="/blog">
                  <Button className="px-6">Read more articles</Button>
                </Link>
              </div>
            </div>

            {/* Print-only footer with article info */}
            <div className="print-only mt-8 pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-600">
                <p>
                  This article was published on{' '}
                  {formatDate(frontmatter.pubDate)} at haasonsaas.com
                </p>
                {frontmatter?.tags && frontmatter.tags.length > 0 && (
                  <p className="mt-2">Topics: {frontmatter.tags.join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </Layout>
  )
}
