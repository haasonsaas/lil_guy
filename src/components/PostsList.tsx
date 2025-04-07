import { useState } from 'react';
import { getAllPosts, formatDate } from '@/utils/blogUtils';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Link } from 'react-router-dom';
import { FileText, Tag } from 'lucide-react';

export default function PostsList() {
  const [posts] = useState(getAllPosts());
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">All Posts ({posts.length})</h2>
      
      <div className="grid gap-4">
        {posts.map(post => (
          <Card key={post.slug} className="p-4 hover:border-primary/30 transition-colors">
            <Link to={`/blog/${post.slug}`} className="block">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{post.frontmatter.title}</h3>
                    {post.frontmatter.featured && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                        Featured
                      </Badge>
                    )}
                    {post.frontmatter.draft && (
                      <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200">
                        Draft
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{post.frontmatter.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{post.frontmatter.author}</span>
                    <span>•</span>
                    <span>{formatDate(post.frontmatter.pubDate)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.frontmatter.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs flex items-center gap-1">
                        <Tag size={10} />
                        {tag.replace(/-/g, ' ')}
                      </Badge>
                    ))}
                    {post.frontmatter.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
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
