#!/usr/bin/env bun

import { parseArgs } from 'util'
import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    name: {
      type: 'string',
      short: 'n',
    },
    description: {
      type: 'string',
      short: 'd',
    },
    help: {
      type: 'boolean',
      short: 'h',
    },
  },
  strict: true,
  allowPositionals: true,
})

if (values.help || positionals.length < 3) {
  console.log(`
${chalk.bold('Usage:')} bun run new-interactive <ComponentName> [options]

${chalk.bold('Options:')}
  -n, --name        Component display name (defaults to ComponentName)
  -d, --description Component description
  -h, --help        Show this help message

${chalk.bold('Example:')}
  bun run new-interactive CustomerJourneyMapper -n "Customer Journey Mapper" -d "Map customer touchpoints"
  `)
  process.exit(0)
}

const componentName = positionals[2]
const displayName =
  values.name || componentName.replace(/([A-Z])/g, ' $1').trim()
const description = values.description || `Interactive ${displayName} component`

// Convert to kebab-case for the markdown tag
const kebabCase = componentName
  .replace(/([a-z])([A-Z])/g, '$1-$2')
  .toLowerCase()

const componentTemplate = `import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';

interface Config {
  // Add your configuration interface here
  exampleValue: number;
}

interface Results {
  // Add your results interface here
  score: number;
  insights: string[];
}

export default function ${componentName}() {
  const [config, setConfig] = useState<Config>({
    exampleValue: 50
  });

  const [activeTab, setActiveTab] = useState('setup');

  const results = useMemo((): Results => {
    // Calculate your results based on config
    return {
      score: config.exampleValue,
      insights: [
        'This is an example insight',
        'Add your calculated insights here'
      ]
    };
  }, [config]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            ${displayName}
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            ${description}
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exampleValue">Example Value</Label>
                <Slider
                  id="exampleValue"
                  value={[config.exampleValue]}
                  onValueChange={(value) => setConfig({...config, exampleValue: value[0]})}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0</span>
                  <span className="font-medium">{config.exampleValue}</span>
                  <span>100</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Results Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {results.score}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Overall Score
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {results.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
`

// Create the component file
const componentPath = path.join(
  process.cwd(),
  'src',
  'components',
  `${componentName}.tsx`
)

try {
  // Check if component already exists
  await fs.access(componentPath)
  console.error(chalk.red(`❌ Component ${componentName} already exists!`))
  process.exit(1)
} catch {
  // Component doesn't exist, we can create it
}

await fs.writeFile(componentPath, componentTemplate)

console.log(chalk.green(`✅ Created component: ${componentName}`))
console.log(chalk.blue(`📁 Location: src/components/${componentName}.tsx`))
console.log(chalk.yellow(`\n⚡ Next steps:`))
console.log(chalk.gray(`1. Add to MarkdownRenderer.tsx:`))
console.log(chalk.cyan(`   import ${componentName} from './${componentName}';`))
console.log(chalk.cyan(`   '${kebabCase}': ${componentName},`))
console.log(chalk.gray(`\n2. Use in markdown:`))
console.log(chalk.cyan(`   <${kebabCase} />`))
console.log(
  chalk.gray(`\n3. Customize the component logic in the generated file`)
)
