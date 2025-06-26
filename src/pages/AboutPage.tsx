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

const experiences = [
  {
    role: 'Security & AI',
    company: 'Compliance automation company',
    period: 'Oct 2024 - Present',
    description: 'Joined via ThreatKey',
    achievements: ["🤫 Can't say yet", 'Stay tuned for updates'],
  },
  {
    role: 'Co-founder & CEO',
    company: 'ThreatKey',
    period: 'Oct 2020 - Oct 2024',
    description: 'Led cybersecurity startup from founding through exit',
    achievements: [
      'Raised $5M in venture funding',
      'Built and scaled to $XXXK ARR',
      'Created AI-powered compliance automation platform',
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
    category: 'Security & AI Engineering',
    items: [
      'Security Operations',
      'AI/ML Systems',
      'LangChain',
      'Vector Databases',
      'Compliance Automation',
      'Threat Detection',
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
    category: 'Engineering',
    items: [
      'Python',
      'TypeScript',
      'Machine Learning',
      'Security Automation',
      'DevSecOps',
      'Infrastructure as Code',
    ],
  },
  {
    category: 'Leadership',
    items: [
      'Technical Vision',
      'Cross-functional Leadership',
      'Strategic Planning',
      'Open Source Strategy',
      'Team Building',
    ],
  },
]

export default function AboutPage() {
  return (
    <Layout>
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
                      Security & Applied AI Engineering Leader
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
                    I'm a security and applied AI engineering leader who builds
                    systems that scale. With deep experience in security
                    automation and enterprise software, I focus on creating
                    tools and platforms that solve real problems for real users.
                  </p>
                  <p className="mb-6">
                    My journey spans from engineering at companies like Snap and
                    DoorDash to founding and leading ThreatKey through exit. I
                    believe the best technology feels invisible— it just works,
                    enabling people to focus on what matters most.
                  </p>
                  <p className="mb-6">
                    These days, I'm deeply interested in how AI can augment
                    human capabilities without replacing human judgment. I use
                    tools like Claude Code as development partners, treating
                    them as senior team members who help with everything from
                    complex implementations to creative problem-solving.{' '}
                    <Link to="/ai" className="text-primary hover:underline">
                      Read more about my AI workflow →
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
                        Start with Edge Cases
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        The edge cases reveal the real job. Understanding
                        exceptions leads to better systems.
                      </p>
                    </Card>
                    <Card className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">Design for Humans</h3>
                      <p className="text-sm text-muted-foreground">
                        Complexity doesn't have to feel complicated. Great tools
                        feel invisible.
                      </p>
                    </Card>
                    <Card className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <Rocket className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">Balance Precision</h3>
                      <p className="text-sm text-muted-foreground">
                        Perfect is the enemy of done. Ship fast, iterate faster,
                        maintain quality.
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
