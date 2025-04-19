import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import BlogCard from '@/components/BlogCard';
import TagCloud from '@/components/TagCloud';
import { Button } from '@/components/ui/button';
import { getAllPosts, getFeaturedPosts, getAllTags } from '@/utils/blogUtils';
import { ArrowRight, Sparkles, Brain, Code2, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';

export default function Index() {
  const [featuredPost, setFeaturedPost] = useState(getFeaturedPosts()[0]);
  const [recentPosts, setRecentPosts] = useState(getAllPosts().slice(0, 3));
  const [popularTags, setPopularTags] = useState(getAllTags().slice(0, 8));

  return (
    <Layout>
      <section className="relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5 animate-gradient" />
        
        <div className="relative pt-16 pb-12 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                  <div className="absolute -inset-1 bg-primary/20 rounded-full blur-xl" />
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 font-serif bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                Haas on SaaS
              </h1>
              
              <div className="text-xl md:text-2xl text-muted-foreground mb-8 h-12">
                <TypeAnimation
                  sequence={[
                    'Exploring the future of AI',
                    2000,
                    'Building better software',
                    2000,
                    'Sharing tech insights',
                    2000,
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                />
              </div>
              
              <div className="flex justify-center gap-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to={`/blog/${featuredPost.slug}`}>
                    <Button size="lg" className="gap-2">
                      <Brain className="w-5 h-5" />
                      Read Latest
                    </Button>
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/tags">
                    <Button variant="outline" size="lg" className="gap-2">
                      <Code2 className="w-5 h-5" />
                      Browse Topics
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Recent Articles */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-16"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  Recent Articles
                </h2>
                <Link to="/blog">
                  <Button variant="ghost" className="flex items-center gap-2 group">
                    View all <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentPosts.map((post, index) => (
                  <motion.div
                    key={post.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  >
                    <BlogCard post={post} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* Tag Cloud */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-gradient-to-br from-primary/5 to-background p-8 rounded-xl border border-primary/10 shadow-sm"
            >
              <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Browse by Topic
              </h2>
              <TagCloud tags={popularTags} className="justify-center" />
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
