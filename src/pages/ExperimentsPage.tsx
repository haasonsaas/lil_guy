import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  Code2 as CodeIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Repository {
  name: string;
  description: string;
  stars: number;
  language: string;
  languageColor: string;
  icon: React.ComponentType<{ className?: string }>;
  topics: string[];
  url: string;
  featured?: boolean;
  repoName?: string; // GitHub repo name if different from display name
  githubUser?: string; // GitHub username if different from default
}

const experimentsData: Repository[] = [
  {
    name: "Deep Code Reasoning MCP",
    repoName: "deep-code-reasoning-mcp",
    description: "MCP server that intelligently routes complex debugging tasks between Claude Code and Gemini AI for advanced code analysis",
    stars: 1, // fallback
    language: "JavaScript",
    languageColor: "#f1e05a",
    icon: Code2,
    topics: ["MCP", "AI Agents", "Code Analysis", "Multi-Model"],
    url: "https://github.com/haasonsaas/deep-code-reasoning-mcp",
    githubUser: "haasonsaas",
    featured: true
  },
  {
    name: "OCode",
    repoName: "ocode",
    description: "A sophisticated terminal-native AI coding assistant that provides deep codebase intelligence and autonomous task execution",
    stars: 92, // fallback
    language: "Python",
    languageColor: "#3776AB",
    icon: Terminal,
    topics: ["AI", "Developer Tools", "Local LLM"],
    url: "https://github.com/HaasOnSaaS/ocode",
    featured: false
  },
  {
    name: "DiffScope",
    repoName: "diffscope",
    description: "A composable code review engine for automated diff analysis",
    stars: 5, // fallback
    language: "Rust",
    languageColor: "#dea584",
    icon: GitBranch,
    topics: ["Code Review", "Static Analysis", "Rust"],
    url: "https://github.com/HaasOnSaaS/diffscope"
  },
  {
    name: "CodeDebt",
    repoName: "codedebt",
    description: "Ultra-fast code debt detection library and CLI written in Rust",
    stars: 4, // fallback
    language: "Rust",
    languageColor: "#dea584",
    icon: Database,
    topics: ["Code Quality", "Technical Debt", "CLI"],
    url: "https://github.com/HaasOnSaaS/codedebt"
  },
  {
    name: "Lifelog Email",
    repoName: "lifelog-email",
    description: "Layer that sits on top of Limitless—taking the pendant's captured audio summaries and turning them into actionable insights",
    stars: 3, // fallback
    language: "TypeScript",
    languageColor: "#3178c6",
    icon: Mail,
    topics: ["AI", "Productivity", "Email Automation"],
    url: "https://github.com/HaasOnSaaS/lifelog-email"
  }
];

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Repository[]>(experimentsData);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchGitHubStats();
  }, []);

  const fetchGitHubStats = async () => {
    setIsLoading(true);
    
    try {
      // Fetch all repos in parallel
      const promises = experimentsData.map(async (experiment) => {
        const repoName = experiment.repoName || experiment.name.toLowerCase();
        const githubUser = experiment.githubUser || 'HaasOnSaaS';
        const apiUrl = `https://api.github.com/repos/${githubUser}/${repoName}`;
        
        try {
          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();
            return {
              ...experiment,
              stars: data.stargazers_count,
              description: data.description || experiment.description,
              language: data.language || experiment.language
            };
          }
        } catch (error) {
          console.error(`Failed to fetch stats for ${repoName}:`, error);
        }
        
        // Return original data if fetch fails
        return experiment;
      });

      const updatedExperiments = await Promise.all(promises);
      setExperiments(updatedExperiments);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch GitHub stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
              <h1 className="text-4xl font-display font-semibold">Experiments</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Open source projects and tools I've built to solve real problems. 
              From local AI assistants to code quality tools, these experiments push boundaries.
            </p>
            {lastUpdated && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                <span>Live stats from GitHub</span>
              </div>
            )}
          </motion.div>

          {/* Featured Project */}
          {experiments.filter(exp => exp.featured).map((experiment, index) => {
            const Icon = experiment.icon;
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
                                style={{ backgroundColor: experiment.languageColor }}
                              />
                              <span className="text-sm text-muted-foreground">{experiment.language}</span>
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
            );
          })}

          {/* Other Projects Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiments.filter(exp => !exp.featured).map((experiment, index) => {
              const Icon = experiment.icon;
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
                              style={{ backgroundColor: experiment.languageColor }}
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
                      
                      <h3 className="text-xl font-semibold mb-2">{experiment.name}</h3>
                      <p className="text-muted-foreground mb-4 flex-grow">
                        {experiment.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {experiment.topics.map((topic, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      
                      <Button variant="outline" asChild className="w-full">
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
              );
            })}
          </div>

          {/* Interactive Experiments Section */}
          <div className="mt-16 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold mb-6 text-center">Interactive Experiments</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* WebGL Demo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
              >
                <Card className="p-8 h-full bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">WebGL Playground</h3>
                      <p className="text-muted-foreground">Interactive fluid simulation</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Experience real-time fluid dynamics powered by WebGL shaders. Features three experiments: 
                    fluid simulation, particle system, and Mandelbrot fractals.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge variant="secondary">WebGL</Badge>
                    <Badge variant="secondary">GLSL Shaders</Badge>
                    <Badge variant="secondary">Real-time</Badge>
                  </div>
                  <Button asChild className="gap-2">
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
                <Card className="p-8 h-full bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <CodeIcon className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Code Rain</h3>
                      <p className="text-muted-foreground">Matrix-style visualization</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Watch real code from this codebase cascade down your screen Matrix-style. 
                    Features actual TypeScript, React, and WebGL snippets.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge variant="secondary">Canvas API</Badge>
                    <Badge variant="secondary">Animation</Badge>
                    <Badge variant="secondary">Real Code</Badge>
                  </div>
                  <Button asChild className="gap-2">
                    <a href="/code-rain">
                      <CodeIcon className="h-4 w-4" />
                      Enter the Matrix
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
              <h2 className="text-2xl font-semibold mb-4">Want to Collaborate?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                I'm always interested in working on interesting problems. If you have ideas for 
                tools that could help developers or want to contribute to any of these projects, 
                let's connect.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <a href="https://github.com/HaasOnSaaS" target="_blank" rel="noopener noreferrer">
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
  );
}