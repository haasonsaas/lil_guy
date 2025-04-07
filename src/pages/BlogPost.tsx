import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import TagCloud from '@/components/TagCloud';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Tag, Calendar } from 'lucide-react';
import { getPostBySlug, formatDate } from '@/utils/blogUtils';
import { generateDynamicImageUrl, generateOgImageUrl, getImageData } from '@/utils/blog/imageUtils';

const optimizeImage = (url: string) => {
  if (!url) {
    return generateDynamicImageUrl('Fallback Image', 1200, 630);
  }

  // Add a timestamp to force refresh
  const timestamp = new Date().getTime();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${timestamp}`;
};

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
    
    // Update OpenGraph tags for social sharing
    if (post) {
      // Update OpenGraph tags dynamically
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDesc = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      
      if (ogTitle) ogTitle.setAttribute('content', post.frontmatter.title);
      if (ogDesc) ogDesc.setAttribute('content', post.frontmatter.description);
      
      // Use the post's image URL for OG tags if available, otherwise generate one
      const ogImageUrl = getImageData(post.frontmatter).url;
      
      if (ogImage) ogImage.setAttribute('content', ogImageUrl);
      if (twitterImage) twitterImage.setAttribute('content', ogImageUrl);
    }
  }, [post, slug, navigate]);
  
  if (!post) {
    return null;
  }
  
  const { frontmatter, content } = post;
  
  // Debug what we're getting
  console.log("Post data:", { 
    slug, 
    frontmatter, 
    tags: frontmatter.tags,
    image: frontmatter.image,
    contentPreview: content?.substring(0, 100) 
  });
  
  // Get image data with proper fallbacks
  const imageData = getImageData(frontmatter);
  const imageUrl = imageData.url;
  const imageAlt = imageData.alt;
  
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
              {frontmatter?.tags && Array.isArray(frontmatter.tags) && frontmatter.tags.map(tag => (
                <Link key={tag} to={`/tags/${tag}`}>
                  <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 bg-primary text-primary-foreground border-primary/20 hover:bg-primary/90">
                    <Tag size={12} />
                    {tag.replace(/-/g, ' ')}
                  </Button>
                </Link>
              ))}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance font-serif">
              {frontmatter?.title || 'Untitled Post'}
            </h1>
            
            <div className="text-muted-foreground mb-6 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="font-medium">{frontmatter?.author || 'Anonymous'}</span>
              </span>
              {frontmatter?.pubDate && (
                <>
                  <span className="mx-2">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    <time dateTime={frontmatter.pubDate}>{formatDate(frontmatter.pubDate)}</time>
                  </span>
                </>
              )}
            </div>
            
            {frontmatter?.description && (
              <p className="text-lg text-foreground/90 mb-8">
                {frontmatter.description}
              </p>
            )}
          </div>
          
          <div className="relative mb-10 h-[400px] md:h-[500px] rounded-xl overflow-hidden animate-fade-up shadow-md">
            <img 
              src={optimizeImage(imageUrl)} 
              alt={imageAlt}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                e.currentTarget.src = generateDynamicImageUrl(frontmatter.title, 1200, 630);
              }}
            />
          </div>
          
          <div className="animate-fade-up">
            <MarkdownRenderer 
              content={content} 
              className="prose-headings:font-serif prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-base prose-p:leading-7 prose-a:text-primary hover:prose-a:text-primary/80 prose-pre:bg-slate-800 prose-pre:rounded-lg prose-pre:shadow-sm prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-img:rounded-md prose-img:shadow-sm"
            />
          </div>
          
          <div className="border-t border-border mt-16 pt-8">
            <div className="bg-gradient-to-r from-primary/10 to-background p-6 rounded-lg border border-primary/20 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
              {frontmatter?.tags && Array.isArray(frontmatter.tags) && frontmatter.tags.length > 0 ? (
                <TagCloud tags={frontmatter.tags} />
              ) : (
                <p className="text-muted-foreground">No tags available</p>
              )}
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
