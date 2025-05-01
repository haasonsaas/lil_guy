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
      <div className="space-y-16">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 font-serif bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Haas on SaaS
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
            No fluff. Just SaaS, AI, and hard truths.
          </p>

          <div className="flex items-center justify-center gap-2 mb-6 md:mb-8">
            <img 
              src="/images/author.jpg" 
              alt="Jonathan Haas" 
              className="w-8 h-8 rounded-full border-2 border-primary/20"
            />
            <p className="text-sm text-muted-foreground">
              PM @ Vanta, former Founder. Building AI-native SaaS products that scale.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Link to={`/blog/${featuredPost.slug}`}>
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Brain className="w-5 h-5" />
                  Read Latest
                </Button>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Link to="/tags">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <Code2 className="w-5 h-5" />
                  Browse Topics
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Newsletter Signup */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="max-w-2xl mx-auto p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm"
        >
          <div className="flex flex-col items-center text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-2">Get the Weekly Playbook</h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
              One tactical post per week on scaling SaaS with AI — zero fluff, all signal
            </p>
            <form className="w-full max-w-md flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-md border bg-background"
                required
              />
              <Button type="submit" className="whitespace-nowrap">
                Subscribe
              </Button>
            </form>
            <p className="text-xs md:text-sm text-muted-foreground mt-4">
              Join SaaS builders and founders building the future
            </p>
          </div>
        </motion.div>
        
        {/* Featured Post */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Featured Article
            </h2>
          </div>
          <div className="relative group">
            <Link to={`/blog/${featuredPost.slug}`} className="block">
              <div className="relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 group-hover:shadow-md">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      Featured
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(featuredPost.frontmatter.pubDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {featuredPost.frontmatter.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {featuredPost.frontmatter.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{Math.ceil(featuredPost.content.split(' ').length / 200)} min read</span>
                    <span>•</span>
                    <span>{featuredPost.frontmatter.tags.length} topics</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>
        
        {/* Recent Articles */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Latest Articles
            </h2>
            <Link to="/blog">
              <Button variant="ghost" className="flex items-center gap-2 group">
                View all <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
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
    </Layout>
  );
}
