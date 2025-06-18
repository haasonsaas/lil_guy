import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, List, Clock, BookOpen } from 'lucide-react';
import { formatDate, calculateReadingTime } from '@/utils/blogUtils';
import { getSeriesProgress, getNextPostInSeries, getPreviousPostInSeries, getSeriesReadingTime } from '@/utils/blog/seriesUtils';
import type { BlogPost, Series } from '@/types/blog';

interface SeriesNavigationProps {
  currentPost: BlogPost;
  series: Series;
}

export default function SeriesNavigation({ currentPost, series }: SeriesNavigationProps) {
  const nextPost = getNextPostInSeries(series, currentPost);
  const previousPost = getPreviousPostInSeries(series, currentPost);
  const progress = getSeriesProgress(currentPost, series);
  const seriesTime = getSeriesReadingTime(series, calculateReadingTime);

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="space-y-4">
        {/* Series Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <List className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Series</span>
              <Badge variant="secondary" className="text-xs">
                {progress}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold mb-1">{series.name}</h3>
            {series.description && (
              <p className="text-sm text-muted-foreground">{series.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>{series.totalParts} parts</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{seriesTime.minutes} min total</span>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {previousPost ? (
              <Link to={`/blog/${previousPost.slug}`}>
                <Button variant="outline" size="sm" className="w-full justify-start group">
                  <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Previous</div>
                    <div className="text-sm font-medium truncate">
                      {previousPost.frontmatter.title}
                    </div>
                  </div>
                </Button>
              </Link>
            ) : (
              <div className="h-16"></div>
            )}
          </div>

          <Link to={`/series/${encodeURIComponent(series.name.toLowerCase().replace(/\s+/g, '-'))}`}>
            <Button variant="default" size="sm" className="shrink-0">
              <List className="h-4 w-4 mr-2" />
              View Series
            </Button>
          </Link>

          <div className="flex-1">
            {nextPost ? (
              <Link to={`/blog/${nextPost.slug}`}>
                <Button variant="outline" size="sm" className="w-full justify-end group">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Next</div>
                    <div className="text-sm font-medium truncate">
                      {nextPost.frontmatter.title}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            ) : (
              <div className="h-16"></div>
            )}
          </div>
        </div>

        {/* Series Posts Overview */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">All Parts in This Series</h4>
          <div className="grid gap-2">
            {series.posts.map((post) => {
              const isCurrentPost = post.slug === currentPost.slug;
              const readingTime = calculateReadingTime(post.content);
              
              return (
                <div
                  key={post.slug}
                  className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
                    isCurrentPost 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-background/50 border-border hover:bg-accent/50'
                  }`}
                >
                  <div className="flex-1">
                    {isCurrentPost ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="default" className="text-xs">
                            Part {post.frontmatter.series?.part}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Currently reading</span>
                        </div>
                        <div className="font-medium">{post.frontmatter.title}</div>
                      </div>
                    ) : (
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="block hover:text-primary transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Part {post.frontmatter.series?.part}
                          </Badge>
                        </div>
                        <div className="font-medium">{post.frontmatter.title}</div>
                      </Link>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground ml-4">
                    {readingTime.minutes} min
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}