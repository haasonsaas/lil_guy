import Layout from '@/components/Layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Code,
  Bot,
  Search,
  Tag,
  FileText,
  Database,
  Zap,
  Globe,
  Shield,
  BookOpen,
} from 'lucide-react'
import { WebsiteMeta } from '@/components/SEO/MetaTags'
import AgentOnboarding from '@/components/AgentOnboarding'

export default function AgentsPage() {
  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/capabilities',
      description: 'Discover all available AI-agent features and capabilities',
      params: [],
      example: '/api/capabilities',
      icon: <Bot className="w-4 h-4" />,
    },
    {
      method: 'GET',
      path: '/api/search',
      description:
        'Search blog content with relevance scoring and multiple formats',
      params: ['q', 'limit', 'format', 'content'],
      example: '/api/search?q=technical+debt&limit=3&format=json',
      icon: <Search className="w-4 h-4" />,
    },
    {
      method: 'GET',
      path: '/api/recommendations',
      description: 'Get personalized content recommendations by role and topic',
      params: ['role', 'topic', 'experience', 'limit'],
      example: '/api/recommendations?role=founder&topic=technical-leadership',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      method: 'GET',
      path: '/api/posts',
      description: 'List all blog posts with metadata (legacy endpoint)',
      params: ['limit', 'offset', 'tag', 'author'],
      example: '/api/posts?limit=10&tag=startup-funding',
      icon: <FileText className="w-4 h-4" />,
    },
  ]

  const features = [
    {
      icon: <Database className="w-5 h-5" />,
      title: 'Structured Data',
      description:
        'Clean JSON responses with consistent schemas and comprehensive metadata',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Fast & Cached',
      description:
        'Edge-cached responses with appropriate TTLs for optimal performance',
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: 'CORS Enabled',
      description:
        'Cross-origin requests supported for client-side applications',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Rate Limits',
      description: 'Respectful usage guidelines to ensure service availability',
    },
  ]

  const useCases = [
    'Content aggregation and analysis',
    'Research and knowledge extraction',
    'AI training data collection',
    'Content recommendation systems',
    'SEO and content auditing',
    'Academic research projects',
  ]

  return (
    <Layout>
      <WebsiteMeta
        title="AI Agents API Documentation | Haas on SaaS"
        description="Complete API documentation for AI agents to programmatically access blog content, search, and metadata"
        path="/agents"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">AI Agents Welcome</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Programmatic access to all blog content through clean, structured
            APIs. Built for agents, researchers, and developers.
          </p>
        </div>

        {/* Quick Start Guide */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Interactive Quick Start
            </CardTitle>
            <CardDescription>
              Learn how to use our AI-agent-friendly APIs with live examples and
              copy-paste code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgentOnboarding />
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {feature.icon}
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* API Endpoints */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              API Endpoints
            </CardTitle>
            <CardDescription>
              All endpoints return JSON and support CORS. Base URL:
              https://haasonsaas.com
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {apiEndpoints.map((endpoint, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {endpoint.icon}
                    <Badge variant="outline" className="font-mono">
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    {endpoint.description}
                  </p>

                  {endpoint.params.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium">Parameters:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {endpoint.params.map((param) => (
                          <Badge
                            key={param}
                            variant="secondary"
                            className="text-xs"
                          >
                            {param}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-muted p-3 rounded font-mono text-sm">
                    <span className="text-muted-foreground">Example: </span>
                    <a
                      href={`https://haasonsaas.com${endpoint.example}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {endpoint.example}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usage Guidelines */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Usage Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Rate Limits</h4>
                <p className="text-sm text-muted-foreground">
                  Please limit requests to 60/minute per IP. Responses are
                  cached at the edge.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Attribution</h4>
                <p className="text-sm text-muted-foreground">
                  If using content publicly, please attribute to "Jonathan Haas
                  - Haas on SaaS"
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Caching</h4>
                <p className="text-sm text-muted-foreground">
                  Content updates every 5-60 minutes. Check the "generated"
                  timestamp in responses.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Use Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {useCases.map((useCase, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {useCase}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Schema Examples */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Response Schema Example</CardTitle>
            <CardDescription>
              All endpoints return structured JSON with consistent schemas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
              {`{
  "query": "technical debt",
  "results": [
    {
      "title": "The Hidden Costs of Technical Debt",
      "slug": "the-hidden-costs-of-technical-debt",
      "description": "Technical debt isn't just messy code...",
      "url": "https://haasonsaas.com/posts/...",
      "tags": ["technical-debt", "engineering", "velocity"],
      "author": "Jonathan Haas",
      "pubDate": "2025-06-19",
      "relevance": 0.95
    }
  ],
  "totalResults": 1,
  "processingTime": 12
}`}
            </pre>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Questions or Issues?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              If you're building something interesting with this API or need
              higher rate limits, I'd love to hear about it.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <a
                  href="https://twitter.com/haasonsaas"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contact on Twitter
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="/api/posts?limit=1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Test API
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
