import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import BlogCard from '@/components/BlogCard';
import { getAllPosts, getAllTags } from '@/utils/blogUtils';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogPost } from '@/types/blog';

const POSTS_PER_PAGE = 9;

export default function BlogPage() {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadPosts = async () => {
      const allPosts = await getAllPosts();
      setPosts(allPosts);
    };
    loadPosts();
  }, []);

  useEffect(() => {
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    let filtered = [...posts];

    if (tag) {
      filtered = filtered.filter((post) =>
        post.frontmatter.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.frontmatter.title.toLowerCase().includes(searchLower) ||
          post.frontmatter.description.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPosts(filtered);
    setTotalPages(Math.ceil(filtered.length / POSTS_PER_PAGE));
    setCurrentPage(1);
  }, [posts, searchParams]);

  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

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
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPosts.map((post) => (
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
