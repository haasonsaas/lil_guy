import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { BlogPost } from '@/types/blog'

interface SeriesNavigationProps {
  currentPost: BlogPost
  seriesPosts: BlogPost[]
}

export default function SeriesNavigation({
  currentPost,
  seriesPosts,
}: SeriesNavigationProps) {
  const currentIndex = seriesPosts.findIndex((p) => p.slug === currentPost.slug)
  const prevPost = currentIndex > 0 ? seriesPosts[currentIndex - 1] : null
  const nextPost =
    currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null

  if (seriesPosts.length <= 1) {
    return null
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{currentPost.frontmatter.series?.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {seriesPosts.map((post, index) => (
            <li
              key={post.slug}
              className={`flex items-center justify-between p-2 rounded-md ${post.slug === currentPost.slug ? 'bg-muted' : ''}`}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="font-medium hover:underline"
              >
                Part {index + 1}: {post.frontmatter.title}
              </Link>
              {post.slug === currentPost.slug && (
                <span className="text-sm text-muted-foreground">
                  (You are here)
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="flex justify-between mt-4">
          {prevPost ? (
            <Link to={`/blog/${prevPost.slug}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            </Link>
          ) : (
            <div />
          )}
          {nextPost ? (
            <Link to={`/blog/${nextPost.slug}`}>
              <Button variant="outline">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
