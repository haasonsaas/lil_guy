
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import BlogCard from '@/components/BlogCard';
import TagCloud from '@/components/TagCloud';
import { Button } from '@/components/ui/button';
import { getAllPosts, getFeaturedPosts, getAllTags } from '@/utils/blogUtils';
import { ArrowRight } from 'lucide-react';

export default function Index() {
  const [featuredPost, setFeaturedPost] = useState(getFeaturedPosts()[0]);
  const [recentPosts, setRecentPosts] = useState(getAllPosts().slice(0, 3));
  const [popularTags, setPopularTags] = useState(getAllTags().slice(0, 8));

  return (
    <Layout>
      <section className="pt-8 pb-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif">Haas on SaaS</h1>
            <p className="text-muted-foreground text-lg">
              Insights on AI, technology, and the future of software development
            </p>
          </div>
          
          {featuredPost && (
            <div className="mb-16">
              <BlogCard post={featuredPost} featured={true} />
            </div>
          )}
          
          <div className="mb-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Recent Articles</h2>
              <Link to="/blog">
                <Button variant="ghost" className="flex items-center gap-2 group">
                  View all <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map(post => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-primary/5 to-background p-8 rounded-xl border border-primary/10 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-center">Browse by Topic</h2>
            <TagCloud tags={popularTags} className="justify-center" />
          </div>
        </div>
      </section>
    </Layout>
  );
}
