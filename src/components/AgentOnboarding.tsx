import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Copy,
  Check,
  Play,
  ChevronRight,
  Zap,
  Search,
  Calculator,
  FileText,
} from 'lucide-react'

interface Step {
  id: number
  title: string
  description: string
  action: 'demo' | 'copy' | 'learn'
  endpoint?: string
  example?: string
  expected?: Record<string, unknown>
}

const onboardingSteps: Step[] = [
  {
    id: 1,
    title: 'Discover Available Capabilities',
    description:
      'Get a comprehensive overview of all AI-agent-friendly features and APIs',
    action: 'demo',
    endpoint: '/api/capabilities',
    example: 'curl https://haasonsaas.com/api/capabilities',
    expected: {
      site: { name: 'Jonathan Haas Blog', description: 'Startup advice...' },
      capabilities: ['Blog Content Access', 'Interactive Calculators', '...'],
    },
  },
  {
    id: 2,
    title: 'Search Blog Content',
    description:
      'Find relevant articles using intelligent search with relevance scoring',
    action: 'demo',
    endpoint: '/api/search?q=technical+debt&limit=3',
    example:
      'curl "https://haasonsaas.com/api/search?q=technical+debt&limit=3"',
    expected: {
      query: 'technical debt',
      results: [
        { title: 'The Hidden Costs of Technical Debt', relevance: 0.95 },
      ],
      totalResults: 1,
    },
  },
  {
    id: 3,
    title: 'Get Personalized Recommendations',
    description:
      'Receive content recommendations tailored to specific roles and interests',
    action: 'demo',
    endpoint: '/api/recommendations?role=founder&topic=technical-leadership',
    example:
      'curl "https://haasonsaas.com/api/recommendations?role=founder&topic=technical-leadership"',
    expected: {
      role: 'founder',
      recommendations: [
        { title: 'The Hidden Costs of Technical Debt', priority: 'high' },
      ],
    },
  },
  {
    id: 4,
    title: 'Access Interactive Tools',
    description: 'Explore business calculators and decision-making frameworks',
    action: 'learn',
    endpoint: '/calculators',
    example: 'Visit /posts/new-series-a-reality for SaaS metrics dashboard',
    expected: {
      message: 'Interactive calculators embedded in relevant blog posts',
    },
  },
]

export default function AgentOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [demoResults, setDemoResults] = useState<Record<number, unknown>>({})
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState<Record<number, boolean>>({})

  const copyToClipboard = async (text: string, stepId: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied((prev) => ({ ...prev, [stepId]: true }))
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [stepId]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const runDemo = async (step: Step) => {
    if (!step.endpoint) return

    setLoading((prev) => ({ ...prev, [step.id]: true }))

    try {
      const response = await fetch(`https://haasonsaas.com${step.endpoint}`)
      const data = await response.json()
      setDemoResults((prev) => ({ ...prev, [step.id]: data }))

      // Mark step as completed
      setCompletedSteps((prev) => [...prev, step.id])
    } catch (error) {
      setDemoResults((prev) => ({
        ...prev,
        [step.id]: {
          error: 'Failed to fetch data. This is expected in development mode.',
        },
      }))
    } finally {
      setLoading((prev) => ({ ...prev, [step.id]: false }))
    }
  }

  const markStepComplete = (stepId: number) => {
    setCompletedSteps((prev) => [...prev, stepId])
  }

  const progress = (completedSteps.length / onboardingSteps.length) * 100

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-purple-600" />
            <CardTitle className="text-xl text-purple-900">
              AI Agent Quick Start
            </CardTitle>
          </div>
          <CardDescription className="text-purple-700">
            Learn how to programmatically access content, tools, and
            recommendations
          </CardDescription>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-purple-600 mb-2">
              <span>Progress</span>
              <span>
                {completedSteps.length}/{onboardingSteps.length} completed
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {onboardingSteps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = completedSteps.includes(step.id)
          const canAccess = index <= currentStep

          return (
            <Card
              key={step.id}
              className={`transition-all duration-300 ${
                isActive ? 'ring-2 ring-blue-500 shadow-lg' : ''
              } ${isCompleted ? 'bg-green-50 border-green-200' : ''} ${
                !canAccess ? 'opacity-50' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {step.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={isCompleted ? 'default' : 'outline'}>
                    {step.action === 'demo'
                      ? 'Interactive'
                      : step.action === 'copy'
                        ? 'Copy'
                        : 'Explore'}
                  </Badge>
                </div>
              </CardHeader>

              {canAccess && (
                <CardContent className="space-y-4">
                  {step.example && (
                    <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">Example:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(step.example!, step.id)
                          }
                          className="h-6 px-2 text-gray-400 hover:text-white"
                        >
                          {copied[step.id] ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <code>{step.example}</code>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {step.action === 'demo' && (
                      <Button
                        onClick={() => runDemo(step)}
                        disabled={loading[step.id]}
                        className="flex items-center space-x-2"
                      >
                        <Play className="h-4 w-4" />
                        <span>
                          {loading[step.id] ? 'Running...' : 'Try It Live'}
                        </span>
                      </Button>
                    )}

                    {step.action === 'learn' && (
                      <Button
                        onClick={() => markStepComplete(step.id)}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Mark as Completed</span>
                      </Button>
                    )}

                    {!isCompleted && isActive && (
                      <Button
                        onClick={() =>
                          setCurrentStep((prev) =>
                            Math.min(prev + 1, onboardingSteps.length - 1)
                          )
                        }
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <span>Next Step</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {demoResults[step.id] && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Live Response:
                      </h4>
                      <div className="bg-gray-50 p-3 rounded border max-h-40 overflow-auto">
                        <pre className="text-xs text-gray-600">
                          {JSON.stringify(demoResults[step.id], null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {progress === 100 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Onboarding Complete!
            </h3>
            <p className="text-green-700 mb-4">
              You're now ready to build AI agents that can effectively interact
              with this site.
            </p>
            <div className="flex justify-center space-x-4">
              <Button className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Start Building</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Explore Tools</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
