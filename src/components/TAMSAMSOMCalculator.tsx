import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, Target, Users, DollarSign, TrendingUp, Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface MarketData {
  // TAM Inputs
  totalMarketSize: number;
  marketGrowthRate: number;
  
  // SAM Inputs
  geographicReach: number; // percentage of TAM addressable
  channelReach: number; // percentage reachable through your channels
  productFit: number; // percentage that fits your product category
  
  // SOM Inputs
  competitiveAdvantage: number; // strength score 1-10
  marketingBudget: number; // annual marketing spend
  salesEfficiency: number; // conversion rate percentage
  timeframe: number; // years to capture market
  
  // Calculated values
  sam: number;
  som: number;
  marketOpportunity: number;
  captureRate: number;
}

interface MarketAnalysis {
  tamSize: 'massive' | 'large' | 'medium' | 'small';
  samRealistic: boolean;
  somAchievable: boolean;
  investmentNeeded: number;
  timeToCapture: number;
  competitiveRisk: 'low' | 'medium' | 'high';
  recommendedStrategy: string;
}

const marketSizeCategories = [
  { label: 'Massive Market (>$50B)', value: 'massive', min: 50000000000 },
  { label: 'Large Market ($10B-$50B)', value: 'large', min: 10000000000 },
  { label: 'Medium Market ($1B-$10B)', value: 'medium', min: 1000000000 },
  { label: 'Small Market (<$1B)', value: 'small', min: 0 }
];

const formatCurrency = (value: number): string => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${Math.round(value).toLocaleString()}`;
};

const getMarketSizeCategory = (tam: number): 'massive' | 'large' | 'medium' | 'small' => {
  if (tam >= 50000000000) return 'massive';
  if (tam >= 10000000000) return 'large';
  if (tam >= 1000000000) return 'medium';
  return 'small';
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'massive': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'large': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'medium': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'small': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const MarketCard = ({ 
  title, 
  value, 
  percentage,
  icon: Icon, 
  description,
  color = 'blue'
}: {
  title: string;
  value: number;
  percentage?: number;
  icon: React.ElementType;
  description: string;
  color?: string;
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple': return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950';
      case 'blue': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      case 'green': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
    }
  };

  return (
    <Card className={`border-2 ${getColorClasses(color)}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color === 'purple' ? 'bg-purple-100 dark:bg-purple-900' : color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold">{formatCurrency(value)}</div>
          {percentage !== undefined && (
            <div className="flex items-center gap-2">
              <Progress value={percentage} className="flex-1" />
              <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function TAMSAMSOMCalculator() {
  const [marketData, setMarketData] = useState<MarketData>({
    totalMarketSize: 100000000000, // $100B
    marketGrowthRate: 15,
    geographicReach: 25,
    channelReach: 60,
    productFit: 40,
    competitiveAdvantage: 7,
    marketingBudget: 2000000, // $2M
    salesEfficiency: 5,
    timeframe: 5,
    sam: 0,
    som: 0,
    marketOpportunity: 0,
    captureRate: 0
  });

  const [analysis, setAnalysis] = useState<MarketAnalysis>({
    tamSize: 'large',
    samRealistic: true,
    somAchievable: true,
    investmentNeeded: 0,
    timeToCapture: 0,
    competitiveRisk: 'medium',
    recommendedStrategy: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const calculateMarkets = () => {
    const newData = { ...marketData };
    
    // SAM = TAM × Geographic Reach × Channel Reach × Product Fit
    const samMultiplier = (marketData.geographicReach / 100) * 
                         (marketData.channelReach / 100) * 
                         (marketData.productFit / 100);
    newData.sam = marketData.totalMarketSize * samMultiplier;
    
    // SOM calculation based on competitive advantage, marketing budget, and sales efficiency
    const advantageMultiplier = marketData.competitiveAdvantage / 10;
    const budgetMultiplier = Math.min(marketData.marketingBudget / 10000000, 1); // Cap at $10M for full effect
    const efficiencyMultiplier = marketData.salesEfficiency / 100;
    const timeMultiplier = Math.min(marketData.timeframe / 10, 1); // Diminishing returns after 10 years
    
    const somMultiplier = advantageMultiplier * budgetMultiplier * efficiencyMultiplier * timeMultiplier;
    newData.som = newData.sam * Math.min(somMultiplier, 0.15); // Cap SOM at 15% of SAM
    
    // Market opportunity and capture rate
    newData.marketOpportunity = newData.som;
    newData.captureRate = (newData.som / marketData.totalMarketSize) * 100;
    
    setMarketData(newData);
    
    // Analysis
    const newAnalysis: MarketAnalysis = {
      tamSize: getMarketSizeCategory(marketData.totalMarketSize),
      samRealistic: samMultiplier >= 0.05 && samMultiplier <= 0.5, // 5-50% of TAM is realistic
      somAchievable: somMultiplier <= 0.1, // SOM should be ≤10% of SAM typically
      investmentNeeded: newData.som * 0.1, // Rough estimate: 10% of SOM value needed in investment
      timeToCapture: marketData.timeframe,
      competitiveRisk: marketData.competitiveAdvantage >= 8 ? 'low' : marketData.competitiveAdvantage >= 5 ? 'medium' : 'high',
      recommendedStrategy: getRecommendedStrategy(newData, marketData)
    };
    
    setAnalysis(newAnalysis);
  };

  const getRecommendedStrategy = (data: MarketData, inputs: MarketData): string => {
    const tamSize = getMarketSizeCategory(inputs.totalMarketSize);
    const samToTamRatio = data.sam / inputs.totalMarketSize;
    const somToSamRatio = data.som / data.sam;
    
    if (tamSize === 'massive' && samToTamRatio > 0.1) {
      return 'Focus on market education and category creation. Massive TAM with good SAM suggests first-mover advantage opportunity.';
    } else if (tamSize === 'large' && somToSamRatio > 0.05) {
      return 'Aggressive growth strategy recommended. Large market with achievable SOM suggests scaling opportunity.';
    } else if (samToTamRatio < 0.05) {
      return 'Niche market strategy. Focus on dominating specific segments before expanding horizontally.';
    } else if (inputs.competitiveAdvantage < 6) {
      return 'Build competitive moats first. Market opportunity exists but competitive positioning needs strengthening.';
    } else {
      return 'Balanced growth approach. Solid market opportunity with reasonable competitive positioning.';
    }
  };

  useEffect(() => {
    calculateMarkets();
  }, [
    marketData.totalMarketSize, marketData.marketGrowthRate, marketData.geographicReach,
    marketData.channelReach, marketData.productFit, marketData.competitiveAdvantage,
    marketData.marketingBudget, marketData.salesEfficiency, marketData.timeframe
  ]);

  const updateField = (field: keyof MarketData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMarketData(prev => ({ ...prev, [field]: numValue }));
  };

  const samPercentage = (marketData.sam / marketData.totalMarketSize) * 100;
  const somPercentage = marketData.sam > 0 ? (marketData.som / marketData.sam) * 100 : 0;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">TAM/SAM/SOM Calculator</h2>
        <p className="text-muted-foreground">
          Size your market opportunity. From Total Addressable Market to your actual slice.
        </p>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MarketCard
          title="TAM"
          value={marketData.totalMarketSize}
          icon={Globe}
          description="Total Addressable Market"
          color="purple"
        />
        
        <MarketCard
          title="SAM"
          value={marketData.sam}
          percentage={samPercentage}
          icon={Target}
          description="Serviceable Addressable Market"
          color="blue"
        />
        
        <MarketCard
          title="SOM"
          value={marketData.som}
          percentage={somPercentage}
          icon={Users}
          description="Serviceable Obtainable Market"
          color="green"
        />
      </div>

      {/* TAM Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Total Addressable Market (TAM)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalMarketSize">Total Market Size ($)</Label>
              <Input
                id="totalMarketSize"
                type="number"
                value={marketData.totalMarketSize}
                onChange={(e) => updateField('totalMarketSize', e.target.value)}
                placeholder="100000000000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Global market size for your category
              </p>
            </div>
            
            <div>
              <Label htmlFor="marketGrowthRate">Annual Growth Rate (%)</Label>
              <Input
                id="marketGrowthRate"
                type="number"
                value={marketData.marketGrowthRate}
                onChange={(e) => updateField('marketGrowthRate', e.target.value)}
                placeholder="15"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Expected market growth per year
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <Badge className={getCategoryColor(analysis.tamSize)}>
              {marketSizeCategories.find(cat => cat.value === analysis.tamSize)?.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* SAM Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Serviceable Addressable Market (SAM)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="geographicReach">Geographic Reach (%)</Label>
              <Input
                id="geographicReach"
                type="number"
                min="0"
                max="100"
                value={marketData.geographicReach}
                onChange={(e) => updateField('geographicReach', e.target.value)}
                placeholder="25"
              />
              <p className="text-xs text-muted-foreground mt-1">
                % of global market you can serve
              </p>
            </div>
            
            <div>
              <Label htmlFor="channelReach">Channel Reach (%)</Label>
              <Input
                id="channelReach"
                type="number"
                min="0"
                max="100"
                value={marketData.channelReach}
                onChange={(e) => updateField('channelReach', e.target.value)}
                placeholder="60"
              />
              <p className="text-xs text-muted-foreground mt-1">
                % reachable through your channels
              </p>
            </div>
            
            <div>
              <Label htmlFor="productFit">Product Category Fit (%)</Label>
              <Input
                id="productFit"
                type="number"
                min="0"
                max="100"
                value={marketData.productFit}
                onChange={(e) => updateField('productFit', e.target.value)}
                placeholder="40"
              />
              <p className="text-xs text-muted-foreground mt-1">
                % that matches your product category
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>SAM Calculation:</strong> TAM × Geographic Reach × Channel Reach × Product Fit
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your SAM represents {samPercentage.toFixed(1)}% of the total market
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SOM Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Serviceable Obtainable Market (SOM)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="competitiveAdvantage">Competitive Advantage (1-10)</Label>
              <Input
                id="competitiveAdvantage"
                type="number"
                min="1"
                max="10"
                value={marketData.competitiveAdvantage}
                onChange={(e) => updateField('competitiveAdvantage', e.target.value)}
                placeholder="7"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Strength of your competitive positioning
              </p>
            </div>
            
            <div>
              <Label htmlFor="marketingBudget">Annual Marketing Budget ($)</Label>
              <Input
                id="marketingBudget"
                type="number"
                value={marketData.marketingBudget}
                onChange={(e) => updateField('marketingBudget', e.target.value)}
                placeholder="2000000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Marketing and sales investment per year
              </p>
            </div>
            
            <div>
              <Label htmlFor="salesEfficiency">Sales Conversion Rate (%)</Label>
              <Input
                id="salesEfficiency"
                type="number"
                min="0"
                max="100"
                value={marketData.salesEfficiency}
                onChange={(e) => updateField('salesEfficiency', e.target.value)}
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                % of prospects that convert to customers
              </p>
            </div>
            
            <div>
              <Label htmlFor="timeframe">Time to Capture (years)</Label>
              <Input
                id="timeframe"
                type="number"
                min="1"
                max="20"
                value={marketData.timeframe}
                onChange={(e) => updateField('timeframe', e.target.value)}
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Years to achieve this market share
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>SOM:</strong> Your realistically capturable market share within {marketData.timeframe} years
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Represents {somPercentage.toFixed(1)}% of your SAM and {marketData.captureRate.toFixed(3)}% of total TAM
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Market Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Analysis & Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <div className="space-y-4">
              <h3 className="font-semibold">Key Metrics</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Market Opportunity</span>
                  <span className="font-semibold">{formatCurrency(marketData.som)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Market Capture Rate</span>
                  <Badge variant="outline">{marketData.captureRate.toFixed(3)}%</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Investment Needed</span>
                  <span className="font-semibold">{formatCurrency(analysis.investmentNeeded)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Competitive Risk</span>
                  <Badge className={
                    analysis.competitiveRisk === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    analysis.competitiveRisk === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }>
                    {analysis.competitiveRisk.charAt(0).toUpperCase() + analysis.competitiveRisk.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Strategy Recommendation */}
            <div className="space-y-4">
              <h3 className="font-semibold">Recommended Strategy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.recommendedStrategy}
              </p>
              
              {/* Market Health Indicators */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${analysis.samRealistic ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">SAM is {analysis.samRealistic ? 'realistic' : 'unrealistic'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${analysis.somAchievable ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm">SOM is {analysis.somAchievable ? 'achievable' : 'ambitious'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${marketData.marketGrowthRate > 10 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm">Market growth is {marketData.marketGrowthRate > 10 ? 'strong' : 'moderate'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {marketData.captureRate > 5 && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300">
                  ⚠️ <strong>Reality check:</strong> You're targeting {marketData.captureRate.toFixed(1)}% of the total market. 
                  This is likely unrealistic - most successful companies capture 0.1-1% of their TAM.
                </p>
              </div>
            )}
            
            {!analysis.samRealistic && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300">
                  ⚠️ <strong>SAM too broad:</strong> Your serviceable market might be too optimistic. 
                  Consider being more conservative with geographic reach and channel penetration.
                </p>
              </div>
            )}
            
            {analysis.tamSize === 'small' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-300">
                  💡 <strong>Niche opportunity:</strong> Small TAM suggests a niche market. 
                  Focus on dominating this niche before expanding to adjacent markets.
                </p>
              </div>
            )}
            
            {marketData.competitiveAdvantage >= 8 && marketData.som > 100000000 && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-300">
                  🚀 <strong>Strong opportunity:</strong> High competitive advantage with significant SOM suggests 
                  excellent market positioning. Consider aggressive growth investment.
                </p>
              </div>
            )}
            
            {marketData.marketingBudget < marketData.som * 0.05 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-orange-800 dark:text-orange-300">
                  📊 <strong>Investment gap:</strong> Your marketing budget may be insufficient to capture the projected SOM. 
                  Consider increasing investment or reducing market expectations.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}