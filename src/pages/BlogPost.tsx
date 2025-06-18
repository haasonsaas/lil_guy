import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import TagCloud from '@/components/TagCloud';
import BlogCard from '@/components/BlogCard';
import AuthorBio from '@/components/AuthorBio';
import SocialShare from '@/components/SocialShare';
import { ReadingProgressBar } from '@/components/ReadingProgressBar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Tag, Calendar, Clock } from 'lucide-react';
import { getPostBySlug, formatDate, calculateReadingTime, getRelatedPosts, getAllTags } from '@/utils/blogUtils';
import { generateDynamicImageUrl, generateOgImageUrl, getImageData } from '@/utils/blog/imageUtils';
import { getBlogPostSchema, injectStructuredData } from '@/utils/seoUtils';
import type { BlogPost } from '@/types/blog';
import WeeklyPlaybook from '@/components/WeeklyPlaybook';
import { Subscribe } from '@/components/Subscribe';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [imageError, setImageError] = useState(false);
  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([]);
  
  useEffect(() => {
    const loadPost = async () => {
      if (!slug) return;
      
      const loadedPost = await getPostBySlug(slug);
      if (!loadedPost) {
        navigate('/blog');
        return;
      }
      
      setPost(loadedPost);
      if (loadedPost.frontmatter.tags) {
        const related = await getRelatedPosts(loadedPost);
        setRelatedPosts(related);
      }
      
      // Load all tags
      const tags = await getAllTags();
      setAllTags(tags);
    };
    
    loadPost();
  }, [slug, navigate]);
  
  useEffect(() => {
    if (!post) return;
    
    // Scroll to top when post loads
    window.scrollTo(0, 0);
    
    // Update page title
    document.title = `${post.frontmatter.title} | Haas on SaaS`;
    
    // Update OpenGraph tags for social sharing
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const ogType = document.querySelector('meta[property="og:type"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    const twitterUrl = document.querySelector('meta[property="twitter:url"]');
    const ogAuthor = document.querySelector('meta[property="article:author"]');
    const twitterCreator = document.querySelector('meta[name="twitter:creator"]');
    const ogPublishedTime = document.querySelector('meta[property="article:published_time"]');
    const ogModifiedTime = document.querySelector('meta[property="article:modified_time"]');
    const ogTags = document.querySelector('meta[property="article:tag"]');
    
    // Set OpenGraph metadata
    if (ogTitle) ogTitle.setAttribute('content', `${post.frontmatter.title} | Haas on SaaS`);
    if (ogDesc) ogDesc.setAttribute('content', post.frontmatter.description);
    if (ogUrl) ogUrl.setAttribute('content', `https://haasonsaas.com/blog/${post.slug}`);
    if (ogType) ogType.setAttribute('content', 'article');
    
    // Use the post's image or generate a dynamic one
    const ogImageUrl = post.frontmatter.image?.url || generateOgImageUrl(post.frontmatter.title);
    
    if (ogImage) ogImage.setAttribute('content', ogImageUrl);
    if (twitterImage) twitterImage.setAttribute('content', ogImageUrl);
    
    // Set Twitter metadata
    if (twitterTitle) twitterTitle.setAttribute('content', post.frontmatter.title);
    if (twitterDesc) twitterDesc.setAttribute('content', post.frontmatter.description);
    if (twitterUrl) twitterUrl.setAttribute('content', `https://haasonsaas.com/blog/${post.slug}`);
    
    // Set author information
    if (ogAuthor) ogAuthor.setAttribute('content', post.frontmatter.author || 'Jonathan Haas');
    if (twitterCreator) twitterCreator.setAttribute('content', '@haasonsaas');
    
    // Set article metadata
    if (ogPublishedTime) ogPublishedTime.setAttribute('content', post.frontmatter.pubDate);
    if (ogModifiedTime) ogModifiedTime.setAttribute('content', post.frontmatter.pubDate);
    
    // Set tags if they exist
    if (ogTags && post.frontmatter.tags && post.frontmatter.tags.length > 0) {
      ogTags.setAttribute('content', post.frontmatter.tags.join(', '));
    }
    
    // Inject structured data for SEO
    const readingTime = calculateReadingTime(post.content);
    const blogPostSchema = getBlogPostSchema(post, readingTime.wordCount, readingTime.minutes);
    injectStructuredData(blogPostSchema);
  }, [post]);
  
  if (!post) {
    return null;
  }
  
  const { frontmatter, content } = post;
  
  // Get image data with proper fallbacks
  const imageData = getImageData(frontmatter);
  const imageUrl = imageError ? generateDynamicImageUrl(frontmatter.title, 1200, 630) : imageData.url;
  const imageAlt = imageData.alt;
  
  return (
    <Layout>
      <ReadingProgressBar />
      <article className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/blog">
            <Button variant="ghost" className="mb-6 flex items-center gap-2 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Blog
            </Button>
          </Link>
          
          <div className="max-w-4xl mx-auto">
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
              
              <div className="article-meta flex items-center gap-4 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{formatDate(frontmatter.pubDate)}</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>{calculateReadingTime(content).minutes} min read</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Based on {calculateReadingTime(content).wordCount} words at 200 words per minute</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="print-only">
                  • {calculateReadingTime(content).wordCount} words
                </span>
              </div>

              <div className="mb-6">
                <AuthorBio />
              </div>

              <div className="mb-8 flex items-center justify-between no-print">
                <div className="text-sm text-muted-foreground">
                  Found this helpful? Share it with others:
                </div>
                <SocialShare 
                  title={frontmatter.title}
                  url={`https://www.haasonsaas.com/blog/${post.slug}`}
                  description={frontmatter.description}
                />
              </div>
            </div>
            
            <div className="animate-fade-up">
              <MarkdownRenderer 
                content={content} 
                className="prose-headings:font-serif prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-base prose-p:leading-7 prose-a:text-primary hover:prose-a:text-primary/80 prose-pre:bg-slate-800 prose-pre:rounded-lg prose-pre:shadow-sm prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-img:rounded-md prose-img:shadow-sm"
              />
            </div>

            <div className="mt-16 no-print">
              <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">
                    Get the Weekly Playbook
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                    One tactical post per week on scaling SaaS with AI — zero fluff,
                    all signal
                  </p>
                  <Subscribe />
                  <p className="text-xs md:text-sm text-muted-foreground mt-4">
                    Join SaaS builders and founders building the future
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-border mt-16 pt-8 no-print">
              <div className="bg-gradient-to-r from-primary/10 to-background p-6 rounded-lg border border-primary/20 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
                {frontmatter?.tags && Array.isArray(frontmatter.tags) && frontmatter.tags.length > 0 ? (
                  <TagCloud tags={allTags.filter(({ tag }) => frontmatter.tags.includes(tag))} />
                ) : (
                  <p className="text-muted-foreground">No tags available</p>
                )}
              </div>
              
              {relatedPosts.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedPosts.map(relatedPost => (
                      <BlogCard key={relatedPost.slug} post={relatedPost} hideAuthor={true} />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-8 text-center">
                <Link to="/blog">
                  <Button className="px-6">
                    Read more articles
                  </Button>
                </Link>
              </div>
            </div>

            {/* Print-only footer with article info */}
            <div className="print-only mt-8 pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-600">
                <p>This article was published on {formatDate(frontmatter.pubDate)} at haasonsaas.com</p>
                {frontmatter?.tags && frontmatter.tags.length > 0 && (
                  <p className="mt-2">
                    Topics: {frontmatter.tags.join(', ')}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </article>
    </Layout>
  );
}
