import React, { useState, useEffect, useMemo } from 'react'
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
  BarChart,
  Bar,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Code,
  Clock,
  Target,
  Zap,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

interface TechnicalDebtItem {
  id: string
  category:
    | 'architecture'
    | 'code_quality'
    | 'documentation'
    | 'testing'
    | 'infrastructure'
  severity: 'low' | 'medium' | 'high' | 'critical'
  effortToFix: number // hours
  velocityImpact: number // percentage reduction
  accumulationRate: number // how fast it grows if ignored
  description: string
}

interface TeamMetrics {
  teamSize: number
  sprintLength: number // weeks
  storiesPerSprint: number
  avgStoryPoints: number
  hoursPerStoryPoint: number
  codeReviewTime: number // hours per story
  bugFixTime: number // percentage of sprint capacity
  meetingOverhead: number // percentage of time
}

interface VelocityData {
  sprint: number
  idealVelocity: number
  actualVelocity: number
  debtImpact: number
  cumulative: number
  timeToMarket: number
}

interface DebtScenario {
  name: string
  description: string
  debtItems: TechnicalDebtItem[]
}

const DEBT_SCENARIOS: DebtScenario[] = [
  {
    name: 'Startup MVP',
    description: 'Fast moving startup with minimal process',
    debtItems: [
      {
        id: 'mvp_tests',
        category: 'testing',
        severity: 'high',
        effortToFix: 120,
        velocityImpact: 15,
        accumulationRate: 2,
        description: 'Limited test coverage, manual testing required',
      },
      {
        id: 'mvp_docs',
        category: 'documentation',
        severity: 'medium',
        effortToFix: 40,
        velocityImpact: 8,
        accumulationRate: 1.5,
        description: 'Minimal documentation, knowledge in heads',
      },
    ],
  },
  {
    name: 'Scale-up Pressure',
    description: 'Growing company with feature pressure',
    debtItems: [
      {
        id: 'scale_architecture',
        category: 'architecture',
        severity: 'critical',
        effortToFix: 400,
        velocityImpact: 25,
        accumulationRate: 3,
        description: 'Monolithic architecture reaching limits',
      },
      {
        id: 'scale_code',
        category: 'code_quality',
        severity: 'high',
        effortToFix: 200,
        velocityImpact: 18,
        accumulationRate: 2.5,
        description: 'Copy-paste code, inconsistent patterns',
      },
      {
        id: 'scale_infra',
        category: 'infrastructure',
        severity: 'medium',
        effortToFix: 80,
        velocityImpact: 12,
        accumulationRate: 2,
        description: 'Manual deployments, no monitoring',
      },
    ],
  },
  {
    name: 'Legacy Maintenance',
    description: 'Mature product with accumulated debt',
    debtItems: [
      {
        id: 'legacy_architecture',
        category: 'architecture',
        severity: 'critical',
        effortToFix: 800,
        velocityImpact: 35,
        accumulationRate: 1,
        description: 'Legacy system, tightly coupled',
      },
      {
        id: 'legacy_tests',
        category: 'testing',
        severity: 'critical',
        effortToFix: 300,
        velocityImpact: 20,
        accumulationRate: 1.5,
        description: 'Brittle tests, flaky CI/CD',
      },
      {
        id: 'legacy_docs',
        category: 'documentation',
        severity: 'high',
        effortToFix: 150,
        velocityImpact: 15,
        accumulationRate: 1,
        description: 'Outdated documentation, tribal knowledge',
      },
    ],
  },
]

export default function EngineeringVelocityTracker() {
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics>({
    teamSize: 6,
    sprintLength: 2,
    storiesPerSprint: 12,
    avgStoryPoints: 5,
    hoursPerStoryPoint: 4,
    codeReviewTime: 2,
    bugFixTime: 15,
    meetingOverhead: 20,
  })

  const [selectedScenario, setSelectedScenario] = useState<string>('startup')
  const [customDebtItems, setCustomDebtItems] = useState<TechnicalDebtItem[]>(
    []
  )
  const [timeHorizon, setTimeHorizon] = useState<number>(12) // sprints
  const [debtPaydownRate, setDebtPaydownRate] = useState<number>(20) // percentage of capacity

  const currentScenario =
    DEBT_SCENARIOS.find(
      (s) =>
        s.name.toLowerCase().replace(' ', '_').replace('-', '_') ===
        selectedScenario
    ) || DEBT_SCENARIOS[0]

  const allDebtItems = useMemo(() => {
    return [...currentScenario.debtItems, ...customDebtItems]
  }, [currentScenario.debtItems, customDebtItems])

  const velocityProjection = useMemo(() => {
    const data: VelocityData[] = []
    const totalHoursPerSprint =
      teamMetrics.teamSize * teamMetrics.sprintLength * 40 // 40 hours per week
    const effectiveHours =
      totalHoursPerSprint *
      (1 - teamMetrics.meetingOverhead / 100) *
      (1 - teamMetrics.bugFixTime / 100)
    const baseVelocity = effectiveHours / teamMetrics.hoursPerStoryPoint

    let cumulativeDebtImpact = 0

    for (let sprint = 0; sprint <= timeHorizon; sprint++) {
      // Calculate current debt impact
      const currentDebtImpact = allDebtItems.reduce((total, item) => {
        const sprintsSinceStart = Math.max(0, sprint)
        const growthFactor =
          1 + (item.accumulationRate / 100) * sprintsSinceStart
        return total + item.velocityImpact * growthFactor
      }, 0)

      // Apply debt paydown if capacity is allocated
      const paydownEffect = sprint > 0 ? (debtPaydownRate / 100) * 2 : 0 // 2% reduction per sprint per 1% capacity
      const netDebtImpact = Math.max(
        0,
        currentDebtImpact - paydownEffect * sprint
      )

      cumulativeDebtImpact = netDebtImpact

      const actualVelocity = Math.max(
        0,
        baseVelocity * (1 - Math.min(0.8, cumulativeDebtImpact / 100))
      )
      const velocityLoss = baseVelocity - actualVelocity

      // Time to market calculation (cumulative feature delivery)
      const cumulativeFeatures =
        sprint === 0 ? 0 : data[sprint - 1].cumulative + actualVelocity

      data.push({
        sprint,
        idealVelocity: baseVelocity,
        actualVelocity,
        debtImpact: cumulativeDebtImpact,
        cumulative: cumulativeFeatures,
        timeToMarket: cumulativeFeatures > 0 ? 100 / cumulativeFeatures : 0,
      })
    }

    return data
  }, [teamMetrics, allDebtItems, timeHorizon, debtPaydownRate])

  const insights = useMemo(() => {
    const finalSprint = velocityProjection[velocityProjection.length - 1]
    const initialVelocity = velocityProjection[0].idealVelocity
    const finalVelocity = finalSprint.actualVelocity
    const velocityLoss =
      ((initialVelocity - finalVelocity) / initialVelocity) * 100

    const totalDebtEffort = allDebtItems.reduce(
      (sum, item) => sum + item.effortToFix,
      0
    )
    const sprintsToPayDebt = Math.ceil(
      totalDebtEffort /
        (teamMetrics.teamSize *
          teamMetrics.sprintLength *
          40 *
          (debtPaydownRate / 100))
    )

    const criticalDebt = allDebtItems.filter(
      (item) => item.severity === 'critical'
    )
    const highDebt = allDebtItems.filter((item) => item.severity === 'high')

    return {
      velocityLoss: Math.round(velocityLoss),
      totalDebtHours: totalDebtEffort,
      sprintsToPayDebt,
      criticalIssues: criticalDebt.length,
      highIssues: highDebt.length,
      worstCategory:
        allDebtItems.reduce(
          (worst, item) =>
            item.velocityImpact > worst.velocityImpact ? item : worst,
          allDebtItems[0]
        )?.category || 'none',
    }
  }, [velocityProjection, allDebtItems, teamMetrics, debtPaydownRate])

  const addCustomDebtItem = () => {
    const newItem: TechnicalDebtItem = {
      id: `custom_${Date.now()}`,
      category: 'code_quality',
      severity: 'medium',
      effortToFix: 40,
      velocityImpact: 10,
      accumulationRate: 1.5,
      description: 'Custom technical debt item',
    }
    setCustomDebtItems([...customDebtItems, newItem])
  }

  const removeCustomDebtItem = (id: string) => {
    setCustomDebtItems(customDebtItems.filter((item) => item.id !== id))
  }

  const updateCustomDebtItem = (
    id: string,
    updates: Partial<TechnicalDebtItem>
  ) => {
    setCustomDebtItems(
      customDebtItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'architecture':
        return <Target className="w-4 h-4" />
      case 'code_quality':
        return <Code className="w-4 h-4" />
      case 'testing':
        return <CheckCircle className="w-4 h-4" />
      case 'documentation':
        return <AlertCircle className="w-4 h-4" />
      case 'infrastructure':
        return <Zap className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Engineering Velocity Tracker
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Model how technical debt impacts your team's delivery velocity over
            time. Understand the compound effects and plan debt paydown
            strategies.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Team Setup</TabsTrigger>
          <TabsTrigger value="debt">Technical Debt</TabsTrigger>
          <TabsTrigger value="analysis">Velocity Analysis</TabsTrigger>
          <TabsTrigger value="strategy">Paydown Strategy</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Configuration</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Configure your team's baseline metrics
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Input
                    id="teamSize"
                    type="number"
                    value={teamMetrics.teamSize}
                    onChange={(e) =>
                      setTeamMetrics({
                        ...teamMetrics,
                        teamSize: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    max="20"
                  />
                  <p className="text-xs text-gray-500">Number of engineers</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sprintLength">Sprint Length (weeks)</Label>
                  <Input
                    id="sprintLength"
                    type="number"
                    value={teamMetrics.sprintLength}
                    onChange={(e) =>
                      setTeamMetrics({
                        ...teamMetrics,
                        sprintLength: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    max="4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storiesPerSprint">Stories per Sprint</Label>
                  <Input
                    id="storiesPerSprint"
                    type="number"
                    value={teamMetrics.storiesPerSprint}
                    onChange={(e) =>
                      setTeamMetrics({
                        ...teamMetrics,
                        storiesPerSprint: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    max="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avgStoryPoints">Avg Story Points</Label>
                  <Input
                    id="avgStoryPoints"
                    type="number"
                    value={teamMetrics.avgStoryPoints}
                    onChange={(e) =>
                      setTeamMetrics({
                        ...teamMetrics,
                        avgStoryPoints: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    max="13"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hoursPerStoryPoint">
                    Hours per Story Point
                  </Label>
                  <Input
                    id="hoursPerStoryPoint"
                    type="number"
                    value={teamMetrics.hoursPerStoryPoint}
                    onChange={(e) =>
                      setTeamMetrics({
                        ...teamMetrics,
                        hoursPerStoryPoint: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    max="20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codeReviewTime">
                    Code Review Time (hrs/story)
                  </Label>
                  <Input
                    id="codeReviewTime"
                    type="number"
                    value={teamMetrics.codeReviewTime}
                    onChange={(e) =>
                      setTeamMetrics({
                        ...teamMetrics,
                        codeReviewTime: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Bug Fix Time (% of capacity)</Label>
                  <Slider
                    value={[teamMetrics.bugFixTime]}
                    onValueChange={(value) =>
                      setTeamMetrics({ ...teamMetrics, bugFixTime: value[0] })
                    }
                    max={50}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>0%</span>
                    <span className="font-medium">
                      {teamMetrics.bugFixTime}%
                    </span>
                    <span>50%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Meeting Overhead (% of time)</Label>
                  <Slider
                    value={[teamMetrics.meetingOverhead]}
                    onValueChange={(value) =>
                      setTeamMetrics({
                        ...teamMetrics,
                        meetingOverhead: value[0],
                      })
                    }
                    max={50}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>0%</span>
                    <span className="font-medium">
                      {teamMetrics.meetingOverhead}%
                    </span>
                    <span>50%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Calculated Baseline
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-blue-800 dark:text-blue-200">
                      Total Hours/Sprint
                    </div>
                    <div className="font-bold">
                      {teamMetrics.teamSize * teamMetrics.sprintLength * 40}
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-800 dark:text-blue-200">
                      Effective Hours
                    </div>
                    <div className="font-bold">
                      {Math.round(
                        teamMetrics.teamSize *
                          teamMetrics.sprintLength *
                          40 *
                          (1 - teamMetrics.meetingOverhead / 100) *
                          (1 - teamMetrics.bugFixTime / 100)
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-800 dark:text-blue-200">
                      Base Velocity
                    </div>
                    <div className="font-bold">
                      {Math.round(
                        (teamMetrics.teamSize *
                          teamMetrics.sprintLength *
                          40 *
                          (1 - teamMetrics.meetingOverhead / 100) *
                          (1 - teamMetrics.bugFixTime / 100)) /
                          teamMetrics.hoursPerStoryPoint
                      )}{' '}
                      SP
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-800 dark:text-blue-200">
                      Stories/Sprint
                    </div>
                    <div className="font-bold">
                      {Math.round(
                        (teamMetrics.teamSize *
                          teamMetrics.sprintLength *
                          40 *
                          (1 - teamMetrics.meetingOverhead / 100) *
                          (1 - teamMetrics.bugFixTime / 100)) /
                          teamMetrics.hoursPerStoryPoint /
                          teamMetrics.avgStoryPoints
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Debt Profile</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Select a scenario or customize your technical debt items
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Debt Scenario</Label>
                <Select
                  value={selectedScenario}
                  onValueChange={setSelectedScenario}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEBT_SCENARIOS.map((scenario) => (
                      <SelectItem
                        key={scenario.name
                          .toLowerCase()
                          .replace(' ', '_')
                          .replace('-', '_')}
                        value={scenario.name
                          .toLowerCase()
                          .replace(' ', '_')
                          .replace('-', '_')}
                      >
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {currentScenario.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Debt Items</h3>
                  <Button
                    onClick={addCustomDebtItem}
                    variant="outline"
                    size="sm"
                  >
                    Add Custom Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {allDebtItems.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={getSeverityColor(item.severity)}
                                className="text-xs"
                              >
                                {item.severity}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {item.category.replace('_', ' ')}
                              </Badge>
                            </div>

                            {item.id.startsWith('custom_') ? (
                              <div className="space-y-2">
                                <Input
                                  placeholder="Description"
                                  value={item.description}
                                  onChange={(e) =>
                                    updateCustomDebtItem(item.id, {
                                      description: e.target.value,
                                    })
                                  }
                                />
                                <div className="grid grid-cols-3 gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Effort (hrs)"
                                    value={item.effortToFix}
                                    onChange={(e) =>
                                      updateCustomDebtItem(item.id, {
                                        effortToFix:
                                          parseInt(e.target.value) || 0,
                                      })
                                    }
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Impact (%)"
                                    value={item.velocityImpact}
                                    onChange={(e) =>
                                      updateCustomDebtItem(item.id, {
                                        velocityImpact:
                                          parseInt(e.target.value) || 0,
                                      })
                                    }
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Growth rate"
                                    value={item.accumulationRate}
                                    onChange={(e) =>
                                      updateCustomDebtItem(item.id, {
                                        accumulationRate:
                                          parseFloat(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {item.description}
                              </p>
                            )}

                            <div className="flex gap-4 text-xs text-gray-500">
                              <span>Effort: {item.effortToFix}h</span>
                              <span>Impact: {item.velocityImpact}%</span>
                              <span>
                                Growth: {item.accumulationRate}x/sprint
                              </span>
                            </div>
                          </div>
                        </div>

                        {item.id.startsWith('custom_') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomDebtItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Velocity Loss</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {insights.velocityLoss}%
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Debt Hours</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {insights.totalDebtHours}h
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Critical Issues</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {insights.criticalIssues}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Worst Category</span>
                  </div>
                  <div className="text-sm font-medium capitalize">
                    {insights.worstCategory.replace('_', ' ')}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Velocity Over Time</CardTitle>
                <div className="space-y-2">
                  <Label>Time Horizon (sprints)</Label>
                  <Slider
                    value={[timeHorizon]}
                    onValueChange={(value) => setTimeHorizon(value[0])}
                    min={6}
                    max={24}
                    step={1}
                    className="w-48"
                  />
                  <div className="text-sm text-gray-500">
                    {timeHorizon} sprints
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={velocityProjection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="sprint"
                      label={{
                        value: 'Sprint',
                        position: 'insideBottom',
                        offset: -10,
                      }}
                    />
                    <YAxis
                      label={{
                        value: 'Velocity (Story Points)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        typeof value === 'number'
                          ? Math.round(value * 100) / 100
                          : value,
                        name,
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="idealVelocity"
                      stroke="#10b981"
                      strokeDasharray="5 5"
                      name="Ideal Velocity"
                    />
                    <Line
                      type="monotone"
                      dataKey="actualVelocity"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Actual Velocity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cumulative Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={velocityProjection}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sprint" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="Features Delivered"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Debt Paydown Strategy</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Plan how much capacity to allocate to technical debt reduction
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Debt Paydown Capacity (% of sprint)</Label>
                <Slider
                  value={[debtPaydownRate]}
                  onValueChange={(value) => setDebtPaydownRate(value[0])}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0%</span>
                  <span className="font-medium">{debtPaydownRate}%</span>
                  <span>50%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {insights.sprintsToPayDebt}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Sprints to Clear Debt
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(
                      (debtPaydownRate / 100) *
                        teamMetrics.teamSize *
                        teamMetrics.sprintLength *
                        40
                    )}
                    h
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Hours per Sprint
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(100 - debtPaydownRate)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Feature Capacity
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Recommended Approach
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights.criticalIssues > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h4 className="font-medium text-red-900 dark:text-red-100">
                          Immediate Action Required
                        </h4>
                      </div>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        You have {insights.criticalIssues} critical technical
                        debt items. Consider allocating 30-40% of capacity to
                        debt reduction immediately.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-medium">Strategic Recommendations:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>
                          Start with highest impact, lowest effort items for
                          quick wins
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>
                          Address {insights.worstCategory.replace('_', ' ')}{' '}
                          issues first as they have the highest velocity impact
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>
                          Allocate{' '}
                          {Math.max(
                            20,
                            Math.min(40, insights.criticalIssues * 10)
                          )}
                          % capacity to debt paydown
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>
                          Track velocity improvements as debt is reduced
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Pro tip:</strong> Technical debt compounds over
                      time. The cost of fixing it later is always higher than
                      addressing it now. Use this model to make data-driven
                      decisions about when to prioritize debt reduction vs. new
                      features.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
