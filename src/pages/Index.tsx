import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getBlogStats, getAllPosts, getAllTags } from "@/utils/blogUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import BlogCard from "@/components/BlogCard";
import AuthorBio from "@/components/AuthorBio";
import Layout from "@/components/Layout";
import { Subscribe } from '@/components/Subscribe';
import { Code2 } from "lucide-react";
import type { BlogPost } from '@/types/blog';

export default function Index() {
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalWordCount: 0,
    avgReadingTime: 0,
    topTags: [] as string[],
    totalReadingTime: 0,
    totalReadingTimeFormatted: '',
    totalTags: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allPosts, tags] = await Promise.all([
          getAllPosts(),
          getAllTags()
        ]);
        
        // Get only the first 6 posts
        setRecentPosts(allPosts.slice(0, 6));
        
        const blogStats = await getBlogStats();
        setStats(blogStats);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  return (
    <Layout>
      <div className="space-y-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-3xl -z-10" />
            <div className="relative py-16 sm:py-24">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                Jonathan Haas
              </h1>
              <h2 className="text-2xl sm:text-3xl font-display font-medium text-muted-foreground mb-6">
                Product Manager & Technical Strategist
              </h2>

              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                I turn hairy B2B roadmaps into products users pay for—and write the playbook as I go.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto"
                >
                  <Subscribe className="w-full sm:w-auto" />
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto"
                >
                  <Link to="/about">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto gap-2"
                    >
                      <Code2 className="w-5 h-5" />
                      Work with Me
                    </Button>
                  </Link>
                </motion.div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <img
                  src="/images/author.jpg"
                  alt="Jonathan Haas"
                  className="w-10 h-10 rounded-full border-2 border-primary/20 flex-shrink-0"
                />
                <div className="text-left">
                  <p className="text-sm font-medium">Product Manager @ Vanta</p>
                  <p className="text-xs text-muted-foreground">
                    ex-Snap, DoorDash, Carta
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Credibility Band */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                With over a decade of experience in enterprise software, I've helped scale products from early-stage to market leaders. My focus is on bridging the gap between technical innovation and market adoption.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{stats.totalPosts}+</span>
                  <span>Articles Published</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{stats.totalWordCount ? Math.round(stats.totalWordCount / 1000) : 0}k+</span>
                  <span>Words Written</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{stats.totalTags}+</span>
                  <span>Topics Covered</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-6">
              <Card className="p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {stats.avgReadingTime} min
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Average Reading Time
                </p>
              </Card>
              <Card className="p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {stats.totalReadingTimeFormatted}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Total Reading Time
                </p>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* Recent Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Recent Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/blog">
              <Button variant="outline">View All Posts</Button>
            </Link>
          </div>
        </motion.div>

        {/* Author Bio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <AuthorBio />
        </motion.div>
      </div>
    </Layout>
  );
}
