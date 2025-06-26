import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import {
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Zap,
  AlertTriangle,
} from 'lucide-react'

interface GrowthChannel {
  id: string
  name: string
  cac: number
  ltv: number
  conversionRate: number
  maxCapacity: number // max customers per month
  rampTime: number // months to reach max capacity
  investmentRequired: number
}

interface GrowthStrategy {
  channels: GrowthChannel[]
  totalBudget: number
  timeHorizon: number // months
  targetRevenue: number
  currentMRR: number
  averagePrice: number
}

interface SimulationResult {
  month: number
  totalCustomers: number
  mrr: number
  totalSpend: number
  totalRevenue: number
  roi: number
  channelBreakdown: Record<
    string,
    {
      customers: number
      spend: number
      revenue: number
    }
  >
}

const defaultChannels: GrowthChannel[] = [
  {
    id: 'paid_search',
    name: 'Paid Search',
    cac: 200,
    ltv: 2400,
    conversionRate: 3.5,
    maxCapacity: 100,
    rampTime: 3,
    investmentRequired: 50000,
  },
  {
    id: 'content_marketing',
    name: 'Content Marketing',
    cac: 150,
    ltv: 3000,
    conversionRate: 2.8,
    maxCapacity: 80,
    rampTime: 6,
    investmentRequired: 30000,
  },
  {
    id: 'social_media',
    name: 'Social Media',
    cac: 120,
    ltv: 2000,
    conversionRate: 2.2,
    maxCapacity: 150,
    rampTime: 4,
    investmentRequired: 25000,
  },
  {
    id: 'partnerships',
    name: 'Partnerships',
    cac: 300,
    ltv: 4000,
    conversionRate: 8.0,
    maxCapacity: 50,
    rampTime: 9,
    investmentRequired: 75000,
  },
  {
    id: 'referral',
    name: 'Referral Program',
    cac: 80,
    ltv: 2800,
    conversionRate: 12.0,
    maxCapacity: 60,
    rampTime: 12,
    investmentRequired: 15000,
  },
]

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${Math.round(value).toLocaleString()}`
}

const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return Math.round(value).toLocaleString()
}

const ChannelCard = ({
  channel,
  allocation,
  onAllocationChange,
}: {
  channel: GrowthChannel
  allocation: number
  onAllocationChange: (channelId: string, allocation: number) => void
}) => {
  const efficiency = channel.ltv / channel.cac
  const getEfficiencyColor = (ratio: number) => {
    if (ratio >= 4) return 'text-green-600 dark:text-green-400'
    if (ratio >= 3) return 'text-blue-600 dark:text-blue-400'
    if (ratio >= 2) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{channel.name}</h3>
            <Badge variant="outline" className={getEfficiencyColor(efficiency)}>
              {efficiency.toFixed(1)}x LTV:CAC
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">CAC:</span>{' '}
              {formatCurrency(channel.cac)}
            </div>
            <div>
              <span className="text-muted-foreground">LTV:</span>{' '}
              {formatCurrency(channel.ltv)}
            </div>
            <div>
              <span className="text-muted-foreground">Conv Rate:</span>{' '}
              {channel.conversionRate}%
            </div>
            <div>
              <span className="text-muted-foreground">Max/Month:</span>{' '}
              {channel.maxCapacity}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`allocation-${channel.id}`}>
              Budget Allocation (%)
            </Label>
            <Input
              id={`allocation-${channel.id}`}
              type="number"
              min="0"
              max="100"
              value={allocation}
              onChange={(e) =>
                onAllocationChange(channel.id, parseFloat(e.target.value) || 0)
              }
            />
            <Progress value={allocation} className="h-2" />
          </div>

          <div className="text-xs text-muted-foreground">
            <div>Ramp time: {channel.rampTime} months</div>
            <div>Setup cost: {formatCurrency(channel.investmentRequired)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GrowthStrategySimulator() {
  const [strategy, setStrategy] = useState<GrowthStrategy>({
    channels: defaultChannels,
    totalBudget: 500000,
    timeHorizon: 24,
    targetRevenue: 2000000,
    currentMRR: 50000,
    averagePrice: 199,
  })

  const [channelAllocations, setChannelAllocations] = useState<
    Record<string, number>
  >({
    paid_search: 30,
    content_marketing: 20,
    social_media: 15,
    partnerships: 20,
    referral: 15,
  })

  const [results, setResults] = useState<SimulationResult[]>([])

  const runSimulation = useCallback(() => {
    const monthlyBudget = strategy.totalBudget / strategy.timeHorizon
    const results: SimulationResult[] = []

    // Track cumulative metrics
    let totalCustomers = strategy.currentMRR / strategy.averagePrice
    let totalSpend = 0

    for (let month = 1; month <= strategy.timeHorizon; month++) {
      let monthlyCustomers = 0
      let monthlySpend = 0
      const channelBreakdown: Record<
        string,
        { customers: number; spend: number; revenue: number }
      > = {}

      strategy.channels.forEach((channel) => {
        const allocation = channelAllocations[channel.id] || 0
        const channelBudget = (monthlyBudget * allocation) / 100

        // Calculate ramp factor (channels don't reach full capacity immediately)
        const rampFactor = Math.min(month / channel.rampTime, 1)
        const effectiveCapacity = channel.maxCapacity * rampFactor

        // Calculate customers acquired this month
        const maxCustomersFromBudget = channelBudget / channel.cac
        const customersAcquired = Math.min(
          maxCustomersFromBudget,
          effectiveCapacity
        )
        const actualSpend = customersAcquired * channel.cac

        monthlyCustomers += customersAcquired
        monthlySpend += actualSpend

        channelBreakdown[channel.id] = {
          customers: customersAcquired,
          spend: actualSpend,
          revenue: customersAcquired * strategy.averagePrice,
        }
      })

      totalCustomers += monthlyCustomers
      totalSpend += monthlySpend

      const currentMRR =
        strategy.currentMRR +
        (totalCustomers - strategy.currentMRR / strategy.averagePrice) *
          strategy.averagePrice
      const totalRevenue = currentMRR * month // Simplified - assumes linear growth
      const roi =
        totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0

      results.push({
        month,
        totalCustomers: Math.round(totalCustomers),
        mrr: Math.round(currentMRR),
        totalSpend: Math.round(totalSpend),
        totalRevenue: Math.round(totalRevenue),
        roi: Math.round(roi * 10) / 10,
        channelBreakdown,
      })
    }

    setResults(results)
  }, [strategy, channelAllocations])

  useEffect(() => {
    runSimulation()
  }, [runSimulation])

  const updateStrategy = (field: keyof GrowthStrategy, value: number) => {
    setStrategy((prev) => ({ ...prev, [field]: value }))
  }

  const updateChannelAllocation = (channelId: string, allocation: number) => {
    setChannelAllocations((prev) => ({ ...prev, [channelId]: allocation }))
  }

  const totalAllocation = Object.values(channelAllocations).reduce(
    (sum, val) => sum + val,
    0
  )
  const finalResult = results[results.length - 1]
  const reachesTarget = finalResult
    ? finalResult.mrr >= strategy.targetRevenue / 12
    : false

  // Prepare chart data
  const chartData = results.map((result) => ({
    month: `Month ${result.month}`,
    MRR: result.mrr,
    'Total Spend': result.totalSpend,
    ROI: result.roi,
  }))

  const channelContributionData = strategy.channels.map((channel) => {
    const allocation = channelAllocations[channel.id] || 0
    const monthlyBudget =
      ((strategy.totalBudget / strategy.timeHorizon) * allocation) / 100
    const projectedCustomers =
      (monthlyBudget / channel.cac) * strategy.timeHorizon * 0.7 // Average ramp factor

    return {
      name: channel.name,
      customers: Math.round(projectedCustomers),
      efficiency: Math.round((channel.ltv / channel.cac) * 10) / 10,
      investment: Math.round(monthlyBudget * strategy.timeHorizon),
    }
  })

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Growth Strategy Simulator</h2>
        <p className="text-muted-foreground">
          Model different growth channels and budget allocations. See the impact
          on revenue and ROI.
        </p>
      </div>

      {/* Strategy Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Growth Strategy Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="totalBudget">Total Budget ($)</Label>
              <Input
                id="totalBudget"
                type="number"
                value={strategy.totalBudget}
                onChange={(e) =>
                  updateStrategy('totalBudget', parseFloat(e.target.value) || 0)
                }
                placeholder="500000"
              />
            </div>

            <div>
              <Label htmlFor="timeHorizon">Time Horizon (months)</Label>
              <Input
                id="timeHorizon"
                type="number"
                min="1"
                max="60"
                value={strategy.timeHorizon}
                onChange={(e) =>
                  updateStrategy(
                    'timeHorizon',
                    parseFloat(e.target.value) || 12
                  )
                }
                placeholder="24"
              />
            </div>

            <div>
              <Label htmlFor="currentMRR">Current MRR ($)</Label>
              <Input
                id="currentMRR"
                type="number"
                value={strategy.currentMRR}
                onChange={(e) =>
                  updateStrategy('currentMRR', parseFloat(e.target.value) || 0)
                }
                placeholder="50000"
              />
            </div>

            <div>
              <Label htmlFor="averagePrice">Average Price ($)</Label>
              <Input
                id="averagePrice"
                type="number"
                value={strategy.averagePrice}
                onChange={(e) =>
                  updateStrategy(
                    'averagePrice',
                    parseFloat(e.target.value) || 100
                  )
                }
                placeholder="199"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Channel Allocation:</span>
              <Badge
                className={
                  totalAllocation === 100
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                }
              >
                {totalAllocation}%
              </Badge>
            </div>
            {totalAllocation !== 100 && (
              <p className="text-xs text-muted-foreground mt-1">
                Allocations should total 100% for optimal budget utilization
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Channel Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Channel Mix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategy.channels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                allocation={channelAllocations[channel.id] || 0}
                onAllocationChange={updateChannelAllocation}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Results Overview */}
      {finalResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Final MRR
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(finalResult.mrr)}
                  </p>
                  <Badge
                    className={
                      reachesTarget
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }
                  >
                    {reachesTarget ? 'Target Reached' : 'Below Target'}
                  </Badge>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Customers
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(finalResult.totalCustomers)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Investment
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(finalResult.totalSpend)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    ROI
                  </p>
                  <p className="text-2xl font-bold">{finalResult.roi}%</p>
                  <Badge
                    className={
                      finalResult.roi > 200
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : finalResult.roi > 100
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }
                  >
                    {finalResult.roi > 200
                      ? 'Excellent'
                      : finalResult.roi > 100
                        ? 'Good'
                        : 'Poor'}
                  </Badge>
                </div>
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'ROI'
                      ? `${value}%`
                      : formatCurrency(Number(value)),
                    name,
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="MRR"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Total Spend"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Channel Contribution */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Contribution Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelContributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'efficiency'
                      ? `${value}x`
                      : name === 'investment'
                        ? formatCurrency(Number(value))
                        : formatNumber(Number(value)),
                    name === 'efficiency'
                      ? 'LTV:CAC Ratio'
                      : name === 'investment'
                        ? 'Investment'
                        : 'Customers',
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="customers"
                  fill="#3b82f6"
                  name="Projected Customers"
                />
                <Bar dataKey="efficiency" fill="#10b981" name="LTV:CAC Ratio" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Strategy Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {totalAllocation < 90 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300">
                  ⚠️ <strong>Underutilized budget:</strong> Only{' '}
                  {totalAllocation}% of budget allocated. Consider increasing
                  investment in high-performing channels.
                </p>
              </div>
            )}

            {finalResult && finalResult.roi < 100 && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300">
                  🚨 <strong>Negative ROI:</strong> Current strategy projects{' '}
                  {finalResult.roi}% ROI. Focus budget on channels with better
                  LTV:CAC ratios.
                </p>
              </div>
            )}

            {!reachesTarget && finalResult && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-orange-800 dark:text-orange-300">
                  📊 <strong>Target shortfall:</strong> Projected MRR of{' '}
                  {formatCurrency(finalResult.mrr)} falls short of target.
                  Consider increasing budget or improving channel efficiency.
                </p>
              </div>
            )}

            {strategy.channels.some(
              (ch) => (channelAllocations[ch.id] || 0) > 40
            ) && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-300">
                  🎯 <strong>Channel concentration risk:</strong> Heavy
                  allocation to single channel increases risk. Consider
                  diversifying across multiple growth channels.
                </p>
              </div>
            )}

            {finalResult && finalResult.roi > 300 && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-300">
                  🚀 <strong>Strong strategy:</strong> Excellent ROI of{' '}
                  {finalResult.roi}% suggests efficient growth channels.
                  Consider increasing budget to accelerate growth.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
