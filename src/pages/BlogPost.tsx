
import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import TagCloud from '@/components/TagCloud';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getPostBySlug, formatDate } from '@/utils/blogUtils';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = getPostBySlug(slug || '');
  
  useEffect(() => {
    // Scroll to top when post loads
    window.scrollTo(0, 0);
    
    // Redirect to blog page if post doesn't exist
    if (!post && slug) {
      navigate('/blog');
    }
  }, [post, slug, navigate]);
  
  if (!post) {
    return null;
  }
  
  const { frontmatter, content } = post;
  
  return (
    <Layout>
      <article className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/blog">
            <Button variant="ghost" className="mb-6 flex items-center gap-2 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Blog
            </Button>
          </Link>
          
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-wrap gap-2 mb-4">
              {frontmatter.tags.map(tag => (
                <Link key={tag} to={`/tags/${tag}`}>
                  <Button variant="outline" size="sm" className="text-xs bg-primary/10 border-primary/20 hover:bg-primary/20">
                    {tag.replace(/-/g, ' ')}
                  </Button>
                </Link>
              ))}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance font-serif">
              {frontmatter.title}
            </h1>
            
            <div className="text-muted-foreground mb-6">
              <span>{frontmatter.author}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(frontmatter.pubDate)}</span>
            </div>
            
            <p className="text-lg text-foreground/90 mb-8">
              {frontmatter.description}
            </p>
          </div>
          
          <div className="relative mb-10 h-[400px] md:h-[500px] rounded-xl overflow-hidden animate-fade-up shadow-md">
            <img 
              src={frontmatter.image.url} 
              alt={frontmatter.image.alt}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="animate-fade-up">
            <MarkdownRenderer content={content} />
          </div>
          
          <div className="border-t border-border mt-16 pt-8">
            <div className="bg-gradient-to-r from-primary/5 to-background p-6 rounded-lg border border-primary/10 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
              <TagCloud tags={frontmatter.tags} />
            </div>
            
            <div className="mt-8 text-center">
              <Link to="/blog">
                <Button className="px-6">
                  Read more articles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </Layout>
  );
}
