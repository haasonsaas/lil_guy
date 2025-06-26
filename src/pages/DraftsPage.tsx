import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { PreviewLinkGenerator } from '@/components/PreviewLinkGenerator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Link, Eye, Calendar, FileText, Lock } from 'lucide-react'
import { getAllPosts, formatDate } from '@/utils/blogUtils'
import type { BlogPost } from '@/types/blog'

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const allPosts = await getAllPosts(true) // Include drafts
        const draftPosts = allPosts.filter((post) => post.frontmatter.draft)
        setDrafts(draftPosts)
      } catch (error) {
        console.error('Error loading drafts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDrafts()
  }, [])

  useEffect(() => {
    document.title = 'Draft Posts | Haas on SaaS'
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Draft Posts</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage and preview your unpublished blog posts
          </p>
        </div>

        {/* Drafts List */}
        {drafts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No draft posts found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <Card
                key={draft.slug}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">
                        {draft.frontmatter.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {draft.frontmatter.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Draft</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(draft.frontmatter.pubDate)}</span>
                      </div>
                      {draft.frontmatter.tags &&
                        draft.frontmatter.tags.length > 0 && (
                          <div className="flex gap-1">
                            {draft.frontmatter.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {draft.frontmatter.tags.length > 3 && (
                              <span className="text-xs">
                                +{draft.frontmatter.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPost(draft)}
                          >
                            <Link className="h-3 w-3 mr-1" />
                            Generate Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Generate Preview Link</DialogTitle>
                            <DialogDescription>
                              Create a secure preview link for this draft post
                            </DialogDescription>
                          </DialogHeader>
                          {selectedPost && (
                            <PreviewLinkGenerator
                              slug={selectedPost.slug}
                              title={selectedPost.frontmatter.title}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      <Link to={`/blog/${draft.slug}?preview=internal`}>
                        <Button size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View Draft
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Back to Blog */}
        <div className="mt-12 text-center">
          <Link to="/blog">
            <Button variant="outline">Back to Published Posts</Button>
          </Link>
        </div>
      </div>
    </Layout>
  )
}
