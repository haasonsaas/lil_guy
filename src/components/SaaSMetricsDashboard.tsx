import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, Target } from 'lucide-react';

interface SaaSMetrics {
  // Input metrics
  mrr: number;
  newMrr: number;
  churnedMrr: number;
  cac: number;
  averageSellingPrice: number;
  grossMargin: number;
  
  // Calculated metrics
  netNewMrr: number;
  mrrGrowthRate: number;
  ltv: number;
  ltvCacRatio: number;
  cacPaybackPeriod: number;
  arr: number;
  churnRate: number;
  revenueChurnRate: number;
  npsScore: number;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const getHealthScore = (metric: string, value: number): { score: 'excellent' | 'good' | 'warning' | 'danger', message: string } => {
  switch (metric) {
    case 'ltvCacRatio':
      if (value >= 3) return { score: 'excellent', message: 'Excellent LTV:CAC ratio' };
      if (value >= 2) return { score: 'good', message: 'Good LTV:CAC ratio' };
      if (value >= 1.5) return { score: 'warning', message: 'Below benchmark' };
      return { score: 'danger', message: 'Critical - unsustainable' };
    
    case 'cacPaybackPeriod':
      if (value <= 12) return { score: 'excellent', message: 'Fast payback period' };
      if (value <= 18) return { score: 'good', message: 'Acceptable payback' };
      if (value <= 24) return { score: 'warning', message: 'Slow payback' };
      return { score: 'danger', message: 'Very slow payback' };
    
    case 'mrrGrowthRate':
      if (value >= 20) return { score: 'excellent', message: 'Hypergrowth' };
      if (value >= 10) return { score: 'good', message: 'Strong growth' };
      if (value >= 5) return { score: 'warning', message: 'Moderate growth' };
      return { score: 'danger', message: 'Slow growth' };
    
    case 'churnRate':
      if (value <= 2) return { score: 'excellent', message: 'Very low churn' };
      if (value <= 5) return { score: 'good', message: 'Good churn rate' };
      if (value <= 10) return { score: 'warning', message: 'High churn' };
      return { score: 'danger', message: 'Critical churn rate' };
    
    default:
      return { score: 'good', message: '' };
  }
};

const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  format = 'currency',
  health 
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  format?: 'currency' | 'percentage' | 'number' | 'months';
  health?: { score: 'excellent' | 'good' | 'warning' | 'danger', message: string };
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency': return formatCurrency(val);
      case 'percentage': return formatPercentage(val);
      case 'months': return `${val.toFixed(1)} months`;
      case 'number': return val.toFixed(1);
      default: return val.toString();
    }
  };

  const getHealthColor = (score: string) => {
    switch (score) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'danger': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatValue(value)}</p>
            {health && (
              <Badge className={`mt-1 text-xs ${getHealthColor(health.score)}`}>
                {health.message}
              </Badge>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};

export default function SaaSMetricsDashboard() {
  const [metrics, setMetrics] = useState<SaaSMetrics>({
    // Input metrics
    mrr: 50000,
    newMrr: 15000,
    churnedMrr: 5000,
    cac: 500,
    averageSellingPrice: 100,
    grossMargin: 80,
    
    // Calculated metrics (will be computed)
    netNewMrr: 0,
    mrrGrowthRate: 0,
    ltv: 0,
    ltvCacRatio: 0,
    cacPaybackPeriod: 0,
    arr: 0,
    churnRate: 0,
    revenueChurnRate: 0,
    npsScore: 0,
  });

  const calculateMetrics = () => {
    const newMetrics = { ...metrics };
    
    // Net New MRR
    newMetrics.netNewMrr = metrics.newMrr - metrics.churnedMrr;
    
    // MRR Growth Rate
    newMetrics.mrrGrowthRate = (newMetrics.netNewMrr / metrics.mrr) * 100;
    
    // ARR
    newMetrics.arr = metrics.mrr * 12;
    
    // Revenue Churn Rate
    newMetrics.revenueChurnRate = (metrics.churnedMrr / metrics.mrr) * 100;
    
    // Customer Churn Rate (approximation)
    const avgCustomers = metrics.mrr / metrics.averageSellingPrice;
    const churnedCustomers = metrics.churnedMrr / metrics.averageSellingPrice;
    newMetrics.churnRate = (churnedCustomers / avgCustomers) * 100;
    
    // LTV calculation (simplified)
    const monthlyChurnRate = newMetrics.churnRate / 100;
    const avgCustomerLifetime = monthlyChurnRate > 0 ? 1 / monthlyChurnRate : 50; // months
    newMetrics.ltv = metrics.averageSellingPrice * avgCustomerLifetime * (metrics.grossMargin / 100);
    
    // LTV:CAC Ratio
    newMetrics.ltvCacRatio = metrics.cac > 0 ? newMetrics.ltv / metrics.cac : 0;
    
    // CAC Payback Period
    const monthlyGrossRevenue = metrics.averageSellingPrice * (metrics.grossMargin / 100);
    newMetrics.cacPaybackPeriod = monthlyGrossRevenue > 0 ? metrics.cac / monthlyGrossRevenue : 0;
    
    setMetrics(newMetrics);
  };

  useEffect(() => {
    calculateMetrics();
  }, [metrics.mrr, metrics.newMrr, metrics.churnedMrr, metrics.cac, metrics.averageSellingPrice, metrics.grossMargin]);

  const updateMetric = (key: keyof SaaSMetrics, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMetrics(prev => ({ ...prev, [key]: numValue }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">SaaS Metrics Dashboard</h2>
        <p className="text-muted-foreground">
          See how your key metrics interconnect. Change one number and watch the ripple effects.
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Input Your Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="mrr">Current MRR ($)</Label>
              <Input
                id="mrr"
                type="number"
                value={metrics.mrr}
                onChange={(e) => updateMetric('mrr', e.target.value)}
                placeholder="50000"
              />
            </div>
            
            <div>
              <Label htmlFor="newMrr">New MRR This Month ($)</Label>
              <Input
                id="newMrr"
                type="number"
                value={metrics.newMrr}
                onChange={(e) => updateMetric('newMrr', e.target.value)}
                placeholder="15000"
              />
            </div>
            
            <div>
              <Label htmlFor="churnedMrr">Churned MRR This Month ($)</Label>
              <Input
                id="churnedMrr"
                type="number"
                value={metrics.churnedMrr}
                onChange={(e) => updateMetric('churnedMrr', e.target.value)}
                placeholder="5000"
              />
            </div>
            
            <div>
              <Label htmlFor="cac">Customer Acquisition Cost ($)</Label>
              <Input
                id="cac"
                type="number"
                value={metrics.cac}
                onChange={(e) => updateMetric('cac', e.target.value)}
                placeholder="500"
              />
            </div>
            
            <div>
              <Label htmlFor="averageSellingPrice">Average Monthly Price ($)</Label>
              <Input
                id="averageSellingPrice"
                type="number"
                value={metrics.averageSellingPrice}
                onChange={(e) => updateMetric('averageSellingPrice', e.target.value)}
                placeholder="100"
              />
            </div>
            
            <div>
              <Label htmlFor="grossMargin">Gross Margin (%)</Label>
              <Input
                id="grossMargin"
                type="number"
                value={metrics.grossMargin}
                onChange={(e) => updateMetric('grossMargin', e.target.value)}
                placeholder="80"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Net New MRR"
          value={metrics.netNewMrr}
          icon={metrics.netNewMrr >= 0 ? TrendingUp : TrendingDown}
          format="currency"
        />
        
        <MetricCard
          title="MRR Growth Rate"
          value={metrics.mrrGrowthRate}
          icon={TrendingUp}
          format="percentage"
          health={getHealthScore('mrrGrowthRate', metrics.mrrGrowthRate)}
        />
        
        <MetricCard
          title="Annual Run Rate"
          value={metrics.arr}
          icon={DollarSign}
          format="currency"
        />
        
        <MetricCard
          title="Customer Churn Rate"
          value={metrics.churnRate}
          icon={Users}
          format="percentage"
          health={getHealthScore('churnRate', metrics.churnRate)}
        />
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Customer LTV"
          value={metrics.ltv}
          icon={DollarSign}
          format="currency"
        />
        
        <MetricCard
          title="LTV:CAC Ratio"
          value={metrics.ltvCacRatio}
          icon={Target}
          format="number"
          health={getHealthScore('ltvCacRatio', metrics.ltvCacRatio)}
        />
        
        <MetricCard
          title="CAC Payback Period"
          value={metrics.cacPaybackPeriod}
          icon={Clock}
          format="months"
          health={getHealthScore('cacPaybackPeriod', metrics.cacPaybackPeriod)}
        />
      </div>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {metrics.ltvCacRatio < 2 && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300">
                  ⚠️ Your LTV:CAC ratio of {metrics.ltvCacRatio.toFixed(1)} is below the healthy minimum of 2:1. 
                  Consider improving retention or reducing acquisition costs.
                </p>
              </div>
            )}
            
            {metrics.cacPaybackPeriod > 18 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300">
                  ⏱️ CAC payback period of {metrics.cacPaybackPeriod.toFixed(1)} months is longer than ideal. 
                  Focus on increasing ARPU or improving gross margins.
                </p>
              </div>
            )}
            
            {metrics.churnRate > 5 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-orange-800 dark:text-orange-300">
                  📉 Monthly churn rate of {metrics.churnRate.toFixed(1)}% is high. 
                  Improving retention by just 1% would increase your LTV by ${((metrics.ltv * 0.2)).toLocaleString()}.
                </p>
              </div>
            )}
            
            {metrics.mrrGrowthRate >= 15 && metrics.ltvCacRatio >= 3 && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-300">
                  🚀 Excellent metrics! You're in the top tier of SaaS companies. 
                  Consider scaling your acquisition efforts.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}