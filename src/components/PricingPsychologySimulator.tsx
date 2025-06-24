import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface PricingConfig {
  basePrice: number;
  visitors: number;
  baseConversion: number;
  pricingSensitivity: number;
}

interface PricingStrategy {
  name: string;
  price: number;
  displayPrice: string;
  conversionRate: number;
  revenue: number;
  psychologyFactor: string;
  description: string;
}

export default function PricingPsychologySimulator() {
  const [config, setConfig] = useState<PricingConfig>({
    basePrice: 100,
    visitors: 1000,
    baseConversion: 5.0,
    pricingSensitivity: 20
  });

  const [strategies, setStrategies] = useState<PricingStrategy[]>([]);

  const calculateStrategies = useCallback(() => {
    const { basePrice, visitors, baseConversion, pricingSensitivity } = config;
    
    const newStrategies: PricingStrategy[] = [
      // Baseline - round number
      {
        name: 'Round Number',
        price: basePrice,
        displayPrice: `$${basePrice}`,
        conversionRate: baseConversion,
        revenue: 0,
        psychologyFactor: 'Simple & Clear',
        description: 'Clean, professional, builds trust'
      },
      
      // Charm pricing
      {
        name: 'Charm Pricing',
        price: basePrice - 1,
        displayPrice: `$${basePrice - 1}`,
        conversionRate: baseConversion * 1.15, // 15% boost from charm pricing
        revenue: 0,
        psychologyFactor: 'Left-Digit Bias',
        description: 'Appears significantly cheaper than $' + basePrice
      },
      
      // Prestigious pricing
      {
        name: 'Prestigious',
        price: basePrice + 20,
        displayPrice: `$${basePrice + 20}`,
        conversionRate: baseConversion * 0.85, // 15% reduction from higher price
        revenue: 0,
        psychologyFactor: 'Quality Signal',
        description: 'Higher price implies premium quality'
      },
      
      // Bundle anchoring
      {
        name: 'Anchored Bundle',
        price: basePrice * 0.75,
        displayPrice: `$${Math.round(basePrice * 0.75)} (was $${basePrice + 50})`,
        conversionRate: baseConversion * 1.25, // 25% boost from perceived savings
        revenue: 0,
        psychologyFactor: 'Anchoring Effect',
        description: 'Reference price makes offer seem like great value'
      },
      
      // Odd-even pricing
      {
        name: 'Precise Pricing',
        price: basePrice + 7,
        displayPrice: `$${basePrice + 7}`,
        conversionRate: baseConversion * 1.08, // 8% boost from precision bias
        revenue: 0,
        psychologyFactor: 'Precision Bias',
        description: 'Specific numbers feel more researched/justified'
      }
    ];

    // Calculate conversion rates based on price sensitivity
    const priceElasticity = pricingSensitivity / 100;
    
    newStrategies.forEach(strategy => {
      // Apply price elasticity to base conversion adjustments
      const priceChange = (strategy.price - basePrice) / basePrice;
      const elasticityEffect = 1 - (priceChange * priceElasticity);
      
      // Combine psychology factor with price elasticity
      let finalConversion = strategy.conversionRate * elasticityEffect;
      
      // Apply some limits to keep realistic
      finalConversion = Math.max(0.5, Math.min(finalConversion, baseConversion * 2));
      
      strategy.conversionRate = Math.round(finalConversion * 100) / 100;
      strategy.revenue = Math.round(visitors * (strategy.conversionRate / 100) * strategy.price);
    });

    setStrategies(newStrategies);
  }, [config]);

  useEffect(() => {
    calculateStrategies();
  }, [calculateStrategies]);

  const handleInputChange = (field: keyof PricingConfig, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setConfig(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const getBestStrategy = () => {
    if (strategies.length === 0) return null;
    return strategies.reduce((best, current) => 
      current.revenue > best.revenue ? current : best
    );
  };

  const getStrategyBadge = (strategy: PricingStrategy) => {
    const bestRevenue = getBestStrategy()?.revenue || 0;
    if (strategy.revenue === bestRevenue) return 'default';
    if (strategy.revenue > bestRevenue * 0.9) return 'secondary';
    return 'outline';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Pricing Psychology Impact Simulator
          </CardTitle>
          <p className="text-muted-foreground text-center">
            See how different pricing strategies affect conversion rates and revenue
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Base Configuration</h3>
              
              <div className="space-y-2">
                <Label htmlFor="price">Base Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  value={config.basePrice}
                  onChange={(e) => handleInputChange('basePrice', e.target.value)}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visitors">Monthly Visitors</Label>
                <Input
                  id="visitors"
                  type="number"
                  value={config.visitors}
                  onChange={(e) => handleInputChange('visitors', e.target.value)}
                  placeholder="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversion">Base Conversion Rate (%)</Label>
                <Input
                  id="conversion"
                  type="number"
                  step="0.1"
                  value={config.baseConversion}
                  onChange={(e) => handleInputChange('baseConversion', e.target.value)}
                  placeholder="5.0"
                />
              </div>

              <div className="space-y-3">
                <Label>Price Sensitivity: {config.pricingSensitivity}%</Label>
                <Slider
                  value={[config.pricingSensitivity]}
                  onValueChange={(value) => handleInputChange('pricingSensitivity', value[0])}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  How much conversion drops per 10% price increase
                </div>
              </div>

              {getBestStrategy() && (
                <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/10 to-background">
                  <div className="text-sm font-medium mb-2">Best Strategy</div>
                  <div className="text-lg font-bold">{getBestStrategy()?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ${getBestStrategy()?.revenue.toLocaleString()} monthly revenue
                  </div>
                </div>
              )}
            </div>

            {/* Strategy Comparison */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold mb-4">Strategy Comparison</h3>
              
              <div className="grid gap-4">
                {strategies.map((strategy, index) => (
                  <div key={strategy.name} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{strategy.name}</span>
                        <Badge variant={getStrategyBadge(strategy)}>
                          {strategy === getBestStrategy() ? 'Best' : 'Alternative'}
                        </Badge>
                      </div>
                      <div className="text-lg font-bold">{strategy.displayPrice}</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                      <div>
                        <div className="text-muted-foreground">Conversion</div>
                        <div className="font-medium">{strategy.conversionRate}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Revenue</div>
                        <div className="font-medium">${strategy.revenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Psychology</div>
                        <div className="font-medium">{strategy.psychologyFactor}</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {strategy.description}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                <h4 className="font-medium mb-2">Key Psychology Principles</h4>
                <div className="text-sm space-y-1">
                  <div>• <strong>Left-Digit Bias:</strong> $99 feels much cheaper than $100</div>
                  <div>• <strong>Anchoring:</strong> First price sets reference point for value</div>
                  <div>• <strong>Precision Bias:</strong> Specific prices seem more justified</div>
                  <div>• <strong>Quality Signaling:</strong> Higher prices can increase perceived value</div>
                  <div>• <strong>Loss Aversion:</strong> Showing savings motivates action</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div>• Effects vary by market, product, and customer segment</div>
                <div>• A/B testing is essential for validating pricing psychology</div>
                <div>• Combine multiple principles for maximum impact</div>
                <div>• Consider lifetime value, not just initial conversion</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}