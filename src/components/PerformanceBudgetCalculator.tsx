import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Download, Zap, AlertCircle, CheckCircle2 } from 'lucide-react'

interface NetworkSpeed {
  name: string
  downloadMbps: number
  typical: string
}

const NETWORK_SPEEDS: NetworkSpeed[] = [
  { name: '2G', downloadMbps: 0.25, typical: 'Edge/GPRS' },
  { name: '3G', downloadMbps: 2, typical: 'Mobile broadband' },
  { name: '4G', downloadMbps: 10, typical: 'LTE' },
  { name: '5G', downloadMbps: 50, typical: 'Next-gen mobile' },
  { name: 'WiFi', downloadMbps: 25, typical: 'Home/Office' },
  { name: 'Fiber', downloadMbps: 100, typical: 'High-speed' },
]

const RESOURCE_TYPES = [
  { name: 'HTML', avgSize: 30, color: '#f97316' },
  { name: 'CSS', avgSize: 60, color: '#3b82f6' },
  { name: 'JavaScript', avgSize: 400, color: '#eab308' },
  { name: 'Images', avgSize: 500, color: '#10b981' },
  { name: 'Fonts', avgSize: 100, color: '#8b5cf6' },
  { name: 'Videos', avgSize: 2000, color: '#ef4444' },
]

export default function PerformanceBudgetCalculator() {
  const [targetLoadTime, setTargetLoadTime] = useState(3) // seconds
  const [selectedNetwork, setSelectedNetwork] = useState(2) // 4G by default
  const [resources, setResources] = useState({
    html: 30,
    css: 60,
    javascript: 400,
    images: 500,
    fonts: 100,
    videos: 0,
  })

  const totalSize = useMemo(() => {
    return Object.values(resources).reduce((sum, size) => sum + size, 0)
  }, [resources])

  const loadTimeByNetwork = useMemo(() => {
    return NETWORK_SPEEDS.map((network) => {
      const downloadTimeSeconds = totalSize / 1024 / network.downloadMbps
      return {
        name: network.name,
        time: Number(downloadTimeSeconds.toFixed(2)),
        typical: network.typical,
      }
    })
  }, [totalSize])

  const currentLoadTime = loadTimeByNetwork[selectedNetwork]?.time || 0
  const isWithinBudget = currentLoadTime <= targetLoadTime

  const performanceScore = useMemo(() => {
    if (currentLoadTime <= 1) return 100
    if (currentLoadTime <= 2) return 90
    if (currentLoadTime <= 3) return 75
    if (currentLoadTime <= 5) return 50
    if (currentLoadTime <= 8) return 25
    return 10
  }, [currentLoadTime])

  const recommendations = useMemo(() => {
    const recs = []

    if (resources.images > 300) {
      recs.push({
        type: 'warning',
        message: 'Consider lazy loading images below the fold',
        impact: 'High',
      })
    }

    if (resources.javascript > 300) {
      recs.push({
        type: 'warning',
        message: 'Bundle size is large - consider code splitting',
        impact: 'High',
      })
    }

    if (resources.fonts > 50) {
      recs.push({
        type: 'info',
        message: 'Use font-display: swap for better perceived performance',
        impact: 'Medium',
      })
    }

    if (totalSize < 500) {
      recs.push({
        type: 'success',
        message: 'Excellent! Your page is lightweight and fast',
        impact: 'Positive',
      })
    }

    return recs
  }, [resources, totalSize])

  const budgetBreakdown = useMemo(() => {
    const mbps = NETWORK_SPEEDS[selectedNetwork].downloadMbps
    const maxKB = targetLoadTime * mbps * 1024

    return Object.entries(resources).map(([type, size]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      current: size,
      recommended: Math.round((size / totalSize) * maxKB),
      percentage: (size / totalSize) * 100,
    }))
  }, [resources, totalSize, targetLoadTime, selectedNetwork])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Performance Budget Calculator
          </CardTitle>
          <CardDescription>
            Calculate and optimize your website's performance budget for
            different network conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="recommendations">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="target-time">
                    Target Load Time: {targetLoadTime}s
                  </Label>
                  <Slider
                    id="target-time"
                    value={[targetLoadTime]}
                    onValueChange={([value]) => setTargetLoadTime(value)}
                    min={1}
                    max={10}
                    step={0.5}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Google recommends under 3 seconds for optimal user
                    experience
                  </p>
                </div>

                <div>
                  <Label>Network Speed</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {NETWORK_SPEEDS.map((network, index) => (
                      <button
                        key={network.name}
                        onClick={() => setSelectedNetwork(index)}
                        className={`p-2 rounded-md border text-sm transition-colors ${
                          selectedNetwork === index
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="font-medium">{network.name}</div>
                        <div className="text-xs opacity-80">
                          {network.downloadMbps} Mbps
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Resource Breakdown (KB)</Label>
                  {Object.entries(resources).map(([type, size]) => (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{type}</span>
                        <span className="font-mono">{size} KB</span>
                      </div>
                      <Slider
                        value={[size]}
                        onValueChange={([value]) =>
                          setResources((prev) => ({ ...prev, [type]: value }))
                        }
                        min={0}
                        max={type === 'videos' ? 5000 : 1000}
                        step={10}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Page Size
                    </p>
                    <p className="text-2xl font-bold">{totalSize} KB</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Load Time ({NETWORK_SPEEDS[selectedNetwork].name})
                    </p>
                    <p
                      className={`text-2xl font-bold ${isWithinBudget ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {currentLoadTime}s
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Load Time by Network
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={loadTimeByNetwork}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        label={{
                          value: 'Load Time (s)',
                          angle: -90,
                          position: 'insideLeft',
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload[0]) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-background border rounded-md p-2">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {data.typical}
                                </p>
                                <p className="text-sm">
                                  Load time: {data.time}s
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar
                        dataKey="time"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        type="monotone"
                        dataKey={() => targetLoadTime}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        name="Target"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Resource Distribution
                  </h3>
                  <div className="space-y-2">
                    {budgetBreakdown.map((item) => (
                      <div key={item.type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.type}</span>
                          <span>{item.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Performance Score
                    </span>
                    <Badge
                      variant={
                        performanceScore >= 75
                          ? 'default'
                          : performanceScore >= 50
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {performanceScore}/100
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        performanceScore >= 75
                          ? 'bg-green-500'
                          : performanceScore >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${performanceScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <Alert
                    key={index}
                    className={
                      rec.type === 'success'
                        ? 'border-green-500'
                        : rec.type === 'warning'
                          ? 'border-yellow-500'
                          : 'border-blue-500'
                    }
                  >
                    {rec.type === 'success' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {rec.type === 'warning' && (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    {rec.type === 'info' && (
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                    )}
                    <AlertDescription>
                      <div className="flex justify-between items-start">
                        <span>{rec.message}</span>
                        <Badge variant="outline" className="ml-2">
                          {rec.impact}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Optimization Strategies
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    • Enable gzip/brotli compression (save ~70% on text assets)
                  </li>
                  <li>• Implement lazy loading for images and videos</li>
                  <li>• Use modern image formats (WebP, AVIF)</li>
                  <li>• Minimize and bundle CSS/JavaScript</li>
                  <li>• Leverage browser caching and CDNs</li>
                  <li>• Consider critical CSS inlining</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
