import { parseArgs } from 'util'
import chalk from 'chalk'

export interface BaseCliOptions {
  format?: 'table' | 'json' | 'markdown'
  help?: boolean
}

interface CliOption {
  type: 'string' | 'boolean' | 'number'
  short?: string
  default?: string | boolean | number
  description?: string
}

export interface CliConfig<T extends BaseCliOptions> {
  name: string
  description: string
  examples: string[]
  options: Record<string, CliOption>
  defaultOptions?: Partial<T>
}

/**
 * Create a standardized CLI with consistent error handling
 */
export function createCLI<T extends BaseCliOptions>(config: CliConfig<T>): T {
  try {
    const { values, positionals } = parseArgs({
      args: Bun.argv,
      options: {
        help: {
          type: 'boolean',
          short: 'h',
        },
        ...config.options,
      },
      strict: true,
      allowPositionals: true,
    })

    if (values.help) {
      showHelp(config)
      process.exit(0)
    }

    // Merge with defaults
    const merged = {
      ...config.defaultOptions,
      ...values,
      positionals,
    } as T

    return merged
  } catch (error) {
    console.error(chalk.red('Error parsing arguments:'), error)
    showHelp(config)
    process.exit(1)
  }
}

/**
 * Show help message
 */
function showHelp<T extends BaseCliOptions>(config: CliConfig<T>): void {
  console.log(`
${chalk.bold('Usage:')} ${config.name} [options]

${chalk.bold('Description:')}
  ${config.description}

${chalk.bold('Options:')}
  -h, --help      Show this help message
  ${formatOptions(config.options)}

${chalk.bold('Examples:')}
${config.examples.map((ex) => `  ${ex}`).join('\n')}
  `)
}

/**
 * Format options for help display
 */
function formatOptions(options: Record<string, CliOption>): string {
  return Object.entries(options)
    .filter(([key]) => key !== 'help')
    .map(([key, opt]) => {
      const short = opt.short ? `-${opt.short}, ` : '    '
      const defaultStr = opt.default ? ` [default: ${opt.default}]` : ''
      const description = opt.description || ''
      return `  ${short}--${key.padEnd(12)} ${description}${defaultStr}`
    })
    .join('\n')
}

/**
 * Format output based on format option
 */
export function formatOutput<T>(
  data: T,
  format: string = 'table',
  formatters: {
    table: (data: T) => void
    markdown: (data: T) => void
    json?: (data: T) => void
  }
): void {
  switch (format) {
    case 'json':
      if (formatters.json) {
        formatters.json(data)
      } else {
        console.log(JSON.stringify(data, null, 2))
      }
      break
    case 'markdown':
      formatters.markdown(data)
      break
    case 'table':
    default:
      formatters.table(data)
  }
}

/**
 * Progress bar for long operations
 */
export class ProgressBar {
  private current = 0
  private width = 40

  constructor(
    private total: number,
    private label = 'Progress'
  ) {}

  update(current: number): void {
    this.current = current
    this.render()
  }

  increment(): void {
    this.current++
    this.render()
  }

  private render(): void {
    const percent = Math.round((this.current / this.total) * 100)
    const filled = Math.round((this.current / this.total) * this.width)
    const bar = '█'.repeat(filled) + '░'.repeat(this.width - filled)

    process.stdout.write(
      `\r${this.label}: [${bar}] ${percent}% (${this.current}/${this.total})`
    )

    if (this.current >= this.total) {
      process.stdout.write('\n')
    }
  }
}

/**
 * Error handling utilities
 */
export class BlogScriptError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'BlogScriptError'
  }
}

export function handleError(error: unknown): never {
  if (error instanceof BlogScriptError) {
    console.error(chalk.red(`Error (${error.code}): ${error.message}`))
    if (error.context) {
      console.error(chalk.gray('Context:'), error.context)
    }
  } else if (error instanceof Error) {
    console.error(chalk.red('Error:'), error.message)
    if (process.env.DEBUG) {
      console.error(chalk.gray(error.stack))
    }
  } else {
    console.error(chalk.red('Unexpected error:'), error)
  }
  process.exit(1)
}

/**
 * Common color scheme
 */
export const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  muted: chalk.gray,
  highlight: chalk.cyan,
  bold: chalk.bold,
}

/**
 * Format helpers
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatNumber(num: number): string {
  return num.toLocaleString()
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  return count === 1 ? singular : plural || `${singular}s`
}
