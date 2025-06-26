import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface TestConfig {
  controlConversion: number
  variantConversion: number
  sampleSize: number
  confidenceLevel: number
}

interface TestResults {
  zScore: number
  pValue: number
  isSignificant: boolean
  confidenceInterval: [number, number]
  minimumDetectableEffect: number
  powerAnalysis: number
  recommendation: string
}

export default function ABTestSimulator() {
  const [config, setConfig] = useState<TestConfig>({
    controlConversion: 5.0,
    variantConversion: 6.0,
    sampleSize: 1000,
    confidenceLevel: 95,
  })

  const [results, setResults] = useState<TestResults>({
    zScore: 0,
    pValue: 0,
    isSignificant: false,
    confidenceInterval: [0, 0],
    minimumDetectableEffect: 0,
    powerAnalysis: 0,
    recommendation: '',
  })

  const [scenarios, setScenarios] = useState<
    Array<{ name: string; config: TestConfig }>
  >([])

  const calculateResults = useCallback(() => {
    const {
      controlConversion,
      variantConversion,
      sampleSize,
      confidenceLevel,
    } = config

    const p1 = controlConversion / 100
    const p2 = variantConversion / 100
    const n = sampleSize

    // Calculate pooled proportion
    const pooledP = (p1 + p2) / 2
    const standardError = Math.sqrt(pooledP * (1 - pooledP) * (2 / n))

    // Calculate z-score
    const zScore = (p2 - p1) / standardError

    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))

    // Determine significance
    const alpha = (100 - confidenceLevel) / 100
    const isSignificant = pValue < alpha

    // Calculate confidence interval for difference
    const criticalZ = getZCritical(confidenceLevel)
    const marginOfError = criticalZ * standardError
    const difference = p2 - p1
    const confidenceInterval: [number, number] = [
      (difference - marginOfError) * 100,
      (difference + marginOfError) * 100,
    ]

    // Calculate minimum detectable effect (80% power)
    const powerZ = 0.84 // Z-score for 80% power
    const minimumDetectableEffect =
      (criticalZ + powerZ) * Math.sqrt((2 * p1 * (1 - p1)) / n) * 100

    // Power analysis (simplified)
    const effectSize = Math.abs(difference) / Math.sqrt(p1 * (1 - p1))
    const powerAnalysis = Math.min(
      95,
      Math.max(5, normalCDF(Math.abs(zScore) - criticalZ) * 100)
    )

    // Generate recommendation
    let recommendation = ''
    if (isSignificant && powerAnalysis > 80) {
      recommendation =
        '🟢 Strong result: Statistically significant with good power. Safe to implement.'
    } else if (isSignificant && powerAnalysis <= 80) {
      recommendation =
        '🟡 Weak significance: Statistically significant but underpowered. Consider larger sample.'
    } else if (!isSignificant && powerAnalysis > 80) {
      recommendation =
        '🟠 No effect detected: Well-powered test shows no significant difference.'
    } else {
      recommendation =
        '🔴 Inconclusive: Neither significant nor well-powered. Need more data.'
    }

    setResults({
      zScore: Math.round(zScore * 100) / 100,
      pValue: Math.round(pValue * 10000) / 10000,
      isSignificant,
      confidenceInterval,
      minimumDetectableEffect: Math.round(minimumDetectableEffect * 100) / 100,
      powerAnalysis: Math.round(powerAnalysis),
      recommendation,
    })
  }, [config, normalCDF, getZCritical])

  useEffect(() => {
    calculateResults()
  }, [calculateResults])

  // Error function approximation
  const erf = useCallback((x: number): number => {
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }, [])

  // Normal CDF approximation
  const normalCDF = useCallback(
    (x: number): number => {
      return 0.5 * (1 + erf(x / Math.sqrt(2)))
    },
    [erf]
  )

  const getZCritical = useCallback((confidenceLevel: number): number => {
    const alpha = (100 - confidenceLevel) / 100
    // Approximations for common confidence levels
    if (confidenceLevel === 90) return 1.645
    if (confidenceLevel === 95) return 1.96
    if (confidenceLevel === 99) return 2.576
    return 1.96 // Default to 95%
  }, [])

  const handleInputChange = (
    field: keyof TestConfig,
    value: string | number
  ) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
    setConfig((prev) => ({
      ...prev,
      [field]: numValue,
    }))
  }

  const addScenario = () => {
    const name = `Scenario ${scenarios.length + 1}`
    setScenarios((prev) => [...prev, { name, config: { ...config } }])
  }

  const loadScenario = (scenarioConfig: TestConfig) => {
    setConfig(scenarioConfig)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            A/B Test Statistical Significance Calculator
          </CardTitle>
          <p className="text-muted-foreground text-center">
            Understand what your test results really mean beyond just p-values
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Test Configuration</h3>

              <div className="space-y-2">
                <Label htmlFor="control">Control Conversion Rate (%)</Label>
                <Input
                  id="control"
                  type="number"
                  step="0.1"
                  value={config.controlConversion}
                  onChange={(e) =>
                    handleInputChange('controlConversion', e.target.value)
                  }
                  placeholder="5.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant">Variant Conversion Rate (%)</Label>
                <Input
                  id="variant"
                  type="number"
                  step="0.1"
                  value={config.variantConversion}
                  onChange={(e) =>
                    handleInputChange('variantConversion', e.target.value)
                  }
                  placeholder="6.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sample">Sample Size (per variant)</Label>
                <Input
                  id="sample"
                  type="number"
                  value={config.sampleSize}
                  onChange={(e) =>
                    handleInputChange('sampleSize', e.target.value)
                  }
                  placeholder="1000"
                />
              </div>

              <div className="space-y-3">
                <Label>Confidence Level: {config.confidenceLevel}%</Label>
                <Slider
                  value={[config.confidenceLevel]}
                  onValueChange={(value) =>
                    handleInputChange('confidenceLevel', value[0])
                  }
                  min={80}
                  max={99}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button
                onClick={addScenario}
                variant="outline"
                className="w-full"
              >
                Save Scenario
              </Button>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">
                Statistical Results
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm text-muted-foreground">
                    Statistical Significance
                  </div>
                  <div className="text-xl font-bold flex items-center gap-2">
                    <Badge
                      variant={results.isSignificant ? 'default' : 'secondary'}
                    >
                      {results.isSignificant
                        ? 'Significant'
                        : 'Not Significant'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    p-value: {results.pValue.toFixed(4)}
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm text-muted-foreground">Z-Score</div>
                  <div className="text-xl font-bold">{results.zScore}</div>
                </div>

                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm text-muted-foreground">
                    Statistical Power
                  </div>
                  <div className="text-xl font-bold">
                    {results.powerAnalysis}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {results.powerAnalysis >= 80
                      ? 'Well-powered'
                      : 'Underpowered'}
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm text-muted-foreground">
                    Confidence Interval
                  </div>
                  <div className="text-sm font-mono">
                    [{results.confidenceInterval[0].toFixed(2)}%,{' '}
                    {results.confidenceInterval[1].toFixed(2)}%]
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Analysis</h3>

              <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/10 to-background">
                <div className="text-sm font-medium mb-2">Recommendation</div>
                <div className="text-sm">{results.recommendation}</div>
              </div>

              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  Minimum Detectable Effect
                </div>
                <div className="text-lg font-bold">
                  {results.minimumDetectableEffect.toFixed(2)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Smallest change this test can reliably detect
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div>• Statistical significance ≠ practical significance</div>
                <div>• Power analysis shows test reliability</div>
                <div>• Confidence intervals show effect size range</div>
                <div>• Consider business impact, not just p-values</div>
              </div>

              {scenarios.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Saved Scenarios</h4>
                  <div className="space-y-2">
                    {scenarios.map((scenario, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => loadScenario(scenario.config)}
                        className="w-full text-left justify-start"
                      >
                        {scenario.name}: {scenario.config.controlConversion}% →{' '}
                        {scenario.config.variantConversion}%
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
