import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, TrendingDown, DollarSign, Calendar, Zap, Target } from 'lucide-react';

interface RunwayMetrics {
  // Input metrics
  currentCash: number;
  monthlyBurn: number;
  monthlyRevenue: number;
  revenueGrowthRate: number;
  expectedFunding: number;
  fundingTimeline: number;
  
  // Calculated metrics
  currentRunway: number;
  runwayWithGrowth: number;
  cashAtFunding: number;
  extendedRunway: number;
  breakEvenDate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface Scenario {
  name: string;
  description: string;
  growthMultiplier: number;
  burnMultiplier: number;
}

const scenarios: Scenario[] = [
  {
    name: 'Best Case',
    description: '50% better growth, 10% lower burn',
    growthMultiplier: 1.5,
    burnMultiplier: 0.9
  },
  {
    name: 'Expected',
    description: 'Current trajectory continues',
    growthMultiplier: 1.0,
    burnMultiplier: 1.0
  },
  {
    name: 'Conservative',
    description: '20% lower growth, 15% higher burn',
    growthMultiplier: 0.8,
    burnMultiplier: 1.15
  },
  {
    name: 'Worst Case',
    description: '50% lower growth, 30% higher burn',
    growthMultiplier: 0.5,
    burnMultiplier: 1.3
  }
];

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${Math.round(value).toLocaleString()}`;
};

const formatMonths = (months: number): string => {
  if (months < 0) return '0 months';
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round(months % 12);
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years} years`;
  }
  return `${Math.round(months)} months`;
};

const getRiskLevel = (months: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (months >= 18) return 'low';
  if (months >= 12) return 'medium';
  if (months >= 6) return 'high';
  return 'critical';
};

const getRiskColor = (risk: string): string => {
  switch (risk) {
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const MetricCard = ({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  risk
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  risk?: 'low' | 'medium' | 'high' | 'critical';
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {risk && (
              <Badge className={`mt-2 text-xs ${getRiskColor(risk)}`}>
                {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
              </Badge>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};

export default function StartupRunwayCalculator() {
  const [metrics, setMetrics] = useState<RunwayMetrics>({
    currentCash: 2000000,
    monthlyBurn: 150000,
    monthlyRevenue: 50000,
    revenueGrowthRate: 15,
    expectedFunding: 5000000,
    fundingTimeline: 6,
    
    currentRunway: 0,
    runwayWithGrowth: 0,
    cashAtFunding: 0,
    extendedRunway: 0,
    breakEvenDate: 0,
    riskLevel: 'medium'
  });

  const calculateMetrics = useCallback((currentMetrics: RunwayMetrics) => {
    const newMetrics = { ...currentMetrics };
    
    // Current runway (simple)
    newMetrics.currentRunway = currentMetrics.currentCash / currentMetrics.monthlyBurn;
    
    // Calculate runway with revenue growth
    let cash = currentMetrics.currentCash;
    let revenue = currentMetrics.monthlyRevenue;
    let months = 0;
    const monthlyGrowthRate = currentMetrics.revenueGrowthRate / 100;
    
    while (cash > 0 && months < 60) { // Cap at 5 years
      const netBurn = currentMetrics.monthlyBurn - revenue;
      if (netBurn <= 0) break; // Break even reached
      
      cash -= netBurn;
      revenue *= (1 + monthlyGrowthRate);
      months++;
    }
    
    newMetrics.runwayWithGrowth = months;
    
    // Cash at expected funding date
    let fundingCash = currentMetrics.currentCash;
    let fundingRevenue = currentMetrics.monthlyRevenue;
    for (let i = 0; i < currentMetrics.fundingTimeline; i++) {
      const netBurn = currentMetrics.monthlyBurn - fundingRevenue;
      fundingCash -= netBurn;
      fundingRevenue *= (1 + monthlyGrowthRate);
    }
    newMetrics.cashAtFunding = Math.max(0, fundingCash);
    
    // Extended runway with funding
    const totalCashAfterFunding = newMetrics.cashAtFunding + currentMetrics.expectedFunding;
    newMetrics.extendedRunway = newMetrics.runwayWithGrowth + (totalCashAfterFunding / currentMetrics.monthlyBurn);
    
    // Break even calculation
    let breakEvenMonths = 0;
    let breakEvenRevenue = currentMetrics.monthlyRevenue;
    while (breakEvenRevenue < currentMetrics.monthlyBurn && breakEvenMonths < 60) {
      breakEvenRevenue *= (1 + monthlyGrowthRate);
      breakEvenMonths++;
    }
    newMetrics.breakEvenDate = breakEvenMonths;
    
    // Risk assessment
    newMetrics.riskLevel = getRiskLevel(newMetrics.runwayWithGrowth);
    
    return newMetrics;
  }, []);

  useEffect(() => {
    setMetrics(prevMetrics => calculateMetrics(prevMetrics));
  }, [metrics.currentCash, metrics.monthlyBurn, metrics.monthlyRevenue, metrics.revenueGrowthRate, metrics.expectedFunding, metrics.fundingTimeline, calculateMetrics]);

  const updateMetric = (key: keyof RunwayMetrics, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMetrics(prev => ({ ...prev, [key]: numValue }));
  };

  const calculateScenario = (scenario: Scenario) => {
    const adjustedGrowthRate = metrics.revenueGrowthRate * scenario.growthMultiplier;
    const adjustedBurn = metrics.monthlyBurn * scenario.burnMultiplier;
    
    let cash = metrics.currentCash;
    let revenue = metrics.monthlyRevenue;
    let months = 0;
    const monthlyGrowthRate = adjustedGrowthRate / 100;
    
    while (cash > 0 && months < 60) {
      const netBurn = adjustedBurn - revenue;
      if (netBurn <= 0) break;
      
      cash -= netBurn;
      revenue *= (1 + monthlyGrowthRate);
      months++;
    }
    
    return months;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Startup Runway Calculator</h2>
        <p className="text-muted-foreground">
          Model your cash runway across different scenarios. Plan for the worst, hope for the best.
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Financial Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currentCash">Current Cash ($)</Label>
              <Input
                id="currentCash"
                type="number"
                value={metrics.currentCash}
                onChange={(e) => updateMetric('currentCash', e.target.value)}
                placeholder="2000000"
              />
            </div>
            
            <div>
              <Label htmlFor="monthlyBurn">Monthly Burn Rate ($)</Label>
              <Input
                id="monthlyBurn"
                type="number"
                value={metrics.monthlyBurn}
                onChange={(e) => updateMetric('monthlyBurn', e.target.value)}
                placeholder="150000"
              />
            </div>
            
            <div>
              <Label htmlFor="monthlyRevenue">Monthly Revenue ($)</Label>
              <Input
                id="monthlyRevenue"
                type="number"
                value={metrics.monthlyRevenue}
                onChange={(e) => updateMetric('monthlyRevenue', e.target.value)}
                placeholder="50000"
              />
            </div>
            
            <div>
              <Label htmlFor="revenueGrowthRate">Monthly Growth Rate (%)</Label>
              <Input
                id="revenueGrowthRate"
                type="number"
                value={metrics.revenueGrowthRate}
                onChange={(e) => updateMetric('revenueGrowthRate', e.target.value)}
                placeholder="15"
              />
            </div>
            
            <div>
              <Label htmlFor="expectedFunding">Expected Funding ($)</Label>
              <Input
                id="expectedFunding"
                type="number"
                value={metrics.expectedFunding}
                onChange={(e) => updateMetric('expectedFunding', e.target.value)}
                placeholder="5000000"
              />
            </div>
            
            <div>
              <Label htmlFor="fundingTimeline">Funding Timeline (months)</Label>
              <Input
                id="fundingTimeline"
                type="number"
                value={metrics.fundingTimeline}
                onChange={(e) => updateMetric('fundingTimeline', e.target.value)}
                placeholder="6"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Runway"
          value={formatMonths(metrics.currentRunway)}
          subtitle="At current burn rate"
          icon={Calendar}
          risk={metrics.riskLevel}
        />
        
        <MetricCard
          title="Runway with Growth"
          value={formatMonths(metrics.runwayWithGrowth)}
          subtitle="Including revenue growth"
          icon={TrendingDown}
        />
        
        <MetricCard
          title="Cash at Funding"
          value={formatCurrency(metrics.cashAtFunding)}
          subtitle={`In ${metrics.fundingTimeline} months`}
          icon={DollarSign}
        />
        
        <MetricCard
          title="Break Even"
          value={formatMonths(metrics.breakEvenDate)}
          subtitle="Revenue = Burn rate"
          icon={Zap}
        />
      </div>

      {/* Scenario Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarios.map((scenario) => {
              const scenarioRunway = calculateScenario(scenario);
              const risk = getRiskLevel(scenarioRunway);
              
              return (
                <Card key={scenario.name} className="border-2">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h3 className="font-semibold mb-1">{scenario.name}</h3>
                      <p className="text-2xl font-bold mb-2">{formatMonths(scenarioRunway)}</p>
                      <p className="text-xs text-muted-foreground mb-2">{scenario.description}</p>
                      <Badge className={`text-xs ${getRiskColor(risk)}`}>
                        {risk.charAt(0).toUpperCase() + risk.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Insights & Warnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {metrics.runwayWithGrowth < 6 && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300">
                  🚨 <strong>Critical:</strong> Only {formatMonths(metrics.runwayWithGrowth)} runway remaining. 
                  Immediate action required - cut costs, accelerate funding, or pivot.
                </p>
              </div>
            )}
            
            {metrics.runwayWithGrowth >= 6 && metrics.runwayWithGrowth < 12 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-orange-800 dark:text-orange-300">
                  ⚠️ <strong>Warning:</strong> {formatMonths(metrics.runwayWithGrowth)} runway. 
                  Start fundraising now or implement cost reduction measures.
                </p>
              </div>
            )}
            
            {metrics.cashAtFunding < 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300">
                  💸 You'll run out of cash before your expected funding date. 
                  Either accelerate funding by {Math.abs(Math.round(metrics.cashAtFunding / metrics.monthlyBurn))} months or reduce burn rate.
                </p>
              </div>
            )}
            
            {metrics.breakEvenDate < metrics.runwayWithGrowth && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-300">
                  🎯 <strong>Great news:</strong> You'll reach break-even ({formatMonths(metrics.breakEvenDate)}) 
                  before running out of cash. Focus on maintaining growth trajectory.
                </p>
              </div>
            )}
            
            {metrics.revenueGrowthRate < 10 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300">
                  📈 Growth rate of {metrics.revenueGrowthRate}% is below typical startup benchmarks. 
                  Consider focusing on growth acceleration or extending runway through cost cuts.
                </p>
              </div>
            )}
            
            {metrics.runwayWithGrowth >= 18 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-300">
                  ✅ <strong>Healthy runway:</strong> {formatMonths(metrics.runwayWithGrowth)} gives you 
                  flexibility to optimize for growth rather than survival. Consider strategic investments.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}