import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import BlogCard from "@/components/BlogCard";
import GroupedTags from "@/components/GroupedTags";
import { Button } from "@/components/ui/button";
import { getAllPosts, getFeaturedPosts, getAllTags } from "@/utils/blogUtils";
import { ArrowRight, Sparkles, Brain, Code2, Rocket, Hammer, Scale, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { BlogPost } from "@/types/blog";
import { Subscribe } from '../components/Subscribe';
import WeeklyPlaybook from '@/components/WeeklyPlaybook';

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

  // Calculate reading time safely
  const getReadingTime = (content: string | undefined) => {
    if (!content) return 0;
    return Math.ceil(content.split(" ").length / 200);
  };

  // Format date safely
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

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
            Thinking in public. AI, systems, leverage—and the cost of chasing them.
          </p>

          <div className="flex items-center justify-center gap-2 mb-6 md:mb-8 max-w-2xl mx-auto">
            <img
              src="/images/author.jpg"
              alt="Jonathan Haas"
              className="w-8 h-8 rounded-full border-2 border-primary/20 flex-shrink-0"
            />
            <p className="text-sm text-muted-foreground text-center">
              Product Manager @ Vanta | ex-Snap, DoorDash, Carta<br />
              Built and launched AI security products for businesses
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
        </motion.div>

        {/* Newsletter Signup */}
        <WeeklyPlaybook />

        {/* Featured Post */}
        {!isLoading && featuredPost && (
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
                <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/30">
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
                    <h3 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                      {featuredPost.frontmatter.title}
                    </h3>
                    <p className="text-muted-foreground mb-6 text-lg">
                      {featuredPost.frontmatter.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {getReadingTime(featuredPost.content)} min read
                      </span>
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
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
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
          <GroupedTags groups={tagGroups} className="max-w-2xl mx-auto" />
        </motion.div>
      </div>
    </Layout>
  );
}
