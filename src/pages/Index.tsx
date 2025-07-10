import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Layout from '@/components/Layout'
import { WebsiteMeta } from '@/components/SEO/MetaTags'
import { generateWebsiteStructuredData } from '@/utils/seo/structuredData'
import StructuredData from '@/components/SEO/StructuredData'
import { getWebsiteSchema, injectStructuredData } from '@/utils/seoUtils'
import {
  ArrowRight,
  Mail,
  BookOpen,
  Building2,
  TrendingUp,
  Bot,
  Code,
  Search,
  Database,
} from 'lucide-react'

export default function Index() {
  // Inject structured data for SEO
  const websiteSchema = getWebsiteSchema()
  injectStructuredData(websiteSchema)

  const websiteStructuredData = generateWebsiteStructuredData()

  return (
    <Layout>
      <WebsiteMeta
        title="Building Systems That Actually Scale | Haas on SaaS"
        description="Insights on building and scaling SaaS products, startup strategy, security engineering, and AI systems from an experienced technical leader."
      />
      <StructuredData data={websiteStructuredData} />
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
                    Security & Applied AI Engineering Leader
                  </Badge>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6"
                >
                  Building Systems That{' '}
                  <span className="text-primary">Actually Scale</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed"
                >
                  I'm a security and applied AI engineering leader who builds
                  systems that scale. From early-stage startups to enterprise
                  platforms, I share insights on solving real problems with
                  thoughtful technology.
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
                    <span>Founded ThreatKey</span>
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
                    src="/images/self.webp"
                    alt="Jonathan Haas"
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <h2 className="text-2xl font-semibold mb-2">
                      Jonathan Haas
                    </h2>
                    <p className="text-white/90">
                      Security & Applied AI Engineering Leader
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* AI Agents Welcome */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="p-8 sm:p-12">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold">
                    AI Agents Welcome
                  </h2>
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                  This website is built to be AI-agent-friendly with structured
                  APIs, enhanced metadata, and comprehensive documentation for
                  programmatic access.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <Database className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Structured APIs</h3>
                  <p className="text-sm text-muted-foreground">
                    Clean JSON endpoints for posts, search, and taxonomy
                  </p>
                </div>
                <div className="text-center">
                  <Search className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Smart Search</h3>
                  <p className="text-sm text-muted-foreground">
                    Weighted relevance scoring across content and metadata
                  </p>
                </div>
                <div className="text-center">
                  <Code className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Rich Metadata</h3>
                  <p className="text-sm text-muted-foreground">
                    Schema.org structured data and content classification
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/agents">
                  <Button size="lg" className="group">
                    <Bot className="w-5 h-5 mr-2" />
                    API Documentation
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <a
                  href="/api/posts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button size="lg" variant="outline" className="group">
                    <Database className="w-5 h-5 mr-2" />
                    Try API
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Newsletter CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
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
                Get weekly insights on product strategy, infrastructure design,
                and building systems that scale. Join thousands of developers
                and tech leaders building products that matter.
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
      </div>
    </Layout>
  )
}
