import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import BlogCard from '@/components/BlogCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ArrowLeft, List, Clock, BookOpen, Calendar } from 'lucide-react';
import { getAllPosts, formatDate, calculateReadingTime } from '@/utils/blogUtils';
import { getSeriesByName, getSeriesReadingTime } from '@/utils/blog/seriesUtils';
import type { BlogPost, Series } from '@/types/blog';

export default function SeriesPage() {
  const { seriesSlug } = useParams<{ seriesSlug: string }>();
  const navigate = useNavigate();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadSeries = async () => {
      if (!seriesSlug) {
        navigate('/blog');
        return;
      }
      
      try {
        const allPosts = await getAllPosts();
        // Convert slug back to series name (replace dashes with spaces)
        const seriesName = decodeURIComponent(seriesSlug).replace(/-/g, ' ');
        const foundSeries = getSeriesByName(allPosts, seriesName);
        
        if (!foundSeries) {
          navigate('/blog');
          return;
        }
        
        setSeries(foundSeries);
      } catch (error) {
        console.error('Error loading series:', error);
        navigate('/blog');
      } finally {
        setLoading(false);
      }
    };
    
    loadSeries();
  }, [seriesSlug, navigate]);

  useEffect(() => {
    if (series) {
      document.title = `${series.name} Series | Haas on SaaS`;
    }
  }, [series]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!series) {
    return null;
  }

  const seriesTime = getSeriesReadingTime(series, calculateReadingTime);
  const firstPost = series.posts[0];
  const lastPost = series.posts[series.posts.length - 1];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link to="/blog">
          <Button variant="ghost" className="mb-6 flex items-center gap-2 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Button>
        </Link>

        {/* Series Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <List className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-primary uppercase tracking-wide">Series</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{series.name}</h1>
          
          {series.description && (
            <p className="text-lg text-muted-foreground mb-6">{series.description}</p>
          )}

          {/* Series Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{series.totalParts} parts</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{seriesTime.minutes} min total read</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(firstPost.frontmatter.pubDate)} - {formatDate(lastPost.frontmatter.pubDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Reading Progress Card */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <h3 className="text-lg font-semibold mb-2">Start Reading</h3>
          <p className="text-muted-foreground mb-4">
            This series contains {series.totalParts} parts with an estimated reading time of {seriesTime.minutes} minutes.
          </p>
          <Link to={`/blog/${firstPost.slug}`}>
            <Button className="group">
              Start with Part 1
              <ArrowLeft className="ml-2 h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </Card>

        {/* Series Posts */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">All Parts</h2>
          
          <div className="space-y-4">
            {series.posts.map((post) => {
              const readingTime = calculateReadingTime(post.content);
              
              return (
                <Card key={post.slug} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Part {post.frontmatter.series?.part}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(post.frontmatter.pubDate)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {readingTime.minutes} min read
                        </span>
                      </div>
                      
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="block group"
                      >
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                          {post.frontmatter.title}
                        </h3>
                        <p className="text-muted-foreground line-clamp-2">
                          {post.frontmatter.description}
                        </p>
                      </Link>

                      {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {post.frontmatter.tags.slice(0, 3).map(tag => (
                            <Link key={tag} to={`/tags/${tag}`}>
                              <Badge variant="secondary" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
                                {tag}
                              </Badge>
                            </Link>
                          ))}
                          {post.frontmatter.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{post.frontmatter.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="lg:shrink-0">
                      <Link to={`/blog/${post.slug}`}>
                        <Button variant="outline" size="sm">
                          Read Part {post.frontmatter.series?.part}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
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