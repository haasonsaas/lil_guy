import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Tag, Archive as ArchiveIcon } from 'lucide-react'
import {
  getAllPosts,
  formatDate,
  calculateReadingTime,
} from '@/utils/blogUtils'
import type { BlogPost } from '@/types/blog'

interface PostsByYear {
  [year: string]: BlogPost[]
}

interface PostsByMonth {
  [monthYear: string]: BlogPost[]
}

export default function Archive() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [viewMode, setViewMode] = useState<'year' | 'month'>('year')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const allPosts = await getAllPosts()
        setPosts(allPosts)
      } catch (error) {
        console.error('Error loading posts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  useEffect(() => {
    document.title = 'Archive | Haas on SaaS'
  }, [])

  const groupPostsByYear = (posts: BlogPost[]): PostsByYear => {
    return posts.reduce((acc, post) => {
      const year = new Date(post.frontmatter.pubDate).getFullYear().toString()
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(post)
      return acc
    }, {} as PostsByYear)
  }

  const groupPostsByMonth = (posts: BlogPost[]): PostsByMonth => {
    return posts.reduce((acc, post) => {
      const date = new Date(post.frontmatter.pubDate)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[monthYear]) {
        acc[monthYear] = []
      }
      acc[monthYear].push(post)
      return acc
    }, {} as PostsByMonth)
  }

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const postsByYear = groupPostsByYear(posts)
  const postsByMonth = groupPostsByMonth(posts)
  const years = Object.keys(postsByYear).sort(
    (a, b) => parseInt(b) - parseInt(a)
  )
  const months = Object.keys(postsByMonth).sort((a, b) => b.localeCompare(a))

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ArchiveIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Archive</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            A chronological journey through {posts.length} articles and insights
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={viewMode === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('year')}
          >
            By Year
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            By Month
          </Button>
        </div>

        {/* Archive Content */}
        <div className="space-y-12">
          {viewMode === 'year'
            ? // Year View
              years.map((year) => (
                <div key={year} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">{year}</h2>
                    <Badge variant="secondary">
                      {postsByYear[year].length} articles
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {postsByYear[year].map((post) => (
                      <Card
                        key={post.slug}
                        className="p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <Link
                              to={`/blog/${post.slug}`}
                              className="block group"
                            >
                              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                                {post.frontmatter.title}
                              </h3>
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {post.frontmatter.description}
                              </p>
                            </Link>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>
                                  {formatDate(post.frontmatter.pubDate)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>
                                  {calculateReadingTime(post.content).minutes}{' '}
                                  min read
                                </span>
                              </div>
                            </div>

                            {post.frontmatter.tags &&
                              post.frontmatter.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {post.frontmatter.tags
                                    .slice(0, 3)
                                    .map((tag) => (
                                      <Link key={tag} to={`/tags/${tag}`}>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          <Tag size={10} className="mr-1" />
                                          {tag}
                                        </Badge>
                                      </Link>
                                    ))}
                                  {post.frontmatter.tags.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      +{post.frontmatter.tags.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            : // Month View
              months.map((monthYear) => (
                <div key={monthYear} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">
                      {formatMonthYear(monthYear)}
                    </h2>
                    <Badge variant="secondary">
                      {postsByMonth[monthYear].length} articles
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {postsByMonth[monthYear].map((post) => (
                      <Card
                        key={post.slug}
                        className="p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <Link
                              to={`/blog/${post.slug}`}
                              className="block group"
                            >
                              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                                {post.frontmatter.title}
                              </h3>
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {post.frontmatter.description}
                              </p>
                            </Link>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>
                                  {formatDate(post.frontmatter.pubDate)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>
                                  {calculateReadingTime(post.content).minutes}{' '}
                                  min read
                                </span>
                              </div>
                            </div>

                            {post.frontmatter.tags &&
                              post.frontmatter.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {post.frontmatter.tags
                                    .slice(0, 3)
                                    .map((tag) => (
                                      <Link key={tag} to={`/tags/${tag}`}>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          <Tag size={10} className="mr-1" />
                                          {tag}
                                        </Badge>
                                      </Link>
                                    ))}
                                  {post.frontmatter.tags.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      +{post.frontmatter.tags.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
        </div>

        {/* Back to Blog */}
        <div className="mt-12 text-center">
          <Link to="/blog">
            <Button variant="outline">Back to Blog</Button>
          </Link>
        </div>
      </div>
    </Layout>
  )
}
