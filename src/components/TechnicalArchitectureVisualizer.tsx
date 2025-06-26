import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  Database,
  Server,
  Globe,
  Smartphone,
  Shield,
  X,
  Settings,
  Layers,
  Zap,
  AlertTriangle,
} from 'lucide-react'

interface ArchitectureComponent {
  id: string
  name: string
  type:
    | 'frontend'
    | 'backend'
    | 'database'
    | 'cache'
    | 'queue'
    | 'cdn'
    | 'auth'
    | 'monitoring'
    | 'api'
    | 'storage'
  technology: string
  description: string
  scalability: number // 1-10
  complexity: number // 1-10
  maintenance: number // 1-10
  cost: number // 1-10 (1 = low cost, 10 = high cost)
  maturity: number // 1-10
  position: { x: number; y: number }
  connections: string[] // IDs of connected components
}

interface ArchitectureAnalysis {
  totalComplexity: number
  averageScalability: number
  maintenanceBurden: number
  costEstimate: number
  technologyDiversity: number
  singlePointsOfFailure: string[]
  recommendations: string[]
}

const componentTypes = {
  frontend: { icon: Globe, color: '#3b82f6', label: 'Frontend' },
  backend: { icon: Server, color: '#10b981', label: 'Backend' },
  database: { icon: Database, color: '#f59e0b', label: 'Database' },
  cache: { icon: Zap, color: '#ef4444', label: 'Cache' },
  queue: { icon: Layers, color: '#8b5cf6', label: 'Queue' },
  cdn: { icon: Globe, color: '#06b6d4', label: 'CDN' },
  auth: { icon: Shield, color: '#f97316', label: 'Auth' },
  monitoring: { icon: Settings, color: '#84cc16', label: 'Monitoring' },
  api: { icon: Server, color: '#6366f1', label: 'API' },
  storage: { icon: Database, color: '#ec4899', label: 'Storage' },
}

const defaultComponents: ArchitectureComponent[] = [
  {
    id: '1',
    name: 'React Frontend',
    type: 'frontend',
    technology: 'React + TypeScript',
    description: 'Main user interface built with React',
    scalability: 8,
    complexity: 6,
    maintenance: 7,
    cost: 3,
    maturity: 9,
    position: { x: 100, y: 100 },
    connections: ['3'],
  },
  {
    id: '2',
    name: 'Mobile App',
    type: 'frontend',
    technology: 'React Native',
    description: 'Cross-platform mobile application',
    scalability: 7,
    complexity: 7,
    maintenance: 6,
    cost: 5,
    maturity: 8,
    position: { x: 300, y: 100 },
    connections: ['3'],
  },
  {
    id: '3',
    name: 'API Gateway',
    type: 'api',
    technology: 'AWS API Gateway',
    description: 'Central API management and routing',
    scalability: 9,
    complexity: 5,
    maintenance: 4,
    cost: 4,
    maturity: 9,
    position: { x: 200, y: 250 },
    connections: ['4', '7'],
  },
  {
    id: '4',
    name: 'Node.js Backend',
    type: 'backend',
    technology: 'Node.js + Express',
    description: 'Main application server',
    scalability: 7,
    complexity: 6,
    maintenance: 6,
    cost: 3,
    maturity: 9,
    position: { x: 200, y: 400 },
    connections: ['5', '6', '8'],
  },
  {
    id: '5',
    name: 'PostgreSQL',
    type: 'database',
    technology: 'PostgreSQL',
    description: 'Primary relational database',
    scalability: 8,
    complexity: 5,
    maintenance: 6,
    cost: 4,
    maturity: 10,
    position: { x: 100, y: 550 },
    connections: [],
  },
  {
    id: '6',
    name: 'Redis Cache',
    type: 'cache',
    technology: 'Redis',
    description: 'In-memory caching layer',
    scalability: 9,
    complexity: 4,
    maintenance: 5,
    cost: 3,
    maturity: 9,
    position: { x: 300, y: 550 },
    connections: [],
  },
  {
    id: '7',
    name: 'Auth Service',
    type: 'auth',
    technology: 'Auth0',
    description: 'Authentication and authorization',
    scalability: 9,
    complexity: 3,
    maintenance: 2,
    cost: 5,
    maturity: 9,
    position: { x: 400, y: 250 },
    connections: [],
  },
  {
    id: '8',
    name: 'Background Jobs',
    type: 'queue',
    technology: 'Bull Queue + Redis',
    description: 'Asynchronous job processing',
    scalability: 8,
    complexity: 6,
    maintenance: 6,
    cost: 3,
    maturity: 8,
    position: { x: 350, y: 400 },
    connections: ['6'],
  },
]

const ArchitectureNode = ({
  component,
  isSelected,
  onSelect,
  onMove,
}: {
  component: ArchitectureComponent
  isSelected: boolean
  onSelect: (id: string) => void
  onMove: (id: string, position: { x: number; y: number }) => void
}) => {
  const { icon: Icon, color } = componentTypes[component.type]

  const getComplexityColor = (complexity: number) => {
    if (complexity <= 3)
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    if (complexity <= 6)
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }

  return (
    <div
      className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{ left: component.position.x, top: component.position.y }}
      onClick={() => onSelect(component.id)}
      draggable
      onDragEnd={(e) => {
        const rect = (
          e.target as HTMLElement
        ).parentElement?.getBoundingClientRect()
        if (rect) {
          onMove(component.id, {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          })
        }
      }}
    >
      <Card className="w-32 h-28 border-2" style={{ borderColor: color }}>
        <CardContent className="p-2 text-center">
          <div className="flex items-center justify-center mb-1">
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div className="text-xs font-semibold mb-1 truncate">
            {component.name}
          </div>
          <div className="text-xs text-muted-foreground mb-1 truncate">
            {component.technology}
          </div>
          <Badge
            className={`text-xs ${getComplexityColor(component.complexity)}`}
          >
            C:{component.complexity}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TechnicalArchitectureVisualizer() {
  const [components, setComponents] =
    useState<ArchitectureComponent[]>(defaultComponents)
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null
  )
  const [showAddForm, setShowAddForm] = useState(false)
  const [analysis, setAnalysis] = useState<ArchitectureAnalysis>({
    totalComplexity: 0,
    averageScalability: 0,
    maintenanceBurden: 0,
    costEstimate: 0,
    technologyDiversity: 0,
    singlePointsOfFailure: [],
    recommendations: [],
  })

  const [newComponent, setNewComponent] = useState<
    Partial<ArchitectureComponent>
  >({
    name: '',
    type: 'backend',
    technology: '',
    description: '',
    scalability: 5,
    complexity: 5,
    maintenance: 5,
    cost: 5,
    maturity: 5,
    position: { x: 200, y: 300 },
    connections: [],
  })

  const analyzeArchitecture = useCallback(() => {
    const totalComplexity = components.reduce(
      (sum, comp) => sum + comp.complexity,
      0
    )
    const averageScalability =
      components.reduce((sum, comp) => sum + comp.scalability, 0) /
      components.length
    const maintenanceBurden = components.reduce(
      (sum, comp) => sum + comp.maintenance,
      0
    )
    const costEstimate = components.reduce((sum, comp) => sum + comp.cost, 0)

    // Calculate technology diversity (unique technologies)
    const uniqueTechnologies = new Set(
      components.map((comp) => comp.technology)
    )
    const technologyDiversity = uniqueTechnologies.size

    // Find single points of failure (components with many incoming connections)
    const connectionCounts = components.reduce(
      (acc, comp) => {
        comp.connections.forEach((connId) => {
          acc[connId] = (acc[connId] || 0) + 1
        })
        return acc
      },
      {} as Record<string, number>
    )

    const singlePointsOfFailure = Object.entries(connectionCounts)
      .filter(([_, count]) => count >= 3)
      .map(([id, _]) => components.find((comp) => comp.id === id)?.name || id)

    // Generate recommendations
    const recommendations = []

    if (averageScalability < 6) {
      recommendations.push(
        'Consider upgrading components with low scalability scores'
      )
    }

    if (totalComplexity / components.length > 7) {
      recommendations.push(
        'High average complexity detected - consider simplifying architecture'
      )
    }

    if (singlePointsOfFailure.length > 0) {
      recommendations.push(
        `Single points of failure detected: ${singlePointsOfFailure.join(', ')}`
      )
    }

    if (technologyDiversity > components.length * 0.7) {
      recommendations.push(
        'High technology diversity may increase maintenance burden'
      )
    }

    if (!components.some((comp) => comp.type === 'monitoring')) {
      recommendations.push(
        'Consider adding monitoring and observability components'
      )
    }

    if (!components.some((comp) => comp.type === 'cache')) {
      recommendations.push('Adding caching layer could improve performance')
    }

    setAnalysis({
      totalComplexity,
      averageScalability,
      maintenanceBurden,
      costEstimate,
      technologyDiversity,
      singlePointsOfFailure,
      recommendations,
    })
  }, [components])

  useEffect(() => {
    analyzeArchitecture()
  }, [analyzeArchitecture])

  const addComponent = () => {
    if (!newComponent.name) return

    const component: ArchitectureComponent = {
      id: Date.now().toString(),
      name: newComponent.name!,
      type: (newComponent.type as ArchitectureComponent['type']) || 'backend',
      technology: newComponent.technology || '',
      description: newComponent.description || '',
      scalability: newComponent.scalability || 5,
      complexity: newComponent.complexity || 5,
      maintenance: newComponent.maintenance || 5,
      cost: newComponent.cost || 5,
      maturity: newComponent.maturity || 5,
      position: newComponent.position || { x: 200, y: 300 },
      connections: [],
    }

    setComponents((prev) => [...prev, component])
    setNewComponent({
      name: '',
      type: 'backend',
      technology: '',
      description: '',
      scalability: 5,
      complexity: 5,
      maintenance: 5,
      cost: 5,
      maturity: 5,
      position: { x: 200, y: 300 },
      connections: [],
    })
    setShowAddForm(false)
  }

  const deleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((comp) => comp.id !== id))
    setSelectedComponent(null)
  }

  const moveComponent = (id: string, position: { x: number; y: number }) => {
    setComponents((prev) =>
      prev.map((comp) => (comp.id === id ? { ...comp, position } : comp))
    )
  }

  const selectedComp = selectedComponent
    ? components.find((comp) => comp.id === selectedComponent)
    : null

  const componentsByType = components.reduce(
    (acc, comp) => {
      acc[comp.type] = (acc[comp.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const getScoreColor = (score: number, reverse = false) => {
    const threshold = reverse
      ? { good: score <= 4, medium: score <= 7 }
      : { good: score >= 7, medium: score >= 4 }

    if (threshold.good) return 'text-green-600 dark:text-green-400'
    if (threshold.medium) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          Technical Architecture Visualizer
        </h2>
        <p className="text-muted-foreground">
          Design and analyze your technical architecture. Visualize components,
          connections, and complexity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Architecture Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Architecture Diagram
                </span>
                <Button
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Component
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                {components.map((component) => (
                  <ArchitectureNode
                    key={component.id}
                    component={component}
                    isSelected={selectedComponent === component.id}
                    onSelect={setSelectedComponent}
                    onMove={moveComponent}
                  />
                ))}

                {/* Draw connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {components.map((component) =>
                    component.connections.map((connId) => {
                      const targetComp = components.find(
                        (comp) => comp.id === connId
                      )
                      if (!targetComp) return null

                      return (
                        <line
                          key={`${component.id}-${connId}`}
                          x1={component.position.x}
                          y1={component.position.y}
                          x2={targetComp.position.x}
                          y2={targetComp.position.y}
                          stroke="#94a3b8"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />
                      )
                    })
                  )}
                </svg>
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                Drag components to reposition them. Click to select and view
                details.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Component Details & Analysis */}
        <div className="space-y-6">
          {/* Selected Component Details */}
          {selectedComp && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {React.createElement(
                      componentTypes[selectedComp.type].icon,
                      { className: 'h-5 w-5' }
                    )}
                    {selectedComp.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteComponent(selectedComp.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-sm">Technology</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedComp.technology}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-sm">Description</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedComp.description}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Scalability:
                      </span>
                      <span
                        className={`ml-1 font-medium ${getScoreColor(selectedComp.scalability)}`}
                      >
                        {selectedComp.scalability}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Complexity:</span>
                      <span
                        className={`ml-1 font-medium ${getScoreColor(selectedComp.complexity, true)}`}
                      >
                        {selectedComp.complexity}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Maintenance:
                      </span>
                      <span
                        className={`ml-1 font-medium ${getScoreColor(selectedComp.maintenance, true)}`}
                      >
                        {selectedComp.maintenance}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost:</span>
                      <span
                        className={`ml-1 font-medium ${getScoreColor(selectedComp.cost, true)}`}
                      >
                        {selectedComp.cost}/10
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Architecture Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Architecture Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Components:</span>
                    <span className="ml-1 font-medium">
                      {components.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Technologies:</span>
                    <span className="ml-1 font-medium">
                      {analysis.technologyDiversity}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Avg Scalability:
                    </span>
                    <span
                      className={`ml-1 font-medium ${getScoreColor(analysis.averageScalability)}`}
                    >
                      {analysis.averageScalability.toFixed(1)}/10
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Total Complexity:
                    </span>
                    <span
                      className={`ml-1 font-medium ${getScoreColor(analysis.totalComplexity / components.length, true)}`}
                    >
                      {(analysis.totalComplexity / components.length).toFixed(
                        1
                      )}
                      /10
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="font-semibold text-sm mb-2">
                    Component Types
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(componentsByType).map(([type, count]) => (
                      <Badge
                        key={type}
                        variant="outline"
                        style={{
                          borderColor:
                            componentTypes[type as keyof typeof componentTypes]
                              .color,
                        }}
                      >
                        {
                          componentTypes[type as keyof typeof componentTypes]
                            .label
                        }
                        : {count}
                      </Badge>
                    ))}
                  </div>
                </div>

                {analysis.singlePointsOfFailure.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                      Single Points of Failure
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400">
                      {analysis.singlePointsOfFailure.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-300"
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Component Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Add New Component</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="componentName">Component Name</Label>
                  <Input
                    id="componentName"
                    value={newComponent.name}
                    onChange={(e) =>
                      setNewComponent((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Component name"
                  />
                </div>

                <div>
                  <Label htmlFor="componentType">Type</Label>
                  <Select
                    value={newComponent.type}
                    onValueChange={(value) =>
                      setNewComponent((prev) => ({
                        ...prev,
                        type: value as ArchitectureComponent['type'],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(componentTypes).map(
                        ([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="technology">Technology</Label>
                  <Input
                    id="technology"
                    value={newComponent.technology}
                    onChange={(e) =>
                      setNewComponent((prev) => ({
                        ...prev,
                        technology: e.target.value,
                      }))
                    }
                    placeholder="e.g., React, Node.js, PostgreSQL"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newComponent.description}
                    onChange={(e) =>
                      setNewComponent((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Characteristics (1-10)</Label>
                  <div className="space-y-2 mt-2">
                    {[
                      'scalability',
                      'complexity',
                      'maintenance',
                      'cost',
                      'maturity',
                    ].map((field) => (
                      <div key={field} className="flex items-center gap-2">
                        <Label
                          htmlFor={field}
                          className="w-20 text-xs capitalize"
                        >
                          {field}
                        </Label>
                        <Input
                          id={field}
                          type="number"
                          min="1"
                          max="10"
                          value={
                            newComponent[
                              field as keyof typeof newComponent
                            ] as number
                          }
                          onChange={(e) =>
                            setNewComponent((prev) => ({
                              ...prev,
                              [field]: parseFloat(e.target.value) || 1,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={addComponent}>Add Component</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Architecture Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Architecture Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {analysis.averageScalability < 6 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300">
                  ⚠️ <strong>Scalability concerns:</strong> Average scalability
                  score of {analysis.averageScalability.toFixed(1)}
                  suggests potential bottlenecks. Consider upgrading low-scoring
                  components.
                </p>
              </div>
            )}

            {analysis.totalComplexity / components.length > 7 && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300">
                  🚨 <strong>High complexity:</strong> Average complexity of{' '}
                  {(analysis.totalComplexity / components.length).toFixed(1)}
                  may impact maintainability. Consider architectural
                  simplification.
                </p>
              </div>
            )}

            {!components.some((comp) => comp.type === 'monitoring') && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-300">
                  📊 <strong>Missing observability:</strong> No monitoring
                  components detected. Consider adding logging, metrics, and
                  alerting capabilities.
                </p>
              </div>
            )}

            {analysis.technologyDiversity > components.length * 0.7 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-orange-800 dark:text-orange-300">
                  🔧 <strong>Technology sprawl:</strong>{' '}
                  {analysis.technologyDiversity} different technologies for{' '}
                  {components.length} components may increase operational
                  complexity.
                </p>
              </div>
            )}

            {analysis.averageScalability >= 8 &&
              analysis.totalComplexity / components.length <= 5 && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-800 dark:text-green-300">
                    🚀 <strong>Well-designed architecture:</strong> High
                    scalability with manageable complexity. Your architecture is
                    positioned for sustainable growth.
                  </p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
