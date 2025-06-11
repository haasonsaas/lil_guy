import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getBlogStats, getAllPosts, getAllTags } from "@/utils/blogUtils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BlogCard from "@/components/BlogCard";
import Layout from "@/components/Layout";
import { 
  ArrowRight, 
  Mail, 
  Shield, 
  Rocket, 
  Users,
  BookOpen,
  Sparkles,
  Building2,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import type { BlogPost } from '@/types/blog';

const featuredTopics = [
  { name: "Security & Compliance", icon: Shield, count: 15 },
  { name: "Product Strategy", icon: Rocket, count: 12 },
  { name: "Leadership", icon: Users, count: 8 },
  { name: "AI & Automation", icon: Sparkles, count: 10 }
];


export default function Index() {
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
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
        
        // Get featured post (most recent) and next 3 posts
        if (allPosts.length > 0) {
          setFeaturedPost(allPosts[0]);
          setRecentPosts(allPosts.slice(1, 4));
        }
        
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
      <div className="space-y-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 -z-10" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Badge variant="secondary" className="mb-4">
                    Currently at compliance automation company
                  </Badge>
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6"
                >
                  Building the Future of{" "}
                  <span className="text-primary">Security Automation</span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed"
                >
                  I transform complex B2B challenges into elegant solutions. 
                  From building security at scale to founding successful companies, 
                  I share hard-won insights on product, leadership, and growth.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link to="/about">
                    <Button size="lg" className="group">
                      Read My Story
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/newsletter">
                    <Button variant="outline" size="lg">
                      <Mail className="mr-2 h-4 w-4" />
                      Get Weekly Insights
                    </Button>
                  </Link>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="mt-8 flex items-center gap-8 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Ex-Snap, DoorDash, Carta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>ThreatKey (Founded → Exit)</span>
                  </div>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/images/self.jpeg"
                    alt="Jonathan Haas"
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <h2 className="text-2xl font-semibold mb-2">Jonathan Haas</h2>
                    <p className="text-white/90">Security & Product Leader</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Featured Article */}
        {featuredPost && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-display font-semibold">Featured Article</h2>
              <Badge variant="default" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Latest
              </Badge>
            </div>
            <BlogCard post={featuredPost} featured />
          </motion.section>
        )}

        {/* Value Props */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Security Expertise</h3>
              <p className="text-muted-foreground mb-4">
                Deep insights from building security at scale, from startups to IPO-ready companies.
              </p>
              <Link to="/tags/security" className="text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
                Explore Security Articles <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
            
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Product Leadership</h3>
              <p className="text-muted-foreground mb-4">
                Strategies for building products that solve real problems and drive business growth.
              </p>
              <Link to="/tags/product" className="text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
                Read Product Insights <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
            
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Founder Journey</h3>
              <p className="text-muted-foreground mb-4">
                Honest reflections on building, scaling, and successfully exiting a B2B startup.
              </p>
              <Link to="/tags/startup" className="text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
                Learn from Experience <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          </div>
        </motion.section>


        {/* Recent Posts */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-display font-semibold">Recent Articles</h2>
            <Link to="/blog">
              <Button variant="outline" size="sm" className="group">
                View All
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </motion.section>

        {/* Topics Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-center mb-8">
            Explore by Topic
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredTopics.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <Link
                  key={index}
                  to={`/tags/${topic.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group"
                >
                  <Card className="p-6 hover:shadow-lg transition-all hover:border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className="h-8 w-8 text-primary" />
                      <Badge variant="secondary">{topic.count}</Badge>
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {topic.name}
                    </h3>
                  </Card>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* Newsletter CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
            <div className="relative p-8 sm:p-12 text-center">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-display font-semibold mb-4">
                Stay Ahead of the Curve
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Get weekly insights on security, product strategy, and leadership. 
                Join thousands of tech leaders who read my newsletter.
              </p>
              <Link to="/newsletter">
                <Button size="lg" className="group">
                  Subscribe Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.section>

        {/* Stats Footer */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="border-t border-border pt-12 pb-8"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{stats.totalPosts}+</div>
                <div className="text-sm text-muted-foreground">Articles Published</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {stats.totalWordCount ? Math.round(stats.totalWordCount / 1000) : 0}k+
                </div>
                <div className="text-sm text-muted-foreground">Words Written</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{stats.totalReadingTimeFormatted}</div>
                <div className="text-sm text-muted-foreground">Total Reading Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{stats.totalTags}+</div>
                <div className="text-sm text-muted-foreground">Topics Covered</div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}