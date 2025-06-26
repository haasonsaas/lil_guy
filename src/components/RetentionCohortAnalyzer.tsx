import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'

interface CohortData {
  cohort: string
  size: number
  month0: number
  month1: number
  month2: number
  month3: number
  month6: number
  month12: number
  ltv: number
  cac: number
}

interface RetentionScenario {
  name: string
  description: string
  baseRetention: {
    month1: number
    month2: number
    month3: number
    month6: number
    month12: number
  }
  churnProfile: 'early' | 'gradual' | 'late'
  cohortSize: number
  monthlyGrowth: number
}

interface RetentionMetrics {
  averageRetention: {
    month1: number
    month2: number
    month3: number
    month6: number
    month12: number
  }
  churnRate: number
  ltv: number
  paybackPeriod: number
  compoundedMRR: number
}

const RETENTION_SCENARIOS: RetentionScenario[] = [
  {
    name: 'B2B SaaS - Excellent',
    description: 'Well-established B2B SaaS with strong PMF',
    baseRetention: {
      month1: 95,
      month2: 87,
      month3: 82,
      month6: 75,
      month12: 70,
    },
    churnProfile: 'early',
    cohortSize: 100,
    monthlyGrowth: 15,
  },
  {
    name: 'B2B SaaS - Good',
    description: 'Growing B2B SaaS with decent retention',
    baseRetention: {
      month1: 90,
      month2: 78,
      month3: 70,
      month6: 60,
      month12: 55,
    },
    churnProfile: 'gradual',
    cohortSize: 80,
    monthlyGrowth: 20,
  },
  {
    name: 'B2B SaaS - Struggling',
    description: 'B2B SaaS with retention challenges',
    baseRetention: {
      month1: 80,
      month2: 65,
      month3: 55,
      month6: 40,
      month12: 30,
    },
    churnProfile: 'early',
    cohortSize: 60,
    monthlyGrowth: 25,
  },
  {
    name: 'Consumer App - High Engagement',
    description: 'Consumer app with strong engagement',
    baseRetention: {
      month1: 85,
      month2: 70,
      month3: 60,
      month6: 45,
      month12: 35,
    },
    churnProfile: 'early',
    cohortSize: 200,
    monthlyGrowth: 30,
  },
  {
    name: 'E-commerce - Repeat Buyers',
    description: 'E-commerce with repeat purchase behavior',
    baseRetention: {
      month1: 75,
      month2: 55,
      month3: 45,
      month6: 35,
      month12: 30,
    },
    churnProfile: 'late',
    cohortSize: 150,
    monthlyGrowth: 10,
  },
]

export default function RetentionCohortAnalyzer() {
  const [selectedScenario, setSelectedScenario] =
    useState<string>('b2b_saas_good')
  const [customRetention, setCustomRetention] = useState({
    month1: 90,
    month2: 78,
    month3: 70,
    month6: 60,
    month12: 55,
  })
  const [arpu, setArpu] = useState<number>(50) // Average Revenue Per User
  const [cac, setCac] = useState<number>(150) // Customer Acquisition Cost
  const [improvementRate, setImprovementRate] = useState<number>(0) // % improvement per month
  const [numberOfCohorts, setNumberOfCohorts] = useState<number>(12)
  const [useCustomData, setUseCustomData] = useState<boolean>(false)

  const currentScenario =
    RETENTION_SCENARIOS.find(
      (s) =>
        s.name.toLowerCase().replace(/[^a-z0-9]/g, '_') === selectedScenario
    ) || RETENTION_SCENARIOS[1]

  const activeRetention = useCustomData
    ? customRetention
    : currentScenario.baseRetention

  const cohortData = useMemo(() => {
    const data: CohortData[] = []
    const baseDate = new Date()

    for (let i = 0; i < numberOfCohorts; i++) {
      const cohortDate = new Date(baseDate)
      cohortDate.setMonth(cohortDate.getMonth() - i)

      // Apply improvement rate (later cohorts have better retention)
      const improvementFactor = 1 + (improvementRate / 100) * i

      // Calculate retention with improvement and some randomness for realism
      const month1 = Math.min(
        100,
        activeRetention.month1 * improvementFactor + (Math.random() - 0.5) * 2
      )
      const month2 = Math.min(
        month1,
        activeRetention.month2 * improvementFactor + (Math.random() - 0.5) * 3
      )
      const month3 = Math.min(
        month2,
        activeRetention.month3 * improvementFactor + (Math.random() - 0.5) * 3
      )
      const month6 = Math.min(
        month3,
        activeRetention.month6 * improvementFactor + (Math.random() - 0.5) * 4
      )
      const month12 = Math.min(
        month6,
        activeRetention.month12 * improvementFactor + (Math.random() - 0.5) * 5
      )

      // Calculate cohort size with growth
      const sizeMultiplier = Math.pow(
        1 + currentScenario.monthlyGrowth / 100,
        i
      )
      const cohortSize = Math.round(currentScenario.cohortSize * sizeMultiplier)

      // Calculate LTV based on retention curve
      const ltv = calculateLTV(month1, month2, month3, month6, month12, arpu)

      data.push({
        cohort: cohortDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        }),
        size: cohortSize,
        month0: 100,
        month1: Math.round(month1 * 100) / 100,
        month2: Math.round(month2 * 100) / 100,
        month3: Math.round(month3 * 100) / 100,
        month6: Math.round(month6 * 100) / 100,
        month12: Math.round(month12 * 100) / 100,
        ltv: Math.round(ltv * 100) / 100,
        cac: cac,
      })
    }

    return data.reverse() // Show oldest cohorts first
  }, [
    activeRetention,
    arpu,
    cac,
    improvementRate,
    numberOfCohorts,
    currentScenario,
  ])

  const calculateLTV = (
    m1: number,
    m2: number,
    m3: number,
    m6: number,
    m12: number,
    monthlyRevenue: number
  ): number => {
    // Simplified LTV calculation based on retention curve
    // Assumes exponential decay between measured points
    const avgLifetime = (m1 + m2 + m3 + m6 * 3 + m12 * 6) / 100 / 12 // Average months retained
    return avgLifetime * monthlyRevenue
  }

  const metrics = useMemo((): RetentionMetrics => {
    if (cohortData.length === 0) {
      return {
        averageRetention: {
          month1: 0,
          month2: 0,
          month3: 0,
          month6: 0,
          month12: 0,
        },
        churnRate: 0,
        ltv: 0,
        paybackPeriod: 0,
        compoundedMRR: 0,
      }
    }

    const avgRetention = {
      month1:
        cohortData.reduce((sum, cohort) => sum + cohort.month1, 0) /
        cohortData.length,
      month2:
        cohortData.reduce((sum, cohort) => sum + cohort.month2, 0) /
        cohortData.length,
      month3:
        cohortData.reduce((sum, cohort) => sum + cohort.month3, 0) /
        cohortData.length,
      month6:
        cohortData.reduce((sum, cohort) => sum + cohort.month6, 0) /
        cohortData.length,
      month12:
        cohortData.reduce((sum, cohort) => sum + cohort.month12, 0) /
        cohortData.length,
    }

    const avgLTV =
      cohortData.reduce((sum, cohort) => sum + cohort.ltv, 0) /
      cohortData.length
    const monthlyChurnRate = 100 - avgRetention.month1
    const paybackPeriod = cac / arpu

    // Calculate compounded MRR (how much revenue grows with retention improvements)
    const totalCustomers = cohortData.reduce(
      (sum, cohort) => sum + cohort.size,
      0
    )
    const weightedRetainedCustomers = cohortData.reduce(
      (sum, cohort) => sum + (cohort.size * cohort.month12) / 100,
      0
    )
    const compoundedMRR = weightedRetainedCustomers * arpu

    return {
      averageRetention: avgRetention,
      churnRate: monthlyChurnRate,
      ltv: avgLTV,
      paybackPeriod,
      compoundedMRR,
    }
  }, [cohortData, cac, arpu])

  const retentionCurveData = useMemo(() => {
    const avgData = [
      { month: 0, retention: 100, label: 'Month 0' },
      {
        month: 1,
        retention: metrics.averageRetention.month1,
        label: 'Month 1',
      },
      {
        month: 2,
        retention: metrics.averageRetention.month2,
        label: 'Month 2',
      },
      {
        month: 3,
        retention: metrics.averageRetention.month3,
        label: 'Month 3',
      },
      {
        month: 6,
        retention: metrics.averageRetention.month6,
        label: 'Month 6',
      },
      {
        month: 12,
        retention: metrics.averageRetention.month12,
        label: 'Month 12',
      },
    ]

    // Add improved scenario data for comparison
    const improvedData = avgData.map((point) => ({
      ...point,
      improvedRetention: point.retention * (1 + 0.05), // 5% improvement
    }))

    return avgData.map((point, index) => ({
      ...point,
      improvedRetention: improvedData[index].improvedRetention,
    }))
  }, [metrics])

  const getRetentionColor = (retention: number): string => {
    if (retention >= 80) return 'text-green-600'
    if (retention >= 60) return 'text-yellow-600'
    if (retention >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getRetentionBadgeColor = (
    retention: number
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (retention >= 80) return 'default'
    if (retention >= 60) return 'secondary'
    if (retention >= 40) return 'outline'
    return 'destructive'
  }

  const resetToScenario = () => {
    setUseCustomData(false)
    setCustomRetention(currentScenario.baseRetention)
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Retention Cohort Analyzer
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Analyze customer retention patterns across cohorts. Visualize how
            small retention improvements compound over time and impact your
            business metrics.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Table</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="arpu">
                    Average Revenue Per User (Monthly)
                  </Label>
                  <Input
                    id="arpu"
                    type="number"
                    value={arpu}
                    onChange={(e) => setArpu(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cac">Customer Acquisition Cost</Label>
                  <Input
                    id="cac"
                    type="number"
                    value={cac}
                    onChange={(e) => setCac(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Monthly Retention Improvement (%)</Label>
                  <Slider
                    value={[improvementRate]}
                    onValueChange={(value) => setImprovementRate(value[0])}
                    max={5}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>0%</span>
                    <span className="font-medium">{improvementRate}%</span>
                    <span>5%</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    How much retention improves each month (compound effect)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cohorts">Number of Cohorts</Label>
                  <Input
                    id="cohorts"
                    type="number"
                    value={numberOfCohorts}
                    onChange={(e) =>
                      setNumberOfCohorts(parseInt(e.target.value) || 1)
                    }
                    min="3"
                    max="24"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention Profile</CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedScenario}
                    onValueChange={setSelectedScenario}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RETENTION_SCENARIOS.map((scenario) => (
                        <SelectItem
                          key={scenario.name
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '_')}
                          value={scenario.name
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '_')}
                        >
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {useCustomData && (
                    <Button
                      onClick={resetToScenario}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {currentScenario.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Month 1 Retention (%)</Label>
                    <Input
                      type="number"
                      value={
                        useCustomData
                          ? customRetention.month1
                          : activeRetention.month1
                      }
                      onChange={(e) => {
                        setUseCustomData(true)
                        setCustomRetention({
                          ...customRetention,
                          month1: parseFloat(e.target.value) || 0,
                        })
                      }}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Month 2 Retention (%)</Label>
                    <Input
                      type="number"
                      value={
                        useCustomData
                          ? customRetention.month2
                          : activeRetention.month2
                      }
                      onChange={(e) => {
                        setUseCustomData(true)
                        setCustomRetention({
                          ...customRetention,
                          month2: parseFloat(e.target.value) || 0,
                        })
                      }}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Month 3 Retention (%)</Label>
                    <Input
                      type="number"
                      value={
                        useCustomData
                          ? customRetention.month3
                          : activeRetention.month3
                      }
                      onChange={(e) => {
                        setUseCustomData(true)
                        setCustomRetention({
                          ...customRetention,
                          month3: parseFloat(e.target.value) || 0,
                        })
                      }}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Month 6 Retention (%)</Label>
                    <Input
                      type="number"
                      value={
                        useCustomData
                          ? customRetention.month6
                          : activeRetention.month6
                      }
                      onChange={(e) => {
                        setUseCustomData(true)
                        setCustomRetention({
                          ...customRetention,
                          month6: parseFloat(e.target.value) || 0,
                        })
                      }}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Month 12 Retention (%)</Label>
                    <Input
                      type="number"
                      value={
                        useCustomData
                          ? customRetention.month12
                          : activeRetention.month12
                      }
                      onChange={(e) => {
                        setUseCustomData(true)
                        setCustomRetention({
                          ...customRetention,
                          month12: parseFloat(e.target.value) || 0,
                        })
                      }}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Table</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Each row represents a cohort of customers acquired in a specific
                month
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Cohort</th>
                      <th className="text-right p-2">Size</th>
                      <th className="text-right p-2 bg-green-50 dark:bg-green-900/20">
                        Month 0
                      </th>
                      <th className="text-right p-2 bg-blue-50 dark:bg-blue-900/20">
                        Month 1
                      </th>
                      <th className="text-right p-2 bg-blue-50 dark:bg-blue-900/20">
                        Month 2
                      </th>
                      <th className="text-right p-2 bg-blue-50 dark:bg-blue-900/20">
                        Month 3
                      </th>
                      <th className="text-right p-2 bg-blue-50 dark:bg-blue-900/20">
                        Month 6
                      </th>
                      <th className="text-right p-2 bg-blue-50 dark:bg-blue-900/20">
                        Month 12
                      </th>
                      <th className="text-right p-2 bg-purple-50 dark:bg-purple-900/20">
                        LTV
                      </th>
                      <th className="text-right p-2 bg-orange-50 dark:bg-orange-900/20">
                        LTV/CAC
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map((cohort, index) => (
                      <tr
                        key={index}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="p-2 font-medium">{cohort.cohort}</td>
                        <td className="text-right p-2">
                          {cohort.size.toLocaleString()}
                        </td>
                        <td className="text-right p-2 bg-green-50 dark:bg-green-900/20 font-medium">
                          {cohort.month0}%
                        </td>
                        <td
                          className={`text-right p-2 bg-blue-50 dark:bg-blue-900/20 font-medium ${getRetentionColor(cohort.month1)}`}
                        >
                          {cohort.month1}%
                        </td>
                        <td
                          className={`text-right p-2 bg-blue-50 dark:bg-blue-900/20 font-medium ${getRetentionColor(cohort.month2)}`}
                        >
                          {cohort.month2}%
                        </td>
                        <td
                          className={`text-right p-2 bg-blue-50 dark:bg-blue-900/20 font-medium ${getRetentionColor(cohort.month3)}`}
                        >
                          {cohort.month3}%
                        </td>
                        <td
                          className={`text-right p-2 bg-blue-50 dark:bg-blue-900/20 font-medium ${getRetentionColor(cohort.month6)}`}
                        >
                          {cohort.month6}%
                        </td>
                        <td
                          className={`text-right p-2 bg-blue-50 dark:bg-blue-900/20 font-medium ${getRetentionColor(cohort.month12)}`}
                        >
                          {cohort.month12}%
                        </td>
                        <td className="text-right p-2 bg-purple-50 dark:bg-purple-900/20 font-medium">
                          ${cohort.ltv}
                        </td>
                        <td className="text-right p-2 bg-orange-50 dark:bg-orange-900/20 font-medium">
                          <Badge
                            variant={
                              cohort.ltv / cohort.cac >= 3
                                ? 'default'
                                : cohort.ltv / cohort.cac >= 1
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {(cohort.ltv / cohort.cac).toFixed(1)}x
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Monthly Churn</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {metrics.churnRate.toFixed(1)}%
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Avg LTV</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${metrics.ltv.toFixed(0)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">LTV/CAC</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {(metrics.ltv / cac).toFixed(1)}x
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Payback Period</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {metrics.paybackPeriod.toFixed(1)}m
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Retention Curve</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Average retention across all cohorts with 5% improvement
                  scenario
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={retentionCurveData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      label={{
                        value: 'Months',
                        position: 'insideBottom',
                        offset: -10,
                      }}
                    />
                    <YAxis
                      label={{
                        value: 'Retention %',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)}%`,
                        name === 'retention'
                          ? 'Current'
                          : 'With 5% Improvement',
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="retention"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Current Retention"
                    />
                    <Line
                      type="monotone"
                      dataKey="improvedRetention"
                      stroke="#10b981"
                      strokeDasharray="5 5"
                      name="5% Improvement"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Retention Health Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-lg border ${metrics.averageRetention.month1 >= 85 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : metrics.averageRetention.month1 >= 70 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {metrics.averageRetention.month1 >= 85 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <h4 className="font-medium">Month 1 Retention</h4>
                  </div>
                  <p className="text-2xl font-bold">
                    {metrics.averageRetention.month1.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {metrics.averageRetention.month1 >= 85
                      ? 'Excellent'
                      : metrics.averageRetention.month1 >= 70
                        ? 'Good'
                        : 'Needs Improvement'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border ${metrics.ltv / cac >= 3 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : metrics.ltv / cac >= 1 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {metrics.ltv / cac >= 3 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <h4 className="font-medium">Unit Economics</h4>
                  </div>
                  <p className="text-2xl font-bold">
                    {(metrics.ltv / cac).toFixed(1)}x
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {metrics.ltv / cac >= 3
                      ? 'Healthy'
                      : metrics.ltv / cac >= 1
                        ? 'Marginal'
                        : 'Unprofitable'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border ${metrics.paybackPeriod <= 12 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : metrics.paybackPeriod <= 24 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {metrics.paybackPeriod <= 12 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <h4 className="font-medium">Payback Period</h4>
                  </div>
                  <p className="text-2xl font-bold">
                    {metrics.paybackPeriod.toFixed(1)} months
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {metrics.paybackPeriod <= 12
                      ? 'Fast'
                      : metrics.paybackPeriod <= 24
                        ? 'Moderate'
                        : 'Slow'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Retention Improvement Impact</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                See how small retention improvements compound over time
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 5].map((improvement) => {
                  const improvedLTV = metrics.ltv * (1 + improvement / 100)
                  const improvedLTVCAC = improvedLTV / cac
                  const revenueIncrease =
                    ((improvedLTV - metrics.ltv) / metrics.ltv) * 100

                  return (
                    <Card key={improvement}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          +{improvement}% Retention
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            New LTV
                          </div>
                          <div className="text-xl font-bold text-green-600">
                            ${improvedLTV.toFixed(0)}
                          </div>
                          <div className="text-xs text-green-600">
                            +{revenueIncrease.toFixed(1)}% revenue
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            New LTV/CAC
                          </div>
                          <div className="text-xl font-bold text-blue-600">
                            {improvedLTVCAC.toFixed(1)}x
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="text-xs text-gray-500">
                            Annual impact on{' '}
                            {cohortData
                              .reduce((sum, c) => sum + c.size, 0)
                              .toLocaleString()}{' '}
                            customers:
                          </div>
                          <div className="text-lg font-bold text-purple-600">
                            +$
                            {(
                              (improvedLTV - metrics.ltv) *
                              cohortData.reduce((sum, c) => sum + c.size, 0)
                            ).toLocaleString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                  Key Insights & Recommendations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium mb-2">Focus Areas:</h5>
                    <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                      {metrics.averageRetention.month1 < 80 && (
                        <li>• Improve onboarding to reduce early churn</li>
                      )}
                      {metrics.averageRetention.month3 < 70 && (
                        <li>
                          • Enhance product value realization in first 90 days
                        </li>
                      )}
                      {metrics.ltv / cac < 3 && (
                        <li>• Optimize unit economics - retention is key</li>
                      )}
                      {metrics.paybackPeriod > 12 && (
                        <li>• Reduce time to value for faster payback</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Quick Wins:</h5>
                    <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                      <li>
                        • A 1% retention improvement ={' '}
                        {(
                          metrics.ltv *
                          0.01 *
                          cohortData.reduce((sum, c) => sum + c.size, 0)
                        ).toLocaleString()}{' '}
                        annual value
                      </li>
                      <li>• Focus on month 1-3 retention for maximum impact</li>
                      <li>• Monitor cohort trends for early warning signs</li>
                      <li>
                        • Retention improvements compound over customer lifetime
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
