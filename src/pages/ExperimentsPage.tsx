import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Github,
  Star,
  GitBranch,
  Terminal,
  Code2,
  Database,
  Mail,
  ExternalLink,
  RefreshCw,
  Code2 as CodeIcon,
  AlertCircle,
  Settings,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

interface Repository {
  name: string
  description: string
  stars: number
  language: string
  languageColor: string
  icon: React.ComponentType<{ className?: string }>
  topics: string[]
  url: string
  featured?: boolean
  repoName?: string // GitHub repo name if different from display name
  githubUser?: string // GitHub username if different from default
  fromAPI?: boolean // Flag to indicate if repo came from API
  forks?: number
  watchers?: number
  createdAt?: string
  updatedAt?: string
}

// Featured projects to always show at the top
const featuredProjects: Repository[] = [
  {
    name: 'Deep Code Reasoning MCP',
    repoName: 'deep-code-reasoning-mcp',
    description:
      'MCP server that intelligently routes complex debugging tasks between Claude Code and Gemini AI for advanced code analysis',
    stars: 1, // fallback
    language: 'JavaScript',
    languageColor: '#f1e05a',
    icon: Code2,
    topics: ['MCP', 'AI Agents', 'Code Analysis', 'Multi-Model'],
    url: 'https://github.com/haasonsaas/deep-code-reasoning-mcp',
    githubUser: 'haasonsaas',
    featured: true,
  },
  {
    name: 'OCode',
    repoName: 'ocode',
    description:
      'A sophisticated terminal-native AI coding assistant that provides deep codebase intelligence and autonomous task execution',
    stars: 92, // fallback
    language: 'Python',
    languageColor: '#3776AB',
    icon: Terminal,
    topics: ['AI', 'Developer Tools', 'Local LLM'],
    url: 'https://github.com/HaasOnSaaS/ocode',
    featured: false,
  },
  {
    name: 'DiffScope',
    repoName: 'diffscope',
    description: 'A composable code review engine for automated diff analysis',
    stars: 5, // fallback
    language: 'Rust',
    languageColor: '#dea584',
    icon: GitBranch,
    topics: ['Code Review', 'Static Analysis', 'Rust'],
    url: 'https://github.com/HaasOnSaaS/diffscope',
  },
  {
    name: 'CodeDebt',
    repoName: 'codedebt',
    description:
      'Ultra-fast code debt detection library and CLI written in Rust',
    stars: 4, // fallback
    language: 'Rust',
    languageColor: '#dea584',
    icon: Database,
    topics: ['Code Quality', 'Technical Debt', 'CLI'],
    url: 'https://github.com/HaasOnSaaS/codedebt',
  },
  {
    name: 'Lifelog Email',
    repoName: 'lifelog-email',
    description:
      "Layer that sits on top of Limitless—taking the pendant's captured audio summaries and turning them into actionable insights",
    stars: 3, // fallback
    language: 'TypeScript',
    languageColor: '#3178c6',
    icon: Mail,
    topics: ['AI', 'Productivity', 'Email Automation'],
    url: 'https://github.com/HaasOnSaaS/lifelog-email',
  },
]

// Language colors mapping
const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3776AB',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  React: '#61dafb',
  Svelte: '#ff3e00',
  C: '#555555',
  'C++': '#f34b7d',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Haskell: '#5e5086',
  Lua: '#000080',
  R: '#198CE7',
  Scala: '#c22d40',
  Julia: '#a270ba',
  default: '#6c757d',
}

// Icon mapping based on language or topic
const getIconForRepo = (
  language: string | null,
  topics: string[]
): React.ComponentType<{ className?: string }> => {
  // Topic-based icons take precedence
  if (
    topics.some(
      (t) => t.toLowerCase().includes('ai') || t.toLowerCase().includes('llm')
    )
  )
    return Code2
  if (
    topics.some(
      (t) =>
        t.toLowerCase().includes('cli') || t.toLowerCase().includes('terminal')
    )
  )
    return Terminal
  if (
    topics.some(
      (t) =>
        t.toLowerCase().includes('database') || t.toLowerCase().includes('db')
    )
  )
    return Database
  if (
    topics.some(
      (t) =>
        t.toLowerCase().includes('email') || t.toLowerCase().includes('mail')
    )
  )
    return Mail

  // Language-based icons
  switch (language?.toLowerCase()) {
    case 'rust':
    case 'go':
      return Database
    case 'python':
      return Terminal
    default:
      return CodeIcon
  }
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Repository[]>(featuredProjects)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllRepos()
  }, [])

  const fetchAllRepos = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch all repos from haasonsaas user
      const response = await fetch(
        'https://api.github.com/users/haasonsaas/repos?per_page=100&sort=stars&direction=desc'
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const repos = await response.json()

      // Filter repos with at least 1 star and process them
      const starredRepos = repos
        .filter(
          (repo: { stargazers_count: number }) => repo.stargazers_count > 0
        )
        .map(
          (repo: {
            name: string
            description: string | null
            stargazers_count: number
            language: string | null
            topics?: string[]
          }): Repository => ({
            name: repo.name
              .split('-')
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
              )
              .join(' '),
            repoName: repo.name,
            description: repo.description || 'No description available',
            stars: repo.stargazers_count,
            language: repo.language || 'Unknown',
            languageColor:
              languageColors[repo.language || ''] || languageColors.default,
            icon: getIconForRepo(repo.language, repo.topics || []),
            topics: repo.topics || [],
            url: repo.html_url,
            fromAPI: true,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            createdAt: repo.created_at,
            updatedAt: repo.updated_at,
            githubUser: 'haasonsaas',
          })
        )

      // Merge with featured projects, updating stats if they exist
      const mergedRepos = featuredProjects.map((featured) => {
        const apiRepo = starredRepos.find(
          (r) =>
            r.repoName === featured.repoName ||
            r.name.toLowerCase() === featured.name.toLowerCase()
        )

        if (apiRepo) {
          return {
            ...featured,
            stars: apiRepo.stars,
            forks: apiRepo.forks,
            watchers: apiRepo.watchers,
            updatedAt: apiRepo.updatedAt,
            featured: true,
          }
        }
        return featured
      })

      // Add remaining repos that aren't featured
      const remainingRepos = starredRepos.filter(
        (repo) =>
          !featuredProjects.some(
            (f) =>
              f.repoName === repo.repoName ||
              f.name.toLowerCase() === repo.name.toLowerCase()
          )
      )

      // Combine all repos, featured first
      const allRepos = [...mergedRepos, ...remainingRepos]

      setExperiments(allRepos)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch GitHub repos:', error)
      setError('Failed to load repositories. Using cached data.')
      // Fallback to featured projects only
      setExperiments(featuredProjects)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Code2 className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-display font-semibold">
                Experiments
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Open source projects and tools I've built to solve real problems.
              From local AI assistants to code quality tools, these experiments
              push boundaries.
            </p>
            {lastUpdated && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                <span>Live stats from GitHub</span>
              </div>
            )}
            {error && (
              <div className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                {error}
              </div>
            )}
          </motion.div>

          {/* Featured Project */}
          {experiments
            .filter((exp) => exp.featured)
            .map((experiment, index) => {
              const Icon = experiment.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mb-12"
                >
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                    <div className="relative p-8">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                              {experiment.name}
                              <Badge variant="default" className="gap-1">
                                <Star className="h-3 w-3" />
                                Featured
                              </Badge>
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: experiment.languageColor,
                                  }}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {experiment.language}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="h-3 w-3" />
                                {isLoading ? (
                                  <Skeleton className="h-4 w-8" />
                                ) : (
                                  <span>{experiment.stars}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button asChild>
                          <a
                            href={experiment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gap-2"
                          >
                            <Github className="h-4 w-4" />
                            View on GitHub
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                      <p className="text-muted-foreground mb-4 text-lg">
                        {experiment.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {experiment.topics.map((topic, i) => (
                          <Badge key={i} variant="secondary">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}

          {/* Other Projects Grid */}
          {experiments.filter((exp) => !exp.featured).length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-6"
              >
                <h2 className="text-2xl font-semibold text-center">
                  All Projects with Stars
                </h2>
                <p className="text-center text-muted-foreground mt-2">
                  Showing {experiments.filter((exp) => !exp.featured).length}{' '}
                  repositories
                </p>
              </motion.div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experiments
                  .filter((exp) => !exp.featured)
                  .map((experiment, index) => {
                    const Icon = experiment.icon
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                      >
                        <Card className="h-full hover:shadow-lg transition-all hover:border-primary/20">
                          <div className="p-6 h-full flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor: experiment.languageColor,
                                    }}
                                  />
                                  <span>{experiment.language}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {isLoading ? (
                                    <Skeleton className="h-3 w-6" />
                                  ) : (
                                    <span>{experiment.stars}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <h3 className="text-xl font-semibold mb-2">
                              {experiment.name}
                            </h3>
                            <p className="text-muted-foreground mb-4 flex-grow">
                              {experiment.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {experiment.topics.map((topic, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {topic}
                                </Badge>
                              ))}
                            </div>

                            <Button
                              variant="outline"
                              asChild
                              className="w-full"
                            >
                              <a
                                href={experiment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="gap-2"
                              >
                                <Github className="h-4 w-4" />
                                View Repository
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
              </div>
            </>
          )}

          {/* Browser Diagnostics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16"
          >
            <Card className="p-8 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3">
                    Having Issues with Experiments?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Some experiments require WebGL, Canvas 2D, or Web Audio API support. If you're experiencing
                    issues with any of the interactive demos, run our diagnostics tool to check your browser's
                    capabilities and get troubleshooting tips.
                  </p>
                  <div className="flex gap-3">
                    <Button asChild>
                      <Link to="/diagnostics">
                        <Settings className="mr-2 h-4 w-4" />
                        Run Browser Diagnostics
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <a 
                        href="https://get.webgl.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Test WebGL Support
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Interactive Experiments Section */}
          <div className="mt-16 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold mb-6 text-center">
                Interactive Experiments
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* WebGL Demo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
              >
                <Card className="p-6 h-full bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        WebGL Playground
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Interactive fluid simulation
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Experience real-time fluid dynamics powered by WebGL
                    shaders. Features three experiments: fluid simulation,
                    particle system, and Mandelbrot fractals.
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      WebGL
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      GLSL Shaders
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Real-time
                    </Badge>
                  </div>
                  <Button asChild className="gap-2 w-full" size="sm">
                    <a href="/webgl">
                      <RefreshCw className="h-4 w-4" />
                      Try WebGL Demo
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </Card>
              </motion.div>

              {/* Code Rain */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card className="p-6 h-full bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <CodeIcon className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Code Rain</h3>
                      <p className="text-sm text-muted-foreground">
                        Matrix-style visualization
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Watch real code from this codebase cascade down your screen
                    Matrix-style. Features actual TypeScript, React, and WebGL
                    snippets.
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      Canvas API
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Animation
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Real Code
                    </Badge>
                  </div>
                  <Button asChild className="gap-2 w-full" size="sm">
                    <a href="/code-rain">
                      <CodeIcon className="h-4 w-4" />
                      Enter the Matrix
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </Card>
              </motion.div>

              {/* Audio Visualizer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
              >
                <Card className="p-6 h-full bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Audio Visualizer
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        3D music visualization
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Real-time 3D audio visualization using WebGL and Web Audio
                    API. Upload music or use your microphone to see sound come
                    alive.
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      Web Audio API
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      3D Graphics
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Microphone
                    </Badge>
                  </div>
                  <Button asChild className="gap-2 w-full" size="sm">
                    <a href="/audio-visualizer">
                      <RefreshCw className="h-4 w-4" />
                      Visualize Audio
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </Card>
              </motion.div>

              {/* Ray Marching */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Card className="p-6 h-full bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Ray Marching</h3>
                      <p className="text-sm text-muted-foreground">
                        3D scene explorer
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Explore 3D scenes rendered entirely in fragment shaders
                    using ray marching. Features soft shadows, ambient
                    occlusion, and PBR materials.
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      Ray Marching
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      SDF
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      PBR
                    </Badge>
                  </div>
                  <Button asChild className="gap-2 w-full" size="sm">
                    <a href="/ray-marching">
                      <RefreshCw className="h-4 w-4" />
                      Explore 3D
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </Card>
              </motion.div>

              {/* N-Body Simulation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.65 }}
              >
                <Card className="p-6 h-full bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        N-Body Simulation
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Gravitational physics
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Interactive gravitational physics simulation. Add celestial
                    bodies, watch them orbit, collide, and create complex
                    gravitational interactions.
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      Physics
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Gravity
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Orbital Mechanics
                    </Badge>
                  </div>
                  <Button asChild className="gap-2 w-full" size="sm">
                    <a href="/n-body">
                      <RefreshCw className="h-4 w-4" />
                      Simulate Space
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </Card>
              </motion.div>

              {/* Cellular Automata */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Card className="p-6 h-full bg-gradient-to-br from-teal-500/5 to-green-500/5 border-teal-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-teal-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Cellular Automata
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Emergent patterns
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Explore the fascinating world of cellular automata. Simple
                    rules create complex patterns, from Conway's Game of Life to
                    elementary automata.
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      Game of Life
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Algorithms
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Emergence
                    </Badge>
                  </div>
                  <Button asChild className="gap-2 w-full" size="sm">
                    <a href="/cellular-automata">
                      <RefreshCw className="h-4 w-4" />
                      Create Life
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </Card>
              </motion.div>

              {/* Generative Art */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.75 }}
              >
                <Card className="p-6 h-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Generative Art</h3>
                      <p className="text-sm text-muted-foreground">
                        Algorithmic creativity
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Create algorithmic art using mathematical functions and
                    natural patterns. Explore different techniques from Perlin
                    noise to L-systems and fractals.
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      Perlin Noise
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      L-Systems
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Fractals
                    </Badge>
                  </div>
                  <Button asChild className="gap-2 w-full" size="sm">
                    <a href="/generative-art">
                      <RefreshCw className="h-4 w-4" />
                      Generate Art
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </Card>
              </motion.div>

              {/* HDR Holographic Foil */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Card className="p-6 h-full bg-gradient-to-br from-violet-500/5 to-pink-500/5 border-violet-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-violet-500/10 rounded-lg flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-violet-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        HDR Holographic Foil
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        True HDR effects
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Experience true HDR colors that exceed standard RGB range on
                    compatible displays. Interactive holographic surface with
                    mouse-driven lighting and 3D transforms.
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      HDR Colors
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Interactive
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Mac Optimized
                    </Badge>
                  </div>
                  <Button asChild className="gap-2 w-full" size="sm">
                    <a href="/experiments/hdr-holographic-foil">
                      <RefreshCw className="h-4 w-4" />
                      Experience HDR
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </Card>
              </motion.div>

              {/* Liquid Metal Surface */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.85 }}
              >
                <Card className="p-6 h-full bg-gradient-to-br from-slate-500/5 to-zinc-500/5 border-slate-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-slate-500/10 rounded-lg flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Liquid Metal Surface
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        T-1000 physics simulation
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Interactive liquid metal simulation with realistic surface
                    tension, viscosity, and ripple effects. Click and drag to
                    disturb the metallic surface and watch it flow back.
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      Fluid Dynamics
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Metaballs
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Real-time
                    </Badge>
                  </div>
                  <Button asChild className="gap-2 w-full" size="sm">
                    <a href="/experiments/liquid-metal">
                      <RefreshCw className="h-4 w-4" />
                      Disturb Surface
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 text-center"
          >
            <Card className="p-8 bg-muted/30">
              <h2 className="text-2xl font-semibold mb-4">
                Want to Collaborate?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                I'm always interested in working on interesting problems. If you
                have ideas for tools that could help developers or want to
                contribute to any of these projects, let's connect.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <a
                    href="https://github.com/HaasOnSaaS"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    Follow on GitHub
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="mailto:jonathan@haasonsaas.com">
                    <Mail className="mr-2 h-4 w-4" />
                    Get in Touch
                  </a>
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </Layout>
  )
}
