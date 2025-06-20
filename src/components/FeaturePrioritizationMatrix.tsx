import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Plus, Target, TrendingUp, Users, Zap, X, ArrowRight, AlertTriangle } from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  
  // Impact scores (1-10)
  userImpact: number;
  businessImpact: number;
  strategicAlignment: number;
  
  // Effort scores (1-10)
  developmentEffort: number;
  designEffort: number;
  researchNeeded: number;
  
  // Calculated scores
  totalImpact: number;
  totalEffort: number;
  priorityScore: number;
  
  // Metadata
  category: 'core' | 'growth' | 'retention' | 'revenue' | 'technical' | 'ux';
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Backlog';
  estimatedWeeks: number;
}

interface PrioritizationCriteria {
  userImpactWeight: number;
  businessImpactWeight: number;
  strategicAlignmentWeight: number;
  effortPenalty: number;
}

const defaultFeatures: Feature[] = [
  {
    id: '1',
    name: 'User Dashboard Redesign',
    description: 'Modernize the main dashboard with better UX and data visualization',
    userImpact: 8,
    businessImpact: 6,
    strategicAlignment: 7,
    developmentEffort: 6,
    designEffort: 8,
    researchNeeded: 4,
    totalImpact: 0,
    totalEffort: 0,
    priorityScore: 0,
    category: 'ux',
    quarter: 'Q2',
    estimatedWeeks: 8
  },
  {
    id: '2',
    name: 'Advanced Analytics',
    description: 'Add advanced reporting and analytics capabilities',
    userImpact: 9,
    businessImpact: 8,
    strategicAlignment: 9,
    developmentEffort: 8,
    designEffort: 6,
    researchNeeded: 7,
    totalImpact: 0,
    totalEffort: 0,
    priorityScore: 0,
    category: 'growth',
    quarter: 'Q3',
    estimatedWeeks: 12
  },
  {
    id: '3',
    name: 'Mobile App',
    description: 'Native mobile application for iOS and Android',
    userImpact: 10,
    businessImpact: 9,
    strategicAlignment: 8,
    developmentEffort: 10,
    designEffort: 8,
    researchNeeded: 6,
    totalImpact: 0,
    totalEffort: 0,
    priorityScore: 0,
    category: 'growth',
    quarter: 'Q4',
    estimatedWeeks: 20
  },
  {
    id: '4',
    name: 'API Rate Limiting',
    description: 'Implement proper API rate limiting and throttling',
    userImpact: 4,
    businessImpact: 7,
    strategicAlignment: 6,
    developmentEffort: 4,
    designEffort: 2,
    researchNeeded: 3,
    totalImpact: 0,
    totalEffort: 0,
    priorityScore: 0,
    category: 'technical',
    quarter: 'Q1',
    estimatedWeeks: 3
  },
  {
    id: '5',
    name: 'Onboarding Flow',
    description: 'Redesigned user onboarding with interactive tutorials',
    userImpact: 9,
    businessImpact: 8,
    strategicAlignment: 7,
    developmentEffort: 5,
    designEffort: 7,
    researchNeeded: 5,
    totalImpact: 0,
    totalEffort: 0,
    priorityScore: 0,
    category: 'retention',
    quarter: 'Q2',
    estimatedWeeks: 6
  }
];

const categoryColors = {
  core: '#3b82f6',
  growth: '#10b981',
  retention: '#f59e0b',
  revenue: '#8b5cf6',
  technical: '#6b7280',
  ux: '#ec4899'
};

const getQuarterColor = (quarter: string) => {
  switch (quarter) {
    case 'Q1': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'Q2': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'Q3': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'Q4': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getPriorityColor = (score: number) => {
  if (score >= 8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  if (score >= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  if (score >= 4) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
};

const FeatureCard = ({ 
  feature, 
  onEdit, 
  onDelete 
}: {
  feature: Feature;
  onEdit: (feature: Feature) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onEdit(feature)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{feature.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(feature.id);
            }}
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <Badge style={{ backgroundColor: categoryColors[feature.category], color: 'white' }}>
            {feature.category}
          </Badge>
          <Badge className={getQuarterColor(feature.quarter)}>
            {feature.quarter}
          </Badge>
          <Badge className={getPriorityColor(feature.priorityScore)}>
            {feature.priorityScore.toFixed(1)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Impact:</span> {feature.totalImpact.toFixed(1)}
          </div>
          <div>
            <span className="text-muted-foreground">Effort:</span> {feature.totalEffort.toFixed(1)}
          </div>
          <div>
            <span className="text-muted-foreground">Weeks:</span> {feature.estimatedWeeks}
          </div>
          <div>
            <span className="text-muted-foreground">Ratio:</span> {(feature.totalImpact / feature.totalEffort).toFixed(1)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function FeaturePrioritizationMatrix() {
  const [features, setFeatures] = useState<Feature[]>(defaultFeatures);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  
  const [criteria, setCriteria] = useState<PrioritizationCriteria>({
    userImpactWeight: 40,
    businessImpactWeight: 35,
    strategicAlignmentWeight: 25,
    effortPenalty: 1.2
  });

  const [newFeature, setNewFeature] = useState<Partial<Feature>>({
    name: '',
    description: '',
    userImpact: 5,
    businessImpact: 5,
    strategicAlignment: 5,
    developmentEffort: 5,
    designEffort: 5,
    researchNeeded: 5,
    category: 'core',
    quarter: 'Backlog',
    estimatedWeeks: 4
  });

  const calculatePriority = (feature: Feature): Feature => {
    const totalImpact = (
      (feature.userImpact * criteria.userImpactWeight / 100) +
      (feature.businessImpact * criteria.businessImpactWeight / 100) +
      (feature.strategicAlignment * criteria.strategicAlignmentWeight / 100)
    );
    
    const totalEffort = (feature.developmentEffort + feature.designEffort + feature.researchNeeded) / 3;
    
    const priorityScore = totalImpact / Math.pow(totalEffort, criteria.effortPenalty / 10);
    
    return {
      ...feature,
      totalImpact,
      totalEffort,
      priorityScore
    };
  };

  const recalculateAllPriorities = () => {
    setFeatures(prev => prev.map(calculatePriority));
  };

  useEffect(() => {
    recalculateAllPriorities();
  }, [criteria]);

  const addFeature = () => {
    if (!newFeature.name) return;
    
    const feature: Feature = {
      id: Date.now().toString(),
      name: newFeature.name!,
      description: newFeature.description || '',
      userImpact: newFeature.userImpact || 5,
      businessImpact: newFeature.businessImpact || 5,
      strategicAlignment: newFeature.strategicAlignment || 5,
      developmentEffort: newFeature.developmentEffort || 5,
      designEffort: newFeature.designEffort || 5,
      researchNeeded: newFeature.researchNeeded || 5,
      category: newFeature.category as Feature['category'] || 'core',
      quarter: newFeature.quarter as Feature['quarter'] || 'Backlog',
      estimatedWeeks: newFeature.estimatedWeeks || 4,
      totalImpact: 0,
      totalEffort: 0,
      priorityScore: 0
    };
    
    const calculatedFeature = calculatePriority(feature);
    setFeatures(prev => [...prev, calculatedFeature]);
    setNewFeature({
      name: '',
      description: '',
      userImpact: 5,
      businessImpact: 5,
      strategicAlignment: 5,
      developmentEffort: 5,
      designEffort: 5,
      researchNeeded: 5,
      category: 'core',
      quarter: 'Backlog',
      estimatedWeeks: 4
    });
    setShowAddForm(false);
  };

  const updateFeature = (updatedFeature: Feature) => {
    const calculatedFeature = calculatePriority(updatedFeature);
    setFeatures(prev => prev.map(f => f.id === updatedFeature.id ? calculatedFeature : f));
    setEditingFeature(null);
  };

  const deleteFeature = (id: string) => {
    setFeatures(prev => prev.filter(f => f.id !== id));
  };

  const sortedFeatures = [...features].sort((a, b) => b.priorityScore - a.priorityScore);

  // Prepare chart data
  const chartData = features.map(feature => ({
    x: feature.totalEffort,
    y: feature.totalImpact,
    name: feature.name,
    category: feature.category,
    priority: feature.priorityScore,
    fill: categoryColors[feature.category]
  }));

  const quarterDistribution = features.reduce((acc, feature) => {
    acc[feature.quarter] = (acc[feature.quarter] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageEffortByQuarter = Object.keys(quarterDistribution).map(quarter => {
    const quarterFeatures = features.filter(f => f.quarter === quarter);
    const totalWeeks = quarterFeatures.reduce((sum, f) => sum + f.estimatedWeeks, 0);
    return {
      quarter,
      features: quarterFeatures.length,
      totalWeeks,
      averageWeeks: quarterFeatures.length > 0 ? totalWeeks / quarterFeatures.length : 0
    };
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Feature Prioritization Matrix</h2>
        <p className="text-muted-foreground">
          Prioritize features using impact vs effort analysis. Make data-driven product decisions.
        </p>
      </div>

      {/* Prioritization Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Prioritization Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="userImpactWeight">User Impact Weight (%)</Label>
              <Input
                id="userImpactWeight"
                type="number"
                min="0"
                max="100"
                value={criteria.userImpactWeight}
                onChange={(e) => setCriteria(prev => ({ ...prev, userImpactWeight: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="businessImpactWeight">Business Impact Weight (%)</Label>
              <Input
                id="businessImpactWeight"
                type="number"
                min="0"
                max="100"
                value={criteria.businessImpactWeight}
                onChange={(e) => setCriteria(prev => ({ ...prev, businessImpactWeight: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="strategicAlignmentWeight">Strategic Weight (%)</Label>
              <Input
                id="strategicAlignmentWeight"
                type="number"
                min="0"
                max="100"
                value={criteria.strategicAlignmentWeight}
                onChange={(e) => setCriteria(prev => ({ ...prev, strategicAlignmentWeight: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="effortPenalty">Effort Penalty Multiplier</Label>
              <Input
                id="effortPenalty"
                type="number"
                min="1"
                max="3"
                step="0.1"
                value={criteria.effortPenalty}
                onChange={(e) => setCriteria(prev => ({ ...prev, effortPenalty: parseFloat(e.target.value) || 1 }))}
              />
            </div>
          </div>
          
          <div className="mt-4">
            {criteria.userImpactWeight + criteria.businessImpactWeight + criteria.strategicAlignmentWeight !== 100 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ Weights should total 100%. Current total: {criteria.userImpactWeight + criteria.businessImpactWeight + criteria.strategicAlignmentWeight}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Impact vs Effort Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Impact vs Effort Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Effort" 
                  domain={[0, 10]}
                  label={{ value: 'Effort →', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Impact" 
                  domain={[0, 10]}
                  label={{ value: 'Impact →', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(1) : value, 
                    name === 'x' ? 'Effort' : name === 'y' ? 'Impact' : name
                  ]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.name || 'Feature'}
                />
                <ReferenceLine x={5} stroke="#ccc" strokeDasharray="2 2" />
                <ReferenceLine y={5} stroke="#ccc" strokeDasharray="2 2" />
                <Scatter dataKey="y" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="font-semibold text-green-800 dark:text-green-300">High Impact, Low Effort</div>
              <div className="text-xs text-green-600 dark:text-green-400">Quick Wins</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="font-semibold text-blue-800 dark:text-blue-300">High Impact, High Effort</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Major Projects</div>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="font-semibold text-yellow-800 dark:text-yellow-300">Low Impact, Low Effort</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">Fill-ins</div>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="font-semibold text-red-800 dark:text-red-300">Low Impact, High Effort</div>
              <div className="text-xs text-red-600 dark:text-red-400">Questionable</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Feature Form */}
      {(showAddForm || editingFeature) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingFeature ? 'Edit Feature' : 'Add New Feature'}</span>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowAddForm(false);
                setEditingFeature(null);
              }}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="featureName">Feature Name</Label>
                  <Input
                    id="featureName"
                    value={editingFeature?.name || newFeature.name}
                    onChange={(e) => editingFeature 
                      ? setEditingFeature({...editingFeature, name: e.target.value})
                      : setNewFeature(prev => ({...prev, name: e.target.value}))
                    }
                    placeholder="Feature name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="featureDescription">Description</Label>
                  <Textarea
                    id="featureDescription"
                    value={editingFeature?.description || newFeature.description}
                    onChange={(e) => editingFeature 
                      ? setEditingFeature({...editingFeature, description: e.target.value})
                      : setNewFeature(prev => ({...prev, description: e.target.value}))
                    }
                    placeholder="Brief description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editingFeature?.category || newFeature.category}
                      onValueChange={(value) => editingFeature 
                        ? setEditingFeature({...editingFeature, category: value as Feature['category']})
                        : setNewFeature(prev => ({...prev, category: value as Feature['category']}))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="core">Core</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="retention">Retention</SelectItem>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="ux">UX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="quarter">Target Quarter</Label>
                    <Select
                      value={editingFeature?.quarter || newFeature.quarter}
                      onValueChange={(value) => editingFeature 
                        ? setEditingFeature({...editingFeature, quarter: value as Feature['quarter']})
                        : setNewFeature(prev => ({...prev, quarter: value as Feature['quarter']}))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1">Q1</SelectItem>
                        <SelectItem value="Q2">Q2</SelectItem>
                        <SelectItem value="Q3">Q3</SelectItem>
                        <SelectItem value="Q4">Q4</SelectItem>
                        <SelectItem value="Backlog">Backlog</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Impact Scores (1-10)</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="userImpact" className="w-20 text-xs">User Impact</Label>
                      <Input
                        id="userImpact"
                        type="number"
                        min="1"
                        max="10"
                        value={editingFeature?.userImpact || newFeature.userImpact}
                        onChange={(e) => editingFeature 
                          ? setEditingFeature({...editingFeature, userImpact: parseFloat(e.target.value) || 1})
                          : setNewFeature(prev => ({...prev, userImpact: parseFloat(e.target.value) || 1}))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="businessImpact" className="w-20 text-xs">Business</Label>
                      <Input
                        id="businessImpact"
                        type="number"
                        min="1"
                        max="10"
                        value={editingFeature?.businessImpact || newFeature.businessImpact}
                        onChange={(e) => editingFeature 
                          ? setEditingFeature({...editingFeature, businessImpact: parseFloat(e.target.value) || 1})
                          : setNewFeature(prev => ({...prev, businessImpact: parseFloat(e.target.value) || 1}))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="strategicAlignment" className="w-20 text-xs">Strategic</Label>
                      <Input
                        id="strategicAlignment"
                        type="number"
                        min="1"
                        max="10"
                        value={editingFeature?.strategicAlignment || newFeature.strategicAlignment}
                        onChange={(e) => editingFeature 
                          ? setEditingFeature({...editingFeature, strategicAlignment: parseFloat(e.target.value) || 1})
                          : setNewFeature(prev => ({...prev, strategicAlignment: parseFloat(e.target.value) || 1}))
                        }
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Effort Scores (1-10)</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="developmentEffort" className="w-20 text-xs">Development</Label>
                      <Input
                        id="developmentEffort"
                        type="number"
                        min="1"
                        max="10"
                        value={editingFeature?.developmentEffort || newFeature.developmentEffort}
                        onChange={(e) => editingFeature 
                          ? setEditingFeature({...editingFeature, developmentEffort: parseFloat(e.target.value) || 1})
                          : setNewFeature(prev => ({...prev, developmentEffort: parseFloat(e.target.value) || 1}))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="designEffort" className="w-20 text-xs">Design</Label>
                      <Input
                        id="designEffort"
                        type="number"
                        min="1"
                        max="10"
                        value={editingFeature?.designEffort || newFeature.designEffort}
                        onChange={(e) => editingFeature 
                          ? setEditingFeature({...editingFeature, designEffort: parseFloat(e.target.value) || 1})
                          : setNewFeature(prev => ({...prev, designEffort: parseFloat(e.target.value) || 1}))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="researchNeeded" className="w-20 text-xs">Research</Label>
                      <Input
                        id="researchNeeded"
                        type="number"
                        min="1"
                        max="10"
                        value={editingFeature?.researchNeeded || newFeature.researchNeeded}
                        onChange={(e) => editingFeature 
                          ? setEditingFeature({...editingFeature, researchNeeded: parseFloat(e.target.value) || 1})
                          : setNewFeature(prev => ({...prev, researchNeeded: parseFloat(e.target.value) || 1}))
                        }
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="estimatedWeeks">Estimated Weeks</Label>
                  <Input
                    id="estimatedWeeks"
                    type="number"
                    min="1"
                    value={editingFeature?.estimatedWeeks || newFeature.estimatedWeeks}
                    onChange={(e) => editingFeature 
                      ? setEditingFeature({...editingFeature, estimatedWeeks: parseFloat(e.target.value) || 1})
                      : setNewFeature(prev => ({...prev, estimatedWeeks: parseFloat(e.target.value) || 1}))
                    }
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={editingFeature ? () => updateFeature(editingFeature) : addFeature}>
                {editingFeature ? 'Update Feature' : 'Add Feature'}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowAddForm(false);
                setEditingFeature(null);
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Feature Button */}
      {!showAddForm && !editingFeature && (
        <div className="text-center">
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Feature
          </Button>
        </div>
      )}

      <Separator />

      {/* Priority Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Priority Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedFeatures.map((feature, index) => (
              <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <div>
                    <div className="font-semibold">{feature.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Impact: {feature.totalImpact.toFixed(1)} | Effort: {feature.totalEffort.toFixed(1)} | {feature.estimatedWeeks}w
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge style={{ backgroundColor: categoryColors[feature.category], color: 'white' }}>
                    {feature.category}
                  </Badge>
                  <Badge className={getQuarterColor(feature.quarter)}>
                    {feature.quarter}
                  </Badge>
                  <Badge className={getPriorityColor(feature.priorityScore)}>
                    {feature.priorityScore.toFixed(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(feature => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onEdit={setEditingFeature}
                onDelete={deleteFeature}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quarterly Planning Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {averageEffortByQuarter.map(quarter => (
              <div key={quarter.quarter} className="text-center p-4 border rounded-lg">
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-2 ${getQuarterColor(quarter.quarter)}`}>
                  {quarter.quarter}
                </div>
                <div className="space-y-1 text-sm">
                  <div>{quarter.features} features</div>
                  <div>{quarter.totalWeeks} total weeks</div>
                  <div className="text-muted-foreground">
                    {quarter.averageWeeks.toFixed(1)}w avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Strategic Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {sortedFeatures.length > 0 && sortedFeatures[0].priorityScore > 8 && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-300">
                  🚀 <strong>Clear winner:</strong> "{sortedFeatures[0].name}" has exceptional priority score ({sortedFeatures[0].priorityScore.toFixed(1)}). 
                  Consider fast-tracking this feature.
                </p>
              </div>
            )}
            
            {features.filter(f => f.priorityScore < 3).length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300">
                  ⚠️ <strong>Low-value features:</strong> {features.filter(f => f.priorityScore < 3).length} features have priority scores below 3. 
                  Consider removing or re-scoping these features.
                </p>
              </div>
            )}
            
            {quarterDistribution['Q1'] > 5 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300">
                  📅 <strong>Q1 overloaded:</strong> {quarterDistribution['Q1']} features planned for Q1. 
                  Consider spreading work across quarters to avoid team burnout.
                </p>
              </div>
            )}
            
            {features.filter(f => f.category === 'technical').length / features.length > 0.4 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-300">
                  🔧 <strong>Tech debt focus:</strong> High ratio of technical features suggests focus on infrastructure. 
                  Balance with user-facing improvements for better business impact.
                </p>
              </div>
            )}
            
            {features.some(f => f.totalEffort > 8 && f.totalImpact < 6) && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-orange-800 dark:text-orange-300">
                  🤔 <strong>Questionable investments:</strong> Some high-effort, low-impact features detected. 
                  Review whether these align with current strategic priorities.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}