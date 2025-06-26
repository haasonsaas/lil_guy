import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Target,
  Users,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

interface PMFQuestion {
  id: string
  category: 'retention' | 'satisfaction' | 'growth' | 'market'
  question: string
  options: {
    value: number
    label: string
    description?: string
  }[]
  weight: number
}

interface PMFScores {
  retention: number
  satisfaction: number
  growth: number
  market: number
  overall: number
}

const questions: PMFQuestion[] = [
  {
    id: 'sean_ellis',
    category: 'satisfaction',
    question: 'How would you feel if you could no longer use our product?',
    options: [
      {
        value: 100,
        label: 'Very disappointed',
        description: 'Strong PMF signal',
      },
      {
        value: 60,
        label: 'Somewhat disappointed',
        description: 'Moderate PMF',
      },
      { value: 20, label: 'Not disappointed', description: 'Weak PMF' },
      { value: 0, label: 'N/A - I no longer use it', description: 'No PMF' },
    ],
    weight: 0.25,
  },
  {
    id: 'nps_score',
    category: 'satisfaction',
    question: 'How likely are you to recommend us to a friend or colleague?',
    options: [
      {
        value: 100,
        label: '9-10 (Promoters)',
        description: 'Love the product',
      },
      {
        value: 50,
        label: '7-8 (Passives)',
        description: 'Satisfied but not enthusiastic',
      },
      {
        value: 0,
        label: '0-6 (Detractors)',
        description: 'Unlikely to recommend',
      },
    ],
    weight: 0.15,
  },
  {
    id: 'usage_frequency',
    category: 'retention',
    question: 'How often do your users engage with your product?',
    options: [
      {
        value: 100,
        label: 'Daily or multiple times per day',
        description: 'High engagement',
      },
      { value: 75, label: 'Weekly', description: 'Good engagement' },
      { value: 40, label: 'Monthly', description: 'Moderate engagement' },
      {
        value: 10,
        label: 'Rarely or sporadically',
        description: 'Low engagement',
      },
    ],
    weight: 0.2,
  },
  {
    id: 'churn_rate',
    category: 'retention',
    question: 'What is your monthly customer churn rate?',
    options: [
      { value: 100, label: 'Under 2%', description: 'Excellent retention' },
      { value: 75, label: '2-5%', description: 'Good retention' },
      { value: 40, label: '5-10%', description: 'Moderate retention' },
      { value: 10, label: 'Over 10%', description: 'Poor retention' },
    ],
    weight: 0.2,
  },
  {
    id: 'growth_channel',
    category: 'growth',
    question:
      'What percentage of new customers come from word-of-mouth/referrals?',
    options: [
      { value: 100, label: 'Over 40%', description: 'Strong organic growth' },
      { value: 75, label: '20-40%', description: 'Good organic growth' },
      { value: 50, label: '10-20%', description: 'Some organic growth' },
      { value: 20, label: 'Under 10%', description: 'Paid growth dependent' },
    ],
    weight: 0.15,
  },
  {
    id: 'market_size',
    category: 'market',
    question: 'How large is your addressable market opportunity?',
    options: [
      {
        value: 100,
        label: 'Massive market (>$10B TAM)',
        description: 'Huge opportunity',
      },
      {
        value: 80,
        label: 'Large market ($1-10B TAM)',
        description: 'Significant opportunity',
      },
      {
        value: 60,
        label: 'Medium market ($100M-1B TAM)',
        description: 'Good opportunity',
      },
      {
        value: 30,
        label: 'Small market (<$100M TAM)',
        description: 'Limited opportunity',
      },
    ],
    weight: 0.05,
  },
]

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  if (score >= 40) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

const getScoreBadgeColor = (score: number): string => {
  if (score >= 80)
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  if (score >= 60)
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  if (score >= 40)
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
}

const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Strong PMF'
  if (score >= 60) return 'Moderate PMF'
  if (score >= 40) return 'Weak PMF'
  return 'No PMF'
}

const CategoryCard = ({
  title,
  score,
  icon: Icon,
  description,
}: {
  title: string
  score: number
  icon: React.ElementType
  description: string
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <Badge className={getScoreBadgeColor(score)}>
            {Math.round(score)}/100
          </Badge>
        </div>
        <Progress value={score} className="mb-2" />
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function ProductMarketFitScorer() {
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [scores, setScores] = useState<PMFScores>({
    retention: 0,
    satisfaction: 0,
    growth: 0,
    market: 0,
    overall: 0,
  })

  const calculateScores = useCallback(() => {
    const categoryScores = {
      retention: 0,
      satisfaction: 0,
      growth: 0,
      market: 0,
    }

    const categoryWeights = {
      retention: 0,
      satisfaction: 0,
      growth: 0,
      market: 0,
    }

    let totalWeight = 0
    let weightedSum = 0

    questions.forEach((question) => {
      const response = responses[question.id]
      if (response !== undefined) {
        categoryScores[question.category] += response * question.weight
        categoryWeights[question.category] += question.weight
        weightedSum += response * question.weight
        totalWeight += question.weight
      }
    })

    // Calculate category averages
    Object.keys(categoryScores).forEach((category) => {
      const cat = category as keyof typeof categoryScores
      if (categoryWeights[cat] > 0) {
        categoryScores[cat] = categoryScores[cat] / categoryWeights[cat]
      }
    })

    const overall = totalWeight > 0 ? weightedSum / totalWeight : 0

    setScores({
      ...categoryScores,
      overall,
    })
  }, [responses])

  useEffect(() => {
    calculateScores()
  }, [calculateScores])

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: parseInt(value),
    }))
  }

  const completedQuestions = Object.keys(responses).length
  const totalQuestions = questions.length
  const completionRate = (completedQuestions / totalQuestions) * 100

  const getInsights = () => {
    const insights = []

    if (scores.overall >= 80) {
      insights.push({
        type: 'success',
        title: 'Strong Product-Market Fit',
        message:
          'You have strong PMF signals. Focus on scaling growth and maintaining quality.',
      })
    } else if (scores.overall >= 60) {
      insights.push({
        type: 'warning',
        title: 'Moderate Product-Market Fit',
        message:
          "You're on the right track but need improvements in key areas.",
      })
    } else if (scores.overall >= 40) {
      insights.push({
        type: 'error',
        title: 'Weak Product-Market Fit',
        message:
          'Significant changes needed. Consider pivoting or major product improvements.',
      })
    } else {
      insights.push({
        type: 'error',
        title: 'No Product-Market Fit',
        message:
          'Major product changes or pivot required. Focus on customer development.',
      })
    }

    // Category-specific insights
    if (scores.satisfaction < 50) {
      insights.push({
        type: 'error',
        title: 'Low Customer Satisfaction',
        message:
          'Focus on understanding customer needs and improving core value proposition.',
      })
    }

    if (scores.retention < 50) {
      insights.push({
        type: 'error',
        title: 'Poor Retention',
        message:
          "Users aren't sticking around. Improve onboarding and core product experience.",
      })
    }

    if (scores.growth < 50) {
      insights.push({
        type: 'warning',
        title: 'Limited Organic Growth',
        message:
          "Low word-of-mouth growth suggests product isn't compelling enough to share.",
      })
    }

    return insights
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Product-Market Fit Scorer</h2>
        <p className="text-muted-foreground">
          Assess your product-market fit across key dimensions. Based on proven
          PMF frameworks.
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Assessment Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedQuestions}/{totalQuestions} questions
            </span>
          </div>
          <Progress value={completionRate} />
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-lg">{question.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={responses[question.id]?.toString() || ''}
                onValueChange={(value) =>
                  handleResponseChange(question.id, value)
                }
              >
                {question.options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <RadioGroupItem
                      value={option.value.toString()}
                      id={`${question.id}-${option.value}`}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`${question.id}-${option.value}`}
                        className="cursor-pointer"
                      >
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        )}
                      </Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      {completedQuestions > 0 && (
        <>
          <Separator />

          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Overall Product-Market Fit Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div
                  className={`text-6xl font-bold mb-2 ${getScoreColor(scores.overall)}`}
                >
                  {Math.round(scores.overall)}
                </div>
                <Badge
                  className={`text-lg py-1 px-3 ${getScoreBadgeColor(scores.overall)}`}
                >
                  {getScoreLabel(scores.overall)}
                </Badge>
              </div>
              <Progress value={scores.overall} className="h-3" />
            </CardContent>
          </Card>

          {/* Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CategoryCard
              title="Customer Satisfaction"
              score={scores.satisfaction}
              icon={Heart}
              description="How much customers love your product"
            />
            <CategoryCard
              title="User Retention"
              score={scores.retention}
              icon={Users}
              description="How well you keep customers engaged"
            />
            <CategoryCard
              title="Organic Growth"
              score={scores.growth}
              icon={TrendingUp}
              description="Word-of-mouth and referral strength"
            />
            <CategoryCard
              title="Market Opportunity"
              score={scores.market}
              icon={Target}
              description="Size of addressable market"
            />
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Key Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getInsights().map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      insight.type === 'success'
                        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                        : insight.type === 'warning'
                          ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
                          : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {insight.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                      )}
                      <div>
                        <h4
                          className={`font-semibold mb-1 ${
                            insight.type === 'success'
                              ? 'text-green-800 dark:text-green-300'
                              : insight.type === 'warning'
                                ? 'text-yellow-800 dark:text-yellow-300'
                                : 'text-red-800 dark:text-red-300'
                          }`}
                        >
                          {insight.title}
                        </h4>
                        <p
                          className={`text-sm ${
                            insight.type === 'success'
                              ? 'text-green-700 dark:text-green-300'
                              : insight.type === 'warning'
                                ? 'text-yellow-700 dark:text-yellow-300'
                                : 'text-red-700 dark:text-red-300'
                          }`}
                        >
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {scores.overall >= 70 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-300">
                      🚀 <strong>Scale with confidence:</strong> Your PMF
                      signals are strong enough to invest in growth channels and
                      team expansion.
                    </p>
                  </div>
                )}

                {scores.overall >= 50 && scores.overall < 70 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-300">
                      🔧 <strong>Optimize core metrics:</strong> Focus on
                      improving weak areas before scaling. Run more customer
                      interviews.
                    </p>
                  </div>
                )}

                {scores.overall < 50 && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-300">
                      ⚠️ <strong>Back to customer development:</strong> Don't
                      scale yet. Deeply understand customer problems and iterate
                      on core value prop.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
