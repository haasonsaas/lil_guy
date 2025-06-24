import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Share2, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import { useInteractiveDemo } from '@/hooks/useInteractiveDemo';
import { useNumberFormatter } from '@/hooks/useNumberFormatter';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

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

const defaultMetrics: Metrics = {
  monthlyRevenue: 100,
  churnRate: 5,
  cac: 500,
  grossMargin: 80
};

function calculateUnitEconomics(metrics: Metrics): Results {
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

  return {
    ltv: Math.round(ltv),
    ltvCacRatio: Math.round(ltvCacRatio * 10) / 10,
    paybackPeriod: Math.round(paybackPeriod * 10) / 10,
    isHealthy,
    recommendation
  };
}

function validateMetrics(metrics: Metrics): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  if (metrics.monthlyRevenue < 0) errors.push('Monthly revenue cannot be negative');
  if (metrics.churnRate < 0 || metrics.churnRate > 100) errors.push('Churn rate must be between 0-100%');
  if (metrics.cac < 0) errors.push('CAC cannot be negative');
  if (metrics.grossMargin < 0 || metrics.grossMargin > 100) errors.push('Gross margin must be between 0-100%');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export default function UnitEconomicsCalculator() {
  const { formatCurrency } = useNumberFormatter();
  
  const {
    config,
    results,
    isCalculating,
    errors,
    updateConfig,
    reset,
    exportData,
    shareUrl,
    copyResults,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useInteractiveDemo<Metrics, Results>({
    demoId: 'unit-economics',
    defaultConfig: defaultMetrics,
    calculateFn: calculateUnitEconomics,
    validateConfig: validateMetrics,
    debounceMs: 300,
    enablePersistence: true,
    enableAnalytics: true,
  });

  // Animated values for display
  const animatedLTV = useAnimatedCounter(results.ltv || 0, {
    format: 'currency',
    duration: 600,
  });
  
  const animatedRatio = useAnimatedCounter(results.ltvCacRatio || 0, {
    format: 'number',
    decimals: 1,
    suffix: ':1',
    duration: 600,
  });
  
  const animatedPayback = useAnimatedCounter(results.paybackPeriod || 0, {
    format: 'number',
    decimals: 1,
    suffix: ' months',
    duration: 600,
  });

  const handleInputChange = (field: keyof Metrics, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateConfig({ [field]: numValue });
  };

  const handleShare = () => {
    const url = shareUrl();
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                Unit Economics Calculator
              </CardTitle>
              <p className="text-muted-foreground">
                Input your metrics to see your LTV:CAC ratio and business health
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={undo}
                disabled={!canUndo}
                title="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={redo}
                disabled={!canRedo}
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={reset}
                title="Reset to defaults"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                title="Share configuration"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={exportData}
                title="Export data"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              {errors.map((error, i) => (
                <p key={i} className="text-sm text-red-800 dark:text-red-300">{error}</p>
              ))}
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Your Metrics</h3>
              
              <div className="space-y-2">
                <Label htmlFor="revenue">Average Monthly Revenue per Customer</Label>
                <Input
                  id="revenue"
                  type="number"
                  value={config.monthlyRevenue}
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
                  value={config.churnRate}
                  onChange={(e) => handleInputChange('churnRate', e.target.value)}
                  placeholder="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cac">Customer Acquisition Cost (CAC)</Label>
                <Input
                  id="cac"
                  type="number"
                  value={config.cac}
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
                  value={config.grossMargin}
                  onChange={(e) => handleInputChange('grossMargin', e.target.value)}
                  placeholder="80"
                />
              </div>
              
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={copyResults}
                >
                  Copy Results to Clipboard
                </Button>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Results</h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm text-muted-foreground">Customer Lifetime Value (LTV)</div>
                  <div className="text-2xl font-bold">{animatedLTV}</div>
                </div>

                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm text-muted-foreground">LTV:CAC Ratio</div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {animatedRatio}
                    <Badge variant={results.isHealthy ? "default" : "destructive"}>
                      {results.isHealthy ? "Healthy" : "Unhealthy"}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm text-muted-foreground">Payback Period</div>
                  <div className="text-2xl font-bold">{animatedPayback}</div>
                </div>

                <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/10 to-background">
                  <div className="text-sm font-medium mb-2">Assessment</div>
                  <div className="text-sm">{results.recommendation || 'Enter values to see assessment'}</div>
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