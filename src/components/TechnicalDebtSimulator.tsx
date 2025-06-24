import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface DebtConfig {
  initialVelocity: number;
  debtAccumulation: number;
  maintenanceEffort: number;
  refactoringEffort: number;
  timeHorizon: number;
}

interface Scenario {
  name: string;
  velocityOverTime: number[];
  cumulativeFeatures: number[];
  debtLevel: number[];
  totalCost: number;
  description: string;
}

export default function TechnicalDebtSimulator() {
  const [config, setConfig] = useState<DebtConfig>({
    initialVelocity: 10,
    debtAccumulation: 15,
    maintenanceEffort: 20,
    refactoringEffort: 30,
    timeHorizon: 24
  });

  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const calculateScenarios = useCallback(() => {
    const { initialVelocity, debtAccumulation, maintenanceEffort, refactoringEffort, timeHorizon } = config;
    
    // Scenario 1: Keep accumulating debt
    const accumulateDebt = simulateDebt({
      ...config,
      refactoringEffort: 0
    }, 'Keep Accumulating');

    // Scenario 2: Aggressive refactoring
    const aggressiveRefactor = simulateDebt({
      ...config,
      refactoringEffort: refactoringEffort
    }, 'Aggressive Refactoring');

    // Scenario 3: Balanced approach
    const balanced = simulateDebt({
      ...config,
      refactoringEffort: refactoringEffort * 0.5
    }, 'Balanced Approach');

    setScenarios([accumulateDebt, aggressiveRefactor, balanced]);
  }, [config]);

  useEffect(() => {
    calculateScenarios();
  }, [calculateScenarios]);

  const simulateDebt = (params: DebtConfig, name: string): Scenario => {
    const { initialVelocity, debtAccumulation, maintenanceEffort, refactoringEffort, timeHorizon } = params;
    
    const velocityOverTime: number[] = [];
    const cumulativeFeatures: number[] = [];
    const debtLevel: number[] = [];
    
    const currentVelocity = initialVelocity;
    let currentDebt = 0;
    let totalFeatures = 0;
    let totalCost = 0;

    for (let month = 0; month <= timeHorizon; month++) {
      // Calculate debt impact on velocity
      const debtDrag = (currentDebt / 100) * (maintenanceEffort / 100);
      const effectiveVelocity = Math.max(0.1, currentVelocity * (1 - debtDrag));
      
      // Calculate refactoring effort allocation
      const refactoringAllocation = refactoringEffort / 100;
      const featureAllocation = 1 - refactoringAllocation;
      
      // Features delivered this month
      const featuresThisMonth = effectiveVelocity * featureAllocation;
      
      // Debt changes
      const debtAdded = featuresThisMonth * (debtAccumulation / 100);
      const debtRemoved = effectiveVelocity * refactoringAllocation * 2; // Refactoring is 2x effective at removing debt
      
      currentDebt = Math.max(0, currentDebt + debtAdded - debtRemoved);
      totalFeatures += featuresThisMonth;
      totalCost += effectiveVelocity * (1 + (currentDebt / 100) * 0.3); // Debt increases development cost
      
      velocityOverTime.push(Math.round(effectiveVelocity * 10) / 10);
      cumulativeFeatures.push(Math.round(totalFeatures * 10) / 10);
      debtLevel.push(Math.round(currentDebt * 10) / 10);
    }

    let description = '';
    if (name === 'Keep Accumulating') {
      description = '🔴 Velocity crashes as debt compounds. Short-term gains, long-term pain.';
    } else if (name === 'Aggressive Refactoring') {
      description = '🟢 Slower start but maintains velocity. Sustainable long-term delivery.';
    } else {
      description = '🟡 Balanced approach. Some debt management with steady feature delivery.';
    }

    return {
      name,
      velocityOverTime,
      cumulativeFeatures,
      debtLevel,
      totalCost: Math.round(totalCost),
      description
    };
  };

  const handleInputChange = (field: keyof DebtConfig, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setConfig(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const getScenarioColor = (index: number) => {
    const colors = ['text-red-600', 'text-green-600', 'text-yellow-600'];
    return colors[index] || 'text-gray-600';
  };

  const getBestScenario = () => {
    if (scenarios.length === 0) return null;
    return scenarios.reduce((best, current) => 
      current.cumulativeFeatures[current.cumulativeFeatures.length - 1] > 
      best.cumulativeFeatures[best.cumulativeFeatures.length - 1] ? current : best
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Technical Debt Impact Simulator
          </CardTitle>
          <p className="text-muted-foreground text-center">
            See how technical debt compounds and impacts engineering velocity over time
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Configuration</h3>
              
              <div className="space-y-2">
                <Label htmlFor="velocity">Initial Velocity (features/month)</Label>
                <Input
                  id="velocity"
                  type="number"
                  value={config.initialVelocity}
                  onChange={(e) => handleInputChange('initialVelocity', e.target.value)}
                  placeholder="10"
                />
              </div>

              <div className="space-y-3">
                <Label>Debt Accumulation Rate: {config.debtAccumulation}%</Label>
                <Slider
                  value={[config.debtAccumulation]}
                  onValueChange={(value) => handleInputChange('debtAccumulation', value[0])}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  How much debt each feature adds
                </div>
              </div>

              <div className="space-y-3">
                <Label>Maintenance Drag: {config.maintenanceEffort}%</Label>
                <Slider
                  value={[config.maintenanceEffort]}
                  onValueChange={(value) => handleInputChange('maintenanceEffort', value[0])}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  How much debt slows development
                </div>
              </div>

              <div className="space-y-3">
                <Label>Refactoring Effort: {config.refactoringEffort}%</Label>
                <Slider
                  value={[config.refactoringEffort]}
                  onValueChange={(value) => handleInputChange('refactoringEffort', value[0])}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Team capacity dedicated to debt reduction
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horizon">Time Horizon (months)</Label>
                <Input
                  id="horizon"
                  type="number"
                  value={config.timeHorizon}
                  onChange={(e) => handleInputChange('timeHorizon', e.target.value)}
                  placeholder="24"
                />
              </div>
            </div>

            {/* Results Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Final Results</h3>
              
              {scenarios.map((scenario, index) => (
                <div key={scenario.name} className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm font-medium mb-2">{scenario.name}</div>
                  <div className="space-y-1 text-sm">
                    <div>Features: {scenario.cumulativeFeatures[scenario.cumulativeFeatures.length - 1]}</div>
                    <div>Final Velocity: {scenario.velocityOverTime[scenario.velocityOverTime.length - 1]}</div>
                    <div>Debt Level: {scenario.debtLevel[scenario.debtLevel.length - 1]}</div>
                  </div>
                  <div className={`text-xs mt-2 ${getScenarioColor(index)}`}>
                    {scenario.description}
                  </div>
                </div>
              ))}

              {getBestScenario() && (
                <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/10 to-background">
                  <div className="text-sm font-medium mb-2">Best Strategy</div>
                  <div className="text-sm">{getBestScenario()?.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Delivers most features over {config.timeHorizon} months
                  </div>
                </div>
              )}
            </div>

            {/* Velocity Chart */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Velocity Over Time</h3>
              
              <div className="space-y-2">
                {scenarios.map((scenario, scenarioIndex) => (
                  <div key={scenario.name} className="space-y-1">
                    <div className={`text-sm font-medium ${getScenarioColor(scenarioIndex)}`}>
                      {scenario.name}
                    </div>
                    <div className="flex gap-1">
                      {scenario.velocityOverTime.slice(0, 12).map((velocity, monthIndex) => (
                        <div
                          key={monthIndex}
                          className={`w-4 bg-gradient-to-t ${
                            scenarioIndex === 0 ? 'from-red-200 to-red-500' :
                            scenarioIndex === 1 ? 'from-green-200 to-green-500' :
                            'from-yellow-200 to-yellow-500'
                          }`}
                          style={{ 
                            height: `${Math.max(4, (velocity / config.initialVelocity) * 40)}px`,
                            opacity: 0.8
                          }}
                          title={`Month ${monthIndex + 1}: ${velocity} features`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground">
                First 12 months • Height = velocity
              </div>
            </div>

            {/* Key Insights */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
              
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded bg-blue-50 dark:bg-blue-950/20">
                  <div className="font-medium">Compound Interest Effect</div>
                  <div className="text-xs mt-1">
                    Technical debt compounds like financial debt, growing exponentially if ignored.
                  </div>
                </div>

                <div className="p-3 rounded bg-yellow-50 dark:bg-yellow-950/20">
                  <div className="font-medium">Velocity Cliff</div>
                  <div className="text-xs mt-1">
                    Teams hit a wall where adding features becomes impossibly slow.
                  </div>
                </div>

                <div className="p-3 rounded bg-green-50 dark:bg-green-950/20">
                  <div className="font-medium">Investment Payoff</div>
                  <div className="text-xs mt-1">
                    Refactoring effort pays dividends in sustained velocity.
                  </div>
                </div>

                <div className="p-3 rounded bg-purple-50 dark:bg-purple-950/20">
                  <div className="font-medium">Sweet Spot</div>
                  <div className="text-xs mt-1">
                    20-30% capacity for debt management usually optimal.
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mt-4">
                <div>• Debt accumulation varies by team and codebase</div>
                <div>• Maintenance drag increases non-linearly</div>
                <div>• Early investment in quality pays long-term dividends</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}