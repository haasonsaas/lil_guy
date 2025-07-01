import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Mail,
  Linkedin,
  Github,
  Twitter,
  Building2,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Code2,
  Shield,
  Rocket,
  Users,
  ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { WebsiteMeta } from '@/components/SEO/MetaTags'

const experiences = [
  {
    role: 'Security & AI',
    company: 'Compliance automation company',
    period: 'Oct 2024 - Aug 2025',
    description: 'Joined via ThreatKey',
    achievements: ["🤫 Can't say yet", 'Stay tuned for updates'],
  },
  {
    role: 'Co-founder & CEO',
    company: 'ThreatKey',
    period: 'Oct 2020 - Oct 2024',
    description: 'Pioneered AI-powered compliance automation',
    achievements: [
      'Developed multi-AI evaluation framework for 95%+ accuracy',
      'Built production systems handling 1M+ security events/day',
      'Created testing methodology for AI-to-AI interactions',
      'Achieved successful exit with AI-first platform',
    ],
  },
  {
    role: 'Lead, Security Operations',
    company: 'Carta',
    period: 'Nov 2020 - Jul 2021',
    description: 'Led security operations for equity management platform',
    achievements: [
      'Built security operations from ground up',
      'Implemented incident response protocols',
      'Left to go full-time on ThreatKey',
    ],
  },
  {
    role: 'Senior Security Operations Engineer',
    company: 'DoorDash',
    period: 'Feb 2020 - Nov 2020',
    description: 'Built security infrastructure during rapid growth phase',
    achievements: [
      'Designed security monitoring systems',
      'Automated compliance workflows',
      'Reduced incident response time by 70%',
    ],
  },
  {
    role: 'Advisor (formerly VP Engineering)',
    company: 'Propy',
    period: 'Jan 2019 - Sep 2023',
    description: 'Led engineering then transitioned to advisory role',
    achievements: [
      'Built blockchain-based real estate platform',
      'Scaled engineering team from 5 to 20',
      'Continued advising through ThreatKey journey',
    ],
  },
  {
    role: 'Security Engineer',
    company: 'Snap Inc.',
    period: 'Aug 2016 - Oct 2017',
    description: 'Early security team member, intern to FT conversion',
    achievements: [
      'Built security review process for new features',
      'Implemented secure development lifecycle',
      'Trained engineers on security best practices',
    ],
  },
]

const skills = [
  {
    category: 'AI Evaluation & Testing',
    items: [
      'Multi-Model Orchestration',
      'Component Isolation Testing',
      'AI-to-AI Interaction Validation',
      'Production Eval Frameworks',
      'Output Quality Metrics',
      'Human-in-the-Loop Systems',
    ],
  },
  {
    category: 'Applied AI Engineering',
    items: [
      'LLM System Design',
      'Prompt Engineering',
      'DSPy Framework',
      'Claude & Gemini APIs',
      'AI Agent Development',
      'Real-time AI Workflows',
    ],
  },
  {
    category: 'Infrastructure & Architecture',
    items: [
      'Distributed Systems',
      'Platform Engineering',
      'Event-Driven Architecture',
      'API Design',
      'Observability',
      'Cloud Infrastructure',
    ],
  },
  {
    category: 'Security & Compliance',
    items: [
      'Security Operations',
      'Compliance Automation',
      'Threat Detection',
      'DevSecOps',
      'Zero Trust Architecture',
      'Security Testing',
    ],
  },
]

export default function AboutPage() {
  return (
    <Layout>
      <WebsiteMeta
        title="About Jonathan Haas - AI Evaluation & Systems Engineering Leader"
        description="Learn about Jonathan Haas, an AI evaluation expert specializing in multi-model orchestration, production testing frameworks, and making AI systems work reliably at scale."
        path="/about"
      />
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="mb-16 animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-12 items-start">
              <div className="w-full lg:w-1/3">
                <div className="sticky top-24">
                  <div className="rounded-lg overflow-hidden bg-card border border-border mb-6">
                    <img
                      src="/images/self.jpeg"
                      alt="Jonathan Haas"
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-display font-semibold">
                      Jonathan Haas
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      AI Evaluation & Systems Engineering Leader
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={16} />
                      <span>San Francisco, CA</span>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" size="icon" asChild>
                        <a
                          href="https://linkedin.com/in/haasonsaas"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Linkedin size={18} />
                        </a>
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <a
                          href="https://github.com/haasonsaas"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github size={18} />
                        </a>
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <a
                          href="https://twitter.com/haasonsaas"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Twitter size={18} />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-2/3">
                <div className="prose-custom max-w-none">
                  <h2 className="text-2xl font-display font-semibold mb-6">
                    About Me
                  </h2>
                  <p className="text-lg leading-relaxed mb-6">
                    I'm an AI evaluation and applied engineering leader who
                    specializes in making AI systems work reliably in
                    production. My approach combines rigorous testing
                    methodologies with real-world pragmatism—because what
                    matters isn't how sophisticated your models are, but how
                    well they solve actual problems.
                  </p>
                  <p className="mb-6">
                    My journey spans from security engineering at companies like
                    Snap and DoorDash to founding ThreatKey, where I pioneered
                    AI-powered compliance automation. Through building and
                    deploying multi-AI systems at scale, I've developed
                    frameworks for evaluating, orchestrating, and validating AI
                    outputs that prioritize reliability over complexity.
                  </p>
                  <p className="mb-6">
                    I believe in practical AI evaluation: component isolation,
                    interaction testing, and end-to-end validation. My work
                    focuses on the unglamorous but critical infrastructure—error
                    handling, state management, and human-in-the-loop workflows
                    that make AI systems actually useful.{' '}
                    <Link to="/ai" className="text-primary hover:underline">
                      Read more about my AI evaluation methodology →
                    </Link>
                  </p>
                </div>

                {/* Experience Section */}
                <div className="mb-12">
                  <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
                    <Briefcase size={24} />
                    Experience
                  </h2>
                  <div className="space-y-6">
                    {experiences.map((exp, index) => (
                      <Card
                        key={index}
                        className="p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {exp.role}
                            </h3>
                            <p className="text-primary font-medium">
                              {exp.company}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Calendar size={12} />
                            {exp.period}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">
                          {exp.description}
                        </p>
                        <ul className="space-y-1">
                          {exp.achievements.map((achievement, i) => (
                            <li
                              key={i}
                              className="text-sm flex items-start gap-2"
                            >
                              <ChevronRight
                                size={14}
                                className="text-primary mt-0.5 flex-shrink-0"
                              />
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Notable Positions & Recognition */}
                <div className="mb-12">
                  <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
                    <Award size={24} />
                    Recognition & Memberships
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            Forbes Technology Council
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Official Member (2022-2024)
                          </p>
                        </div>
                      </div>
                      <p className="text-sm">
                        Selected as an official member, contributing thought
                        leadership on security and AI topics.
                      </p>
                    </Card>
                    <Card className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            Multiple Startup Advisor
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            2017-Present
                          </p>
                        </div>
                      </div>
                      <p className="text-sm">
                        Advising early-stage startups on security, compliance,
                        and technical architecture.
                      </p>
                    </Card>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="mb-12">
                  <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
                    <Code2 size={24} />
                    Skills & Expertise
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {skills.map((skillGroup, index) => (
                      <Card key={index} className="p-6">
                        <h3 className="font-semibold mb-3 text-primary">
                          {skillGroup.category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {skillGroup.items.map((skill, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="font-normal"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Philosophy Section */}
                <div className="mb-12">
                  <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
                    <Rocket size={24} />
                    My Approach
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">
                        Test at Every Layer
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Component isolation, interaction validation, end-to-end
                        testing. Every layer matters for reliable AI.
                      </p>
                    </Card>
                    <Card className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">Humans in the Loop</h3>
                      <p className="text-sm text-muted-foreground">
                        AI amplifies human judgment, doesn't replace it. Keep
                        humans where they add the most value.
                      </p>
                    </Card>
                    <Card className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <Rocket className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">
                        Practical Over Perfect
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Simple systems that work beat complex ones that might.
                        Focus on boring infrastructure that scales.
                      </p>
                    </Card>
                  </div>
                </div>

                {/* Personal Section */}
                <div className="mb-12">
                  <h2 className="text-2xl font-display font-semibold mb-6">
                    Beyond Work
                  </h2>
                  <Card className="p-8 bg-muted/30">
                    <p className="text-lg leading-relaxed">
                      When I'm not building security tools, you'll find me
                      slow-walking San Francisco's 49-mile scenic route, cooking
                      dishes from my travels across 37 countries, or hosting
                      pizza nights featuring Doughvid—my temperamental but
                      talented sourdough starter. I believe the best ideas come
                      from diverse experiences, whether that's exploring a new
                      neighborhood, perfecting a recipe, or debugging code at 2
                      AM.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="border-t border-border pt-12 animate-fade-up">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl font-display font-semibold mb-6">
                Let's Connect
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you're tackling security challenges, building products
                that matter, or just want to swap stories about San Francisco's
                hidden gems, I'd love to hear from you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <a href="mailto:jonathan@haasonsaas.com">
                    <Mail className="mr-2" size={18} />
                    Email Me
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/blog">Read My Articles</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/ai">My AI Workflow</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
