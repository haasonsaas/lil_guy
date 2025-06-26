#!/usr/bin/env bun

import { parseArgs } from 'util'
import chalk from 'chalk'

// Parse command line arguments
const { values } = parseArgs({
  args: Bun.argv,
  options: {
    period: {
      type: 'string',
      short: 'p',
      default: '7d',
      description: 'Time period for the report (7d, 14d, 30d)',
    },
    format: {
      type: 'string',
      short: 'f',
      default: 'table',
      description: 'Output format (table, json, markdown)',
    },
    baseUrl: {
      type: 'string',
      default: 'https://haasonsaas.com',
      description: 'Base URL for API calls',
    },
  },
  strict: true,
  allowPositionals: true,
})

interface AnalyticsData {
  success: boolean
  message: string
  stats?: {
    totalEvents: number
    topEndpoints: Array<{ endpoint: string; count: number }>
    topAgents: Array<{ agent: string; count: number }>
    timeRange: string
  }
}

// Convert period string to days
function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)([dw])$/)
  if (!match) {
    console.error(
      chalk.red('❌ Invalid period format. Use format like "7d" or "2w"')
    )
    process.exit(1)
  }

  const [, num, unit] = match
  const days = parseInt(num)
  return unit === 'w' ? days * 7 : days
}

// Fetch analytics data
async function fetchAnalytics(
  baseUrl: string,
  days: number
): Promise<AnalyticsData> {
  try {
    const response = await fetch(`${baseUrl}/api/analytics?days=${days}`, {
      headers: {
        'User-Agent': 'Agent-Report-Script/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(chalk.red('❌ Failed to fetch analytics:'), error)
    process.exit(1)
  }
}

// Format agent name for display
function formatAgentName(agent: string): string {
  const agentColors = {
    Claude: chalk.blue,
    OpenAI: chalk.green,
    ChatGPT: chalk.green,
    Python: chalk.yellow,
    cURL: chalk.gray,
    Chrome: chalk.cyan,
    Firefox: chalk.orange,
    Unknown: chalk.gray,
  }

  const color = agentColors[agent as keyof typeof agentColors] || chalk.white
  return color(agent)
}

// Format endpoint for display
function formatEndpoint(endpoint: string): string {
  const endpointColors = {
    '/api/capabilities': chalk.blue,
    '/api/search': chalk.green,
    '/api/recommendations': chalk.magenta,
    '/api/analytics': chalk.yellow,
    '/api/feedback': chalk.cyan,
  }

  const color =
    endpointColors[endpoint as keyof typeof endpointColors] || chalk.white
  return color(endpoint)
}

// Generate table format report
function generateTableReport(data: AnalyticsData): void {
  if (!data.stats) {
    console.log(chalk.yellow('📊 No analytics data available yet.'))
    console.log(
      chalk.gray('💡 Tip: AI agents need to interact with your APIs first.')
    )
    return
  }

  const { stats } = data

  console.log(chalk.bold.blue('\n🤖 AI Agent Activity Report'))
  console.log(chalk.gray('═'.repeat(50)))

  // Overview
  console.log(chalk.bold('\n📈 Overview'))
  console.log(
    `${chalk.cyan('Total Events:')} ${chalk.white(stats.totalEvents.toLocaleString())}`
  )
  console.log(`${chalk.cyan('Time Range:')} ${chalk.gray(stats.timeRange)}`)

  // Top Endpoints
  if (stats.topEndpoints.length > 0) {
    console.log(chalk.bold('\n🎯 Most Popular Endpoints'))
    console.log(chalk.gray('─'.repeat(40)))

    stats.topEndpoints.forEach((endpoint, index) => {
      const percentage = ((endpoint.count / stats.totalEvents) * 100).toFixed(1)
      const bar = '█'.repeat(
        Math.max(
          1,
          Math.floor((endpoint.count / stats.topEndpoints[0].count) * 20)
        )
      )

      console.log(
        `${chalk.gray((index + 1).toString().padStart(2))}. ${formatEndpoint(endpoint.endpoint.padEnd(25))} ` +
          `${chalk.white(endpoint.count.toString().padStart(4))} ${chalk.gray('(' + percentage + '%)')} ` +
          `${chalk.blue(bar)}`
      )
    })
  }

  // Top Agents
  if (stats.topAgents.length > 0) {
    console.log(chalk.bold('\n🤖 Most Active Agents'))
    console.log(chalk.gray('─'.repeat(40)))

    stats.topAgents.forEach((agent, index) => {
      const percentage = ((agent.count / stats.totalEvents) * 100).toFixed(1)
      const bar = '█'.repeat(
        Math.max(1, Math.floor((agent.count / stats.topAgents[0].count) * 20))
      )

      console.log(
        `${chalk.gray((index + 1).toString().padStart(2))}. ${formatAgentName(agent.agent.padEnd(15))} ` +
          `${chalk.white(agent.count.toString().padStart(4))} ${chalk.gray('(' + percentage + '%)')} ` +
          `${chalk.green(bar)}`
      )
    })
  }

  // Insights
  console.log(chalk.bold('\n💡 Insights'))
  console.log(chalk.gray('─'.repeat(40)))

  if (stats.totalEvents === 0) {
    console.log(chalk.yellow('• No agent activity detected yet'))
    console.log(chalk.gray('• Consider promoting your /agents page'))
  } else if (stats.totalEvents < 50) {
    console.log(
      chalk.yellow('• Early adoption phase - promote to AI community')
    )
    console.log(chalk.gray('• Share on AI/ML forums and social media'))
  } else if (stats.totalEvents < 200) {
    console.log(chalk.green('• Growing agent adoption! 🎉'))
    console.log(chalk.gray('• Consider adding more interactive tools'))
  } else {
    console.log(chalk.green('• Strong agent engagement! 🚀'))
    console.log(chalk.gray('• Monitor for optimization opportunities'))
  }

  // Popular content suggestions
  if (stats.topEndpoints.some((e) => e.endpoint === '/api/search')) {
    console.log(chalk.gray('• Search is popular - consider content expansion'))
  }
  if (stats.topEndpoints.some((e) => e.endpoint === '/api/recommendations')) {
    console.log(chalk.gray('• Recommendations are used - refine targeting'))
  }

  console.log(chalk.gray('\n📊 Run with --format=json for raw data'))
  console.log(chalk.gray('🔗 View live: ' + values.baseUrl + '/agents'))
  console.log()
}

// Generate JSON format report
function generateJsonReport(data: AnalyticsData): void {
  console.log(JSON.stringify(data, null, 2))
}

// Generate markdown format report
function generateMarkdownReport(data: AnalyticsData): void {
  if (!data.stats) {
    console.log('# AI Agent Activity Report\n\nNo data available yet.')
    return
  }

  const { stats } = data

  console.log('# 🤖 AI Agent Activity Report\n')
  console.log(`**Period:** ${stats.timeRange}`)
  console.log(`**Total Events:** ${stats.totalEvents.toLocaleString()}\n`)

  if (stats.topEndpoints.length > 0) {
    console.log('## 🎯 Most Popular Endpoints\n')
    stats.topEndpoints.forEach((endpoint, index) => {
      const percentage = ((endpoint.count / stats.totalEvents) * 100).toFixed(1)
      console.log(
        `${index + 1}. **${endpoint.endpoint}** - ${endpoint.count} requests (${percentage}%)`
      )
    })
    console.log()
  }

  if (stats.topAgents.length > 0) {
    console.log('## 🤖 Most Active Agents\n')
    stats.topAgents.forEach((agent, index) => {
      const percentage = ((agent.count / stats.totalEvents) * 100).toFixed(1)
      console.log(
        `${index + 1}. **${agent.agent}** - ${agent.count} requests (${percentage}%)`
      )
    })
    console.log()
  }

  console.log('## 📊 Summary\n')
  if (stats.totalEvents < 50) {
    console.log('- **Status:** Early adoption phase')
    console.log('- **Recommendation:** Promote to AI community')
  } else if (stats.totalEvents < 200) {
    console.log('- **Status:** Growing adoption')
    console.log('- **Recommendation:** Expand interactive tools')
  } else {
    console.log('- **Status:** Strong engagement')
    console.log('- **Recommendation:** Monitor optimization opportunities')
  }
}

// Main function
async function generateReport() {
  const days = parsePeriod(values.period || '7d')

  console.log(
    chalk.blue(`\n📊 Generating AI Agent Report for last ${days} days...`)
  )
  console.log(chalk.gray(`🌐 Fetching data from ${values.baseUrl}`))

  const data = await fetchAnalytics(
    values.baseUrl || 'https://haasonsaas.com',
    days
  )

  switch (values.format) {
    case 'json':
      generateJsonReport(data)
      break
    case 'markdown':
      generateMarkdownReport(data)
      break
    case 'table':
    default:
      generateTableReport(data)
      break
  }
}

// Run the report
generateReport().catch(console.error)
