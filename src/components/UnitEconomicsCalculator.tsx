import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Metrics {
  monthlyRevenue: number;
  churnRate: number;
  cac: number;
  grossMargin: number;
}

interface Results {
  ltv: number;
  ltvCacRatio: number;
  paybackPeriod: number;
  isHealthy: boolean;
  recommendation: string;
}

export default function UnitEconomicsCalculator() {
  const [metrics, setMetrics] = useState<Metrics>({
    monthlyRevenue: 100,
    churnRate: 5,
    cac: 500,
    grossMargin: 80
  });

  const [results, setResults] = useState<Results>({
    ltv: 0,
    ltvCacRatio: 0,
    paybackPeriod: 0,
    isHealthy: false,
    recommendation: ''
  });

  useEffect(() => {
    calculateMetrics();
  }, [metrics]);

  const calculateMetrics = () => {
    const { monthlyRevenue, churnRate, cac, grossMargin } = metrics;
    
    // LTV = (ARPU × Gross Margin %) ÷ Monthly Churn Rate
    const arpu = monthlyRevenue;
    const monthlyChurnRate = churnRate / 100;
    const grossMarginDecimal = grossMargin / 100;
    
    const ltv = monthlyChurnRate > 0 ? (arpu * grossMarginDecimal) / monthlyChurnRate : 0;
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    const paybackPeriod = (arpu * grossMarginDecimal) > 0 ? cac / (arpu * grossMarginDecimal) : 0;

    let recommendation = '';
    let isHealthy = false;

    if (ltvCacRatio >= 3) {
      isHealthy = true;
      recommendation = '🟢 Excellent! Your unit economics are strong and sustainable.';
    } else if (ltvCacRatio >= 2) {
      isHealthy = true;
      recommendation = '🟡 Good foundation, but room for improvement in efficiency.';
    } else if (ltvCacRatio >= 1) {
      recommendation = '🟠 Concerning - you\'re barely profitable. Focus on retention or reduce CAC.';
    } else {
      recommendation = '🔴 Critical - you\'re losing money on every customer. Immediate action needed.';
    }

    setResults({
      ltv: Math.round(ltv),
      ltvCacRatio: Math.round(ltvCacRatio * 10) / 10,
      paybackPeriod: Math.round(paybackPeriod * 10) / 10,
      isHealthy,
      recommendation
    });
  };

  const handleInputChange = (field: keyof Metrics, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMetrics(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Unit Economics Calculator
          </CardTitle>
          <p className="text-muted-foreground text-center">
            Input your metrics to see your LTV:CAC ratio and business health
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Your Metrics</h3>
              
              <div className="space-y-2">
                <Label htmlFor="revenue">Average Monthly Revenue per Customer</Label>
                <Input
                  id="revenue"
                  type="number"
                  value={metrics.monthlyRevenue}
                  onChange={(e) => handleInputChange('monthlyRevenue', e.target.value)}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="churn">Monthly Churn Rate (%)</Label>
                <Input
                  id="churn"
                  type="number"
                  step="0.1"
                  value={metrics.churnRate}
                  onChange={(e) => handleInputChange('churnRate', e.target.value)}
                  placeholder="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cac">Customer Acquisition Cost (CAC)</Label>
                <Input
                  id="cac"
                  type="number"
                  value={metrics.cac}
                  onChange={(e) => handleInputChange('cac', e.target.value)}
                  placeholder="500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin">Gross Margin (%)</Label>
                <Input
                  id="margin"
                  type="number"
                  step="1"
                  value={metrics.grossMargin}
                  onChange={(e) => handleInputChange('grossMargin', e.target.value)}
                  placeholder="80"
                />
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Results</h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm text-muted-foreground">Customer Lifetime Value (LTV)</div>
                  <div className="text-2xl font-bold">{formatCurrency(results.ltv)}</div>
                </div>

                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm text-muted-foreground">LTV:CAC Ratio</div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {results.ltvCacRatio}:1
                    <Badge variant={results.isHealthy ? "default" : "destructive"}>
                      {results.isHealthy ? "Healthy" : "Unhealthy"}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm text-muted-foreground">Payback Period</div>
                  <div className="text-2xl font-bold">{results.paybackPeriod} months</div>
                </div>

                <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/10 to-background">
                  <div className="text-sm font-medium mb-2">Assessment</div>
                  <div className="text-sm">{results.recommendation}</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mt-4 space-y-1">
                <div>• LTV = (Monthly Revenue × Gross Margin) ÷ Churn Rate</div>
                <div>• Target LTV:CAC ratio is 3:1 or higher</div>
                <div>• Payback period should be under 12 months</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}