
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import BlogCard from '@/components/BlogCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getPostsByTag } from '@/utils/blogUtils';

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const posts = getPostsByTag(tag || '');
  
  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/tags">
            <Button variant="ghost" className="mb-6 flex items-center gap-2">
              <ArrowLeft size={16} /> All Tags
            </Button>
          </Link>
          
          <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4 capitalize">
              {tag?.replace(/-/g, ' ')}
            </h1>
            <p className="text-muted-foreground">
              {posts.length} article{posts.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <BlogCard key={post.slug} post={post} />
            ))}
            
            {posts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <h3 className="text-xl font-medium mb-2">No articles found</h3>
                <p className="text-muted-foreground">
                  There are no articles with this tag yet
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
