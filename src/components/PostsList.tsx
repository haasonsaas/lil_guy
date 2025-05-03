import { useState, useEffect } from 'react';
import { getAllPosts, formatDate } from '@/utils/blogUtils';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Link } from 'react-router-dom';
import { FileText, Tag, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const calculateReadTime = (content: string): { minutes: number; wordCount: number } => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return {
    minutes: Math.ceil(words / wordsPerMinute),
    wordCount: words
  };
};

export default function PostsList() {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    const loadPosts = async () => {
      const loadedPosts = await getAllPosts();
      setPosts(loadedPosts);
    };
    loadPosts();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Posts</h2>
        <span className="text-sm text-muted-foreground">{posts.length} articles</span>
      </div>
      
      <div className="grid gap-6">
        {posts.map(post => (
          <Card 
            key={post.slug} 
            className={cn(
              "p-6 transition-all duration-300",
              "hover:border-primary/30 hover:shadow-md",
              "group"
            )}
          >
            <Link to={`/blog/${post.slug}`} className="block">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold truncate">{post.frontmatter.title}</h3>
                    <div className="flex gap-2">
                      {post.frontmatter.featured && (
                        <Badge variant="outline" className="bg-amber-100/50 text-amber-800 border-amber-200">
                          Featured
                        </Badge>
                      )}
                      {post.frontmatter.draft && (
                        <Badge variant="outline" className="bg-slate-100/50 text-slate-800 border-slate-200">
                          Draft
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.frontmatter.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User size={12} />
                      <span>{post.frontmatter.author}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{calculateReadTime(post.content).minutes} min read</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Based on {calculateReadTime(post.content).wordCount} words at 200 words per minute</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span>{formatDate(post.frontmatter.pubDate)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {post.frontmatter.tags.slice(0, 3).map(tag => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="text-xs flex items-center gap-1 bg-secondary/50 hover:bg-secondary/70 transition-colors"
                      >
                        <Tag size={10} />
                        {tag.replace(/-/g, ' ')}
                      </Badge>
                    ))}
                    {post.frontmatter.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-secondary/50">
                        +{post.frontmatter.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
