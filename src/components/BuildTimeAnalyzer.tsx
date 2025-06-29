import { useState, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Clock, Cpu, HardDrive, AlertTriangle, TrendingUp } from 'lucide-react'

interface BuildStep {
  name: string
  baseTime: number // seconds
  scaling: 'linear' | 'logarithmic' | 'exponential'
  color: string
}

const BUILD_STEPS: BuildStep[] = [
  {
    name: 'Dependency Install',
    baseTime: 30,
    scaling: 'logarithmic',
    color: '#3b82f6',
  },
  {
    name: 'TypeScript Compile',
    baseTime: 20,
    scaling: 'linear',
    color: '#10b981',
  },
  { name: 'Bundle/Minify', baseTime: 15, scaling: 'linear', color: '#f59e0b' },
  {
    name: 'Image Optimization',
    baseTime: 10,
    scaling: 'exponential',
    color: '#8b5cf6',
  },
  { name: 'CSS Processing', baseTime: 8, scaling: 'linear', color: '#ef4444' },
  { name: 'Tests', baseTime: 25, scaling: 'linear', color: '#06b6d4' },
]

const OPTIMIZATION_STRATEGIES = [
  { name: 'Parallel Processing', impact: 0.7, applicable: ['all'] },
  {
    name: 'Incremental Builds',
    impact: 0.5,
    applicable: ['TypeScript Compile', 'Bundle/Minify'],
  },
  {
    name: 'Build Cache',
    impact: 0.6,
    applicable: ['Dependency Install', 'Image Optimization'],
  },
  { name: 'Code Splitting', impact: 0.8, applicable: ['Bundle/Minify'] },
  { name: 'Lazy Compilation', impact: 0.4, applicable: ['TypeScript Compile'] },
]

export default function BuildTimeAnalyzer() {
  const [projectSize, setProjectSize] = useState(1000) // files
  const [dependencies, setDependencies] = useState(100) // packages
  const [buildTool, setBuildTool] = useState('webpack')
  const [enabledOptimizations, setEnabledOptimizations] = useState<string[]>([])

  const calculateStepTime = useCallback(
    (step: BuildStep) => {
      let time = step.baseTime

      // Scale based on project size
      switch (step.scaling) {
        case 'linear':
          time = step.baseTime * (projectSize / 1000)
          break
        case 'logarithmic':
          time = step.baseTime * Math.log10(projectSize / 100 + 1)
          break
        case 'exponential':
          time = step.baseTime * Math.pow(projectSize / 1000, 1.5)
          break
      }

      // Apply dependency factor for relevant steps
      if (step.name === 'Dependency Install') {
        time *= dependencies / 100
      }

      // Apply tool-specific modifiers
      const toolModifiers: Record<string, Record<string, number>> = {
        webpack: { 'Bundle/Minify': 1.0 },
        vite: { 'Bundle/Minify': 0.3, 'TypeScript Compile': 0.5 },
        esbuild: { 'Bundle/Minify': 0.1, 'TypeScript Compile': 0.2 },
        parcel: { 'Bundle/Minify': 0.7 },
      }

      if (toolModifiers[buildTool]?.[step.name]) {
        time *= toolModifiers[buildTool][step.name]
      }

      // Apply optimizations
      enabledOptimizations.forEach((opt) => {
        const optimization = OPTIMIZATION_STRATEGIES.find((o) => o.name === opt)
        if (
          optimization &&
          (optimization.applicable.includes('all') ||
            optimization.applicable.includes(step.name))
        ) {
          time *= optimization.impact
        }
      })

      return Math.max(1, Math.round(time))
    },
    [projectSize, dependencies, buildTool, enabledOptimizations]
  )

  const buildTimeData = useMemo(() => {
    return BUILD_STEPS.map((step) => ({
      ...step,
      time: calculateStepTime(step),
    }))
  }, [calculateStepTime])

  const totalBuildTime = useMemo(() => {
    return buildTimeData.reduce((sum, step) => sum + step.time, 0)
  }, [buildTimeData])

  const buildTimeHistory = useMemo(() => {
    const sizes = [100, 500, 1000, 2000, 5000, 10000]
    return sizes.map((size) => {
      const baseTime = BUILD_STEPS.reduce((sum, step) => {
        let time = step.baseTime
        switch (step.scaling) {
          case 'linear':
            time = step.baseTime * (size / 1000)
            break
          case 'logarithmic':
            time = step.baseTime * Math.log10(size / 100 + 1)
            break
          case 'exponential':
            time = step.baseTime * Math.pow(size / 1000, 1.5)
            break
        }
        return sum + time
      }, 0)

      return {
        size,
        time: Math.round(baseTime),
        optimized: Math.round(baseTime * 0.4), // With all optimizations
      }
    })
  }, [])

  const costAnalysis = useMemo(() => {
    const buildsPerDay = 50
    const developerHourlyRate = 100
    const ciMinuteCost = 0.008

    const dailyBuildMinutes = (totalBuildTime / 60) * buildsPerDay
    const monthlyBuildMinutes = dailyBuildMinutes * 22 // working days

    const ciCost = monthlyBuildMinutes * ciMinuteCost
    const developerTimeCost = (monthlyBuildMinutes / 60) * developerHourlyRate

    return {
      ciCost: Math.round(ciCost),
      developerTimeCost: Math.round(developerTimeCost),
      totalCost: Math.round(ciCost + developerTimeCost),
      timeWasted: Math.round(monthlyBuildMinutes / 60), // hours
    }
  }, [totalBuildTime])

  const getPerformanceLevel = () => {
    if (totalBuildTime < 30)
      return { level: 'Excellent', color: 'text-green-600' }
    if (totalBuildTime < 60) return { level: 'Good', color: 'text-blue-600' }
    if (totalBuildTime < 120) return { level: 'Fair', color: 'text-yellow-600' }
    return { level: 'Poor', color: 'text-red-600' }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Build Time Analyzer
          </CardTitle>
          <CardDescription>
            Analyze and optimize your project's build performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">Configuration</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-size">
                    Project Size: {projectSize} files
                  </Label>
                  <Slider
                    id="project-size"
                    value={[projectSize]}
                    onValueChange={([value]) => setProjectSize(value)}
                    min={100}
                    max={10000}
                    step={100}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="dependencies">
                    Dependencies: {dependencies} packages
                  </Label>
                  <Slider
                    id="dependencies"
                    value={[dependencies]}
                    onValueChange={([value]) => setDependencies(value)}
                    min={10}
                    max={500}
                    step={10}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="build-tool">Build Tool</Label>
                  <Select value={buildTool} onValueChange={setBuildTool}>
                    <SelectTrigger id="build-tool" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webpack">Webpack</SelectItem>
                      <SelectItem value="vite">Vite</SelectItem>
                      <SelectItem value="esbuild">esbuild</SelectItem>
                      <SelectItem value="parcel">Parcel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Optimizations</Label>
                  <div className="space-y-2 mt-2">
                    {OPTIMIZATION_STRATEGIES.map((opt) => (
                      <label
                        key={opt.name}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={enabledOptimizations.includes(opt.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEnabledOptimizations([
                                ...enabledOptimizations,
                                opt.name,
                              ])
                            } else {
                              setEnabledOptimizations(
                                enabledOptimizations.filter(
                                  (o) => o !== opt.name
                                )
                              )
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{opt.name}</span>
                        <Badge variant="outline" className="text-xs">
                          -{Math.round((1 - opt.impact) * 100)}%
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Build Time
                    </p>
                    <p
                      className={`text-3xl font-bold ${getPerformanceLevel().color}`}
                    >
                      {Math.floor(totalBuildTime / 60)}m {totalBuildTime % 60}s
                    </p>
                  </div>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {getPerformanceLevel().level}
                  </Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Build Step Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={buildTimeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="time"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {buildTimeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Build Time Scaling
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={buildTimeHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="size"
                      label={{
                        value: 'Project Size (files)',
                        position: 'insideBottom',
                        offset: -5,
                      }}
                    />
                    <YAxis
                      label={{
                        value: 'Build Time (s)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="time"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.3}
                      name="Unoptimized"
                    />
                    <Area
                      type="monotone"
                      dataKey="optimized"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                      name="Optimized"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      Monthly Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          CI/CD Cost:
                        </span>
                        <span className="font-medium">
                          ${costAnalysis.ciCost}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Developer Time:
                        </span>
                        <span className="font-medium">
                          ${costAnalysis.developerTimeCost}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">Total Cost:</span>
                        <span className="font-bold text-red-600">
                          ${costAnalysis.totalCost}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      Time Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Builds/Day:
                        </span>
                        <span className="font-medium">50</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Time/Build:
                        </span>
                        <span className="font-medium">
                          {Math.floor(totalBuildTime / 60)}m{' '}
                          {totalBuildTime % 60}s
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">Monthly Waste:</span>
                        <span className="font-bold text-orange-600">
                          {costAnalysis.timeWasted}h
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">Optimization Potential:</span>{' '}
                  You could save up to{' '}
                  <span className="font-bold text-green-600">
                    {Math.round(
                      (1 -
                        enabledOptimizations.length /
                          OPTIMIZATION_STRATEGIES.length) *
                        60
                    )}
                    %
                  </span>{' '}
                  of build time by enabling all optimizations.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Recommended Actions</h3>

                {buildTool !== 'vite' && buildTool !== 'esbuild' && (
                  <Card className="border-orange-200 dark:border-orange-900">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        Switch to Modern Build Tools
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Consider migrating to Vite or esbuild for significantly
                        faster builds. Vite can reduce build times by up to 70%
                        for development builds.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {projectSize > 2000 &&
                  !enabledOptimizations.includes('Code Splitting') && (
                    <Card className="border-blue-200 dark:border-blue-900">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Implement Code Splitting
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Your project is large enough to benefit from code
                          splitting. This can reduce initial bundle size by
                          40-60%.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Wins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Use persistent caching for dependencies</li>
                      <li>• Enable parallel processing where possible</li>
                      <li>• Exclude unnecessary files from compilation</li>
                      <li>• Use incremental TypeScript compilation</li>
                      <li>• Optimize image processing pipeline</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
