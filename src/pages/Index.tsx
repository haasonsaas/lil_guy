import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import BlogCard from "@/components/BlogCard";
import GroupedTags from "@/components/GroupedTags";
import { Button } from "@/components/ui/button";
import { getAllPosts, getFeaturedPosts, getAllTags, formatDate, calculateReadingTime } from "@/utils/blogUtils";
import { ArrowRight, Sparkles, Brain, Code2, Rocket, Hammer, Scale, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { BlogPost } from "@/types/blog";
import { Subscribe } from '../components/Subscribe';
import WeeklyPlaybook from '@/components/WeeklyPlaybook';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const tagGroups = [
  {
    name: "Build",
    icon: <Hammer className="w-4 h-4" />,
    tags: ["product", "ux", "ai", "engineering", "design"]
  },
  {
    name: "Scale",
    icon: <Scale className="w-4 h-4" />,
    tags: ["leadership", "productivity", "growth", "marketing", "sales"]
  },
  {
    name: "Operate",
    icon: <Settings className="w-4 h-4" />,
    tags: ["personal-growth", "strategy", "management", "culture", "career"]
  }
];

export default function Index() {
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [posts, tags, featured] = await Promise.all([
          getAllPosts(),
          getAllTags(),
          getFeaturedPosts()
        ]);
        setFeaturedPost(featured[0] || null);
        const recentPostsWithoutFeatured = posts
          .filter(post => post.slug !== featured[0]?.slug)
          .slice(0, 3);
        setRecentPosts(recentPostsWithoutFeatured);
        setPopularTags(tags.slice(0, 8));
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                Where Technical Vision Meets Market Reality
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                After a decade of building and working in enterprise software, I saw a pattern: great products falter without great go-to-market. Haas on SaaS is my playbook of hard lessons and emerging trends – from AI's impact on vertical SaaS to the difference between polite interest and true adoption.
              </p>

              <div className="flex items-center justify-center gap-4 mb-8">
                <img
                  src="/images/author.jpg"
                  alt="Jonathan Haas"
                  className="w-10 h-10 rounded-full border-2 border-primary/20 flex-shrink-0"
                />
                <div className="text-left">
                  <p className="text-sm font-medium">Jonathan Haas</p>
                  <p className="text-xs text-muted-foreground">
                    Product Manager @ Vanta | ex-Snap, DoorDash, Carta
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto"
                >
                  <Link to={`/blog/${featuredPost?.slug}`}>
                    <Button size="lg" className="w-full sm:w-auto gap-2">
                      <Brain className="w-5 h-5" />
                      Read Latest
                    </Button>
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto"
                >
                  <Link to="/tags">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto gap-2"
                    >
                      <Code2 className="w-5 h-5" />
                      Browse Topics
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Newsletter Signup */}
        <WeeklyPlaybook />

        {/* Featured Post */}
        {!isLoading && featuredPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Featured Article
              </h2>
            </div>
            <div className="relative group">
              <Link to={`/blog/${featuredPost.slug}`} className="block">
                <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-background shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/20">
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                      <Sparkles className="w-3 h-3" />
                      Featured
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(featuredPost.frontmatter.pubDate)}
                      </span>
                    </div>
                    <h3 className="text-3xl font-display font-semibold mb-4 group-hover:text-primary transition-colors">
                      {featuredPost.frontmatter.title}
                    </h3>
                    <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                      {featuredPost.frontmatter.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              {calculateReadingTime(featuredPost.content).minutes} min read
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Based on {calculateReadingTime(featuredPost.content).wordCount} words at 200 words per minute</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span>•</span>
                      <div className="flex flex-wrap gap-2">
                        {featuredPost.frontmatter.tags.map((tag, index) => (
                          <span
                            key={tag}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              index === 0
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Recent Articles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Latest Articles
            </h2>
            <Link to="/blog">
              <Button variant="ghost" className="flex items-center gap-2 group">
                View all{" "}
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="bg-gradient-to-br from-primary/5 to-background p-8 rounded-2xl border border-primary/10 shadow-sm">
            <h2 className="text-2xl font-display font-semibold mb-6 text-center flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Browse by Topic
            </h2>
            <GroupedTags groups={tagGroups} className="max-w-2xl mx-auto" />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
