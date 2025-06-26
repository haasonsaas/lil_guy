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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  Users,
  DollarSign,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

interface HiringRole {
  id: string
  title: string
  level: 'junior' | 'mid' | 'senior' | 'staff' | 'principal'
  baseSalary: number
  equity: number // percentage
  recruiterFee: number // percentage of salary
  timeToHire: number // weeks
  interviewHours: number // total hours across all interviewers
}

interface HiringCosts {
  // Direct costs
  salary: number
  equity: number
  recruiterFee: number

  // Hidden costs
  interviewTime: number
  onboardingTime: number
  trainingCosts: number
  benefitsCosts: number
  equipmentCosts: number

  // Opportunity costs
  delayedFeatures: number
  lostRevenue: number

  // Total costs
  totalDirectCosts: number
  totalHiddenCosts: number
  totalOpportunityCosts: number
  grandTotal: number

  // Efficiency metrics
  costPerWeek: number
  timeToProductivity: number
  firstYearROI: number
}

interface TeamComposition {
  engineers: number
  designers: number
  productManagers: number
  salesReps: number
  marketers: number
  operations: number
}

const roleTemplates: Record<string, Omit<HiringRole, 'id'>> = {
  software_engineer_junior: {
    title: 'Software Engineer (Junior)',
    level: 'junior',
    baseSalary: 85000,
    equity: 0.05,
    recruiterFee: 20,
    timeToHire: 8,
    interviewHours: 12,
  },
  software_engineer_senior: {
    title: 'Software Engineer (Senior)',
    level: 'senior',
    baseSalary: 165000,
    equity: 0.15,
    recruiterFee: 25,
    timeToHire: 12,
    interviewHours: 16,
  },
  product_manager: {
    title: 'Product Manager',
    level: 'mid',
    baseSalary: 140000,
    equity: 0.25,
    recruiterFee: 25,
    timeToHire: 10,
    interviewHours: 14,
  },
  designer: {
    title: 'Product Designer',
    level: 'mid',
    baseSalary: 120000,
    equity: 0.15,
    recruiterFee: 20,
    timeToHire: 8,
    interviewHours: 10,
  },
  sales_rep: {
    title: 'Sales Representative',
    level: 'mid',
    baseSalary: 80000,
    equity: 0.05,
    recruiterFee: 15,
    timeToHire: 6,
    interviewHours: 8,
  },
  marketing_manager: {
    title: 'Marketing Manager',
    level: 'mid',
    baseSalary: 95000,
    equity: 0.1,
    recruiterFee: 20,
    timeToHire: 7,
    interviewHours: 10,
  },
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${Math.round(value).toLocaleString()}`
}

const CostBreakdownCard = ({
  title,
  amount,
  percentage,
  icon: Icon,
  color = 'blue',
}: {
  title: string
  amount: number
  percentage: number
  icon: React.ElementType
  color?: string
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-600 dark:text-green-400'
      case 'blue':
        return 'text-blue-600 dark:text-blue-400'
      case 'orange':
        return 'text-orange-600 dark:text-orange-400'
      case 'red':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${getColorClasses(color)}`} />
            <h3 className="font-semibold text-sm">{title}</h3>
          </div>
          <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
        </div>
        <div className="space-y-2">
          <div className={`text-2xl font-bold ${getColorClasses(color)}`}>
            {formatCurrency(amount)}
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function HiringCostCalculator() {
  const [selectedRole, setSelectedRole] = useState<string>(
    'software_engineer_senior'
  )
  const [role, setRole] = useState<HiringRole>({
    id: 'current',
    ...roleTemplates[selectedRole],
  })

  const [companyMetrics, setCompanyMetrics] = useState({
    averageEngineerSalary: 150000,
    revenuePerEmployee: 200000,
    benefitsMultiplier: 1.3, // 30% of salary
    equipmentCost: 5000,
    onboardingWeeks: 4,
    timeToProductivityWeeks: 12,
  })

  const [costs, setCosts] = useState<HiringCosts>({
    salary: 0,
    equity: 0,
    recruiterFee: 0,
    interviewTime: 0,
    onboardingTime: 0,
    trainingCosts: 0,
    benefitsCosts: 0,
    equipmentCosts: 0,
    delayedFeatures: 0,
    lostRevenue: 0,
    totalDirectCosts: 0,
    totalHiddenCosts: 0,
    totalOpportunityCosts: 0,
    grandTotal: 0,
    costPerWeek: 0,
    timeToProductivity: 0,
    firstYearROI: 0,
  })

  const calculateCosts = useCallback(() => {
    const newCosts: HiringCosts = {
      // Direct costs
      salary: role.baseSalary,
      equity: (role.equity / 100) * 10000000, // Assume $10M valuation for equity calculation
      recruiterFee: role.baseSalary * (role.recruiterFee / 100),

      // Hidden costs
      interviewTime:
        role.interviewHours * (companyMetrics.averageEngineerSalary / 2080), // Hourly rate
      onboardingTime:
        companyMetrics.onboardingWeeks *
        (companyMetrics.averageEngineerSalary / 52),
      trainingCosts: role.baseSalary * 0.1, // 10% of salary for training
      benefitsCosts: role.baseSalary * (companyMetrics.benefitsMultiplier - 1),
      equipmentCosts: companyMetrics.equipmentCost,

      // Opportunity costs
      delayedFeatures:
        (role.timeToHire / 52) * companyMetrics.revenuePerEmployee * 0.1, // 10% revenue impact
      lostRevenue:
        (companyMetrics.timeToProductivityWeeks / 52) *
        companyMetrics.revenuePerEmployee *
        0.5,

      // Placeholders - will be calculated
      totalDirectCosts: 0,
      totalHiddenCosts: 0,
      totalOpportunityCosts: 0,
      grandTotal: 0,
      costPerWeek: 0,
      timeToProductivity: companyMetrics.timeToProductivityWeeks,
      firstYearROI: 0,
    }

    // Calculate totals
    newCosts.totalDirectCosts =
      newCosts.salary + newCosts.equity + newCosts.recruiterFee
    newCosts.totalHiddenCosts =
      newCosts.interviewTime +
      newCosts.onboardingTime +
      newCosts.trainingCosts +
      newCosts.benefitsCosts +
      newCosts.equipmentCosts
    newCosts.totalOpportunityCosts =
      newCosts.delayedFeatures + newCosts.lostRevenue
    newCosts.grandTotal =
      newCosts.totalDirectCosts +
      newCosts.totalHiddenCosts +
      newCosts.totalOpportunityCosts

    // Calculate efficiency metrics
    newCosts.costPerWeek = newCosts.grandTotal / 52
    newCosts.firstYearROI =
      ((companyMetrics.revenuePerEmployee - newCosts.grandTotal) /
        newCosts.grandTotal) *
      100

    setCosts(newCosts)
  }, [role, companyMetrics])

  useEffect(() => {
    calculateCosts()
  }, [calculateCosts])

  const updateRole = (field: keyof HiringRole, value: string | number) => {
    setRole((prev) => ({ ...prev, [field]: value }))
  }

  const updateCompanyMetrics = (
    field: keyof typeof companyMetrics,
    value: number
  ) => {
    setCompanyMetrics((prev) => ({ ...prev, [field]: value }))
  }

  const handleRoleChange = (roleKey: string) => {
    setSelectedRole(roleKey)
    setRole({
      id: 'current',
      ...roleTemplates[roleKey],
    })
  }

  // Prepare chart data
  const costBreakdownData = [
    { name: 'Direct Costs', value: costs.totalDirectCosts, color: '#3b82f6' },
    { name: 'Hidden Costs', value: costs.totalHiddenCosts, color: '#f59e0b' },
    {
      name: 'Opportunity Costs',
      value: costs.totalOpportunityCosts,
      color: '#ef4444',
    },
  ]

  const detailedCostsData = [
    { name: 'Salary', amount: costs.salary, category: 'Direct' },
    { name: 'Equity', amount: costs.equity, category: 'Direct' },
    { name: 'Recruiter Fee', amount: costs.recruiterFee, category: 'Direct' },
    { name: 'Interview Time', amount: costs.interviewTime, category: 'Hidden' },
    { name: 'Onboarding', amount: costs.onboardingTime, category: 'Hidden' },
    { name: 'Training', amount: costs.trainingCosts, category: 'Hidden' },
    { name: 'Benefits', amount: costs.benefitsCosts, category: 'Hidden' },
    { name: 'Equipment', amount: costs.equipmentCosts, category: 'Hidden' },
    {
      name: 'Delayed Features',
      amount: costs.delayedFeatures,
      category: 'Opportunity',
    },
    {
      name: 'Lost Revenue',
      amount: costs.lostRevenue,
      category: 'Opportunity',
    },
  ]

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444']

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Hiring Cost Calculator</h2>
        <p className="text-muted-foreground">
          Calculate the true cost of hiring. From salary to opportunity costs.
        </p>
      </div>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Role Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="roleTemplate">Role Template</Label>
                <Select value={selectedRole} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleTemplates).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="baseSalary">Base Salary ($)</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  value={role.baseSalary}
                  onChange={(e) =>
                    updateRole('baseSalary', parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div>
                <Label htmlFor="equity">Equity (%)</Label>
                <Input
                  id="equity"
                  type="number"
                  step="0.01"
                  value={role.equity}
                  onChange={(e) =>
                    updateRole('equity', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="recruiterFee">Recruiter Fee (%)</Label>
                <Input
                  id="recruiterFee"
                  type="number"
                  value={role.recruiterFee}
                  onChange={(e) =>
                    updateRole('recruiterFee', parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div>
                <Label htmlFor="timeToHire">Time to Hire (weeks)</Label>
                <Input
                  id="timeToHire"
                  type="number"
                  value={role.timeToHire}
                  onChange={(e) =>
                    updateRole('timeToHire', parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div>
                <Label htmlFor="interviewHours">Interview Hours</Label>
                <Input
                  id="interviewHours"
                  type="number"
                  value={role.interviewHours}
                  onChange={(e) =>
                    updateRole(
                      'interviewHours',
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Company Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="averageEngineerSalary">
                Average Engineer Salary ($)
              </Label>
              <Input
                id="averageEngineerSalary"
                type="number"
                value={companyMetrics.averageEngineerSalary}
                onChange={(e) =>
                  updateCompanyMetrics(
                    'averageEngineerSalary',
                    parseFloat(e.target.value) || 0
                  )
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                For calculating interview cost
              </p>
            </div>

            <div>
              <Label htmlFor="revenuePerEmployee">
                Revenue per Employee ($)
              </Label>
              <Input
                id="revenuePerEmployee"
                type="number"
                value={companyMetrics.revenuePerEmployee}
                onChange={(e) =>
                  updateCompanyMetrics(
                    'revenuePerEmployee',
                    parseFloat(e.target.value) || 0
                  )
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Annual revenue per employee
              </p>
            </div>

            <div>
              <Label htmlFor="timeToProductivityWeeks">
                Time to Productivity (weeks)
              </Label>
              <Input
                id="timeToProductivityWeeks"
                type="number"
                value={companyMetrics.timeToProductivityWeeks}
                onChange={(e) =>
                  updateCompanyMetrics(
                    'timeToProductivityWeeks',
                    parseFloat(e.target.value) || 0
                  )
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Weeks until full productivity
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CostBreakdownCard
          title="Direct Costs"
          amount={costs.totalDirectCosts}
          percentage={(costs.totalDirectCosts / costs.grandTotal) * 100}
          icon={DollarSign}
          color="blue"
        />

        <CostBreakdownCard
          title="Hidden Costs"
          amount={costs.totalHiddenCosts}
          percentage={(costs.totalHiddenCosts / costs.grandTotal) * 100}
          icon={Clock}
          color="orange"
        />

        <CostBreakdownCard
          title="Opportunity Costs"
          amount={costs.totalOpportunityCosts}
          percentage={(costs.totalOpportunityCosts / costs.grandTotal) * 100}
          icon={Target}
          color="red"
        />

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-sm">Total Cost</h3>
              </div>
              <Badge
                className={
                  costs.firstYearROI > 200
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : costs.firstYearROI > 100
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }
              >
                {costs.firstYearROI.toFixed(0)}% ROI
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(costs.grandTotal)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(costs.costPerWeek)}/week
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costBreakdownData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={detailedCostsData.filter((item) => item.amount > 0)}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Hiring Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {costs.totalHiddenCosts > costs.totalDirectCosts && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300">
                  ⚠️ <strong>Hidden costs exceed direct costs:</strong> Hidden
                  costs ({formatCurrency(costs.totalHiddenCosts)}) are higher
                  than direct costs ({formatCurrency(costs.totalDirectCosts)}).
                  Focus on streamlining your hiring process.
                </p>
              </div>
            )}

            {role.timeToHire > 12 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-orange-800 dark:text-orange-300">
                  🐌 <strong>Slow hiring process:</strong> {role.timeToHire}{' '}
                  weeks to hire is above market average. Consider streamlining
                  your interview process to reduce opportunity costs.
                </p>
              </div>
            )}

            {costs.firstYearROI < 100 && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300">
                  🚨 <strong>Poor ROI:</strong> First-year ROI of{' '}
                  {costs.firstYearROI.toFixed(0)}% suggests this hire may not
                  generate sufficient value. Consider role necessity or
                  compensation adjustments.
                </p>
              </div>
            )}

            {costs.recruiterFee > role.baseSalary * 0.3 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-300">
                  💰 <strong>High recruiter fees:</strong> Recruiter fees of{' '}
                  {formatCurrency(costs.recruiterFee)}
                  are significant. Consider building internal recruiting
                  capabilities for similar roles.
                </p>
              </div>
            )}

            {companyMetrics.timeToProductivityWeeks > 16 && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
                <p className="text-purple-800 dark:text-purple-300">
                  📚 <strong>Long ramp time:</strong>{' '}
                  {companyMetrics.timeToProductivityWeeks} weeks to productivity
                  is quite long. Improving onboarding could significantly reduce
                  hiring costs.
                </p>
              </div>
            )}

            {costs.firstYearROI > 300 && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-300">
                  🚀 <strong>Excellent investment:</strong>{' '}
                  {costs.firstYearROI.toFixed(0)}% ROI indicates this is a
                  high-value hire. Consider similar roles to accelerate growth.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">
                {formatCurrency(costs.grandTotal)}
              </div>
              <div className="text-sm text-muted-foreground">Total Cost</div>
            </div>

            <div>
              <div className="text-2xl font-bold">
                {costs.timeToProductivity} weeks
              </div>
              <div className="text-sm text-muted-foreground">
                Time to Productivity
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold">
                {costs.firstYearROI.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">
                First Year ROI
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold">
                {formatCurrency(costs.costPerWeek)}
              </div>
              <div className="text-sm text-muted-foreground">Cost per Week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
