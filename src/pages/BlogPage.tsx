
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import BlogCard from '@/components/BlogCard';
import { getAllPosts } from '@/utils/blogUtils';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function BlogPage() {
  const [posts, setPosts] = useState(getAllPosts());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState(posts);
  
  useEffect(() => {
    const filtered = posts.filter(post => {
      const { title, description, tags } = post.frontmatter;
      const searchLower = searchQuery.toLowerCase();
      
      return (
        title.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower) ||
        tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    });
    
    setFilteredPosts(filtered);
  }, [searchQuery, posts]);
  
  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
            <p className="text-muted-foreground mb-8">
              Explore the latest articles on AI, technology, and software development
            </p>
            
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search articles..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <BlogCard key={post.slug} post={post} />
            ))}
            
            {filteredPosts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <h3 className="text-xl font-medium mb-2">No articles found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
