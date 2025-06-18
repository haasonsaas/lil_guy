import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { List, Clock, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { getAllPosts, formatDate, calculateReadingTime } from '@/utils/blogUtils';
import { getAllSeries, getSeriesReadingTime } from '@/utils/blog/seriesUtils';
import type { Series } from '@/types/blog';

export default function SeriesListPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadSeries = async () => {
      try {
        const allPosts = await getAllPosts();
        const allSeries = getAllSeries(allPosts);
        setSeries(allSeries);
      } catch (error) {
        console.error('Error loading series:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSeries();
  }, []);

  useEffect(() => {
    document.title = 'Series | Haas on SaaS';
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (series.length === 0) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">No Series Available</h1>
            <p className="text-muted-foreground mb-6">
              There are currently no blog post series available.
            </p>
            <Link to="/blog">
              <Button>Browse All Articles</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <List className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Series</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Multi-part deep dives into specific topics and projects
          </p>
        </div>

        {/* Series Grid */}
        <div className="space-y-8">
          {series.map((seriesItem) => {
            const seriesTime = getSeriesReadingTime(seriesItem, calculateReadingTime);
            const firstPost = seriesItem.posts[0];
            const lastPost = seriesItem.posts[seriesItem.posts.length - 1];
            const seriesSlug = seriesItem.name.toLowerCase().replace(/\s+/g, '-');

            return (
              <Card key={seriesItem.name} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Series Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <List className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary uppercase tracking-wide">Series</span>
                      <Badge variant="secondary" className="text-xs">
                        {seriesItem.totalParts} parts
                      </Badge>
                    </div>
                    
                    <Link 
                      to={`/series/${encodeURIComponent(seriesSlug)}`}
                      className="block group"
                    >
                      <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {seriesItem.name}
                      </h2>
                    </Link>
                    
                    {seriesItem.description && (
                      <p className="text-muted-foreground">{seriesItem.description}</p>
                    )}
                  </div>

                  {/* Series Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      <span>{seriesItem.totalParts} parts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{seriesTime.minutes} min total</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDate(firstPost.frontmatter.pubDate)} - {formatDate(lastPost.frontmatter.pubDate)}
                      </span>
                    </div>
                  </div>

                  {/* Recent Posts Preview */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Parts in this series:</h3>
                    <div className="grid gap-2">
                      {seriesItem.posts.slice(0, 3).map((post) => {
                        const readingTime = calculateReadingTime(post.content);
                        
                        return (
                          <div key={post.slug} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                            <div>
                              <Link 
                                to={`/blog/${post.slug}`}
                                className="text-sm font-medium hover:text-primary transition-colors"
                              >
                                Part {post.frontmatter.series?.part}: {post.frontmatter.title}
                              </Link>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(post.frontmatter.pubDate)}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {readingTime.minutes} min
                            </div>
                          </div>
                        );
                      })}
                      
                      {seriesItem.posts.length > 3 && (
                        <div className="text-center py-2">
                          <Link to={`/series/${encodeURIComponent(seriesSlug)}`}>
                            <Button variant="ghost" size="sm" className="text-xs">
                              +{seriesItem.posts.length - 3} more parts
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <Link to={`/blog/${firstPost.slug}`}>
                      <Button size="sm" className="group">
                        Start Reading
                        <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </Link>
                    <Link to={`/series/${encodeURIComponent(seriesSlug)}`}>
                      <Button variant="outline" size="sm">
                        View All Parts
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Back to Blog */}
        <div className="mt-12 text-center">
          <Link to="/blog">
            <Button variant="outline">
              Browse All Articles
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}