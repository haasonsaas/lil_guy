#!/usr/bin/env bun

import { parseArgs } from 'util'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import chalk from 'chalk'

// Parse command line arguments
const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    content: {
      type: 'boolean',
      short: 'c',
      default: false,
    },
    tags: {
      type: 'boolean',
      short: 't',
      default: false,
    },
    title: {
      type: 'boolean',
      default: false,
    },
    limit: {
      type: 'string',
      short: 'l',
      default: '10',
    },
    case: {
      type: 'boolean',
      short: 'C',
      default: false,
    },
  },
  strict: true,
  allowPositionals: true,
})

// Get search query
const query = positionals.slice(2).join(' ')
if (!query) {
  console.error('❌ Error: Please provide a search query')
  console.error(
    'Usage: bun run search "query" [-c|--content] [-t|--tags] [--title] [-l|--limit N] [-C|--case]'
  )
  console.error('\nOptions:')
  console.error(
    '  -c, --content  Search in post content (default: searches everything)'
  )
  console.error('  -t, --tags     Search only in tags')
  console.error('  --title        Search only in titles')
  console.error('  -l, --limit    Maximum results to show (default: 10)')
  console.error('  -C, --case     Case-sensitive search')
  process.exit(1)
}

interface SearchResult {
  file: string
  title: string
  matches: {
    location: string
    line: number
    text: string
    highlight: string
  }[]
  score: number
}

// Parse frontmatter from markdown
function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>
  body: string
} {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]+)$/)
  if (!match) return { frontmatter: {}, body: content }

  const frontmatterText = match[1]
  const body = match[2]
  const frontmatter: Record<string, unknown> = {}

  // Simple YAML parser for frontmatter
  const lines = frontmatterText.split('\n')
  let currentKey = ''
  let inArray = false

  for (const line of lines) {
    if (line.match(/^[a-zA-Z]+:/)) {
      const [key, ...valueParts] = line.split(':')
      currentKey = key.trim()
      const value = valueParts.join(':').trim()

      if (value) {
        frontmatter[currentKey] = value.replace(/^["']|["']$/g, '')
      } else {
        inArray = true
        frontmatter[currentKey] = []
      }
    } else if (inArray && line.trim().startsWith('-')) {
      const value = line
        .trim()
        .substring(1)
        .trim()
        .replace(/^["']|["']$/g, '')
      if (Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey].push(value)
      }
    } else if (line.trim() && !line.trim().startsWith('-')) {
      inArray = false
    }
  }

  return { frontmatter, body }
}

// Highlight search matches
function highlightMatch(
  text: string,
  query: string,
  caseSensitive: boolean
): string {
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    caseSensitive ? 'g' : 'gi'
  )
  return text.replace(regex, chalk.yellow.bold('$1'))
}

// Calculate relevance score
function calculateScore(
  matches: SearchResult['matches'],
  inTitle: boolean,
  inTags: boolean
): number {
  let score = matches.length
  if (inTitle) score *= 10
  if (inTags) score *= 5
  return score
}

// Search in a single file
async function searchFile(
  filepath: string,
  query: string,
  options: {
    content?: boolean
    tags?: boolean
    title?: boolean
    case?: boolean
  }
): Promise<SearchResult | null> {
  try {
    const content = await readFile(filepath, 'utf-8')
    const { frontmatter, body } = parseFrontmatter(content)
    const matches: SearchResult['matches'] = []
    const searchRegex = new RegExp(
      query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      options.case ? 'g' : 'gi'
    )

    let hasMatch = false
    let inTitle = false
    let inTags = false

    // Search in title
    if (!options.content && !options.tags) {
      if (frontmatter.title && searchRegex.test(frontmatter.title)) {
        hasMatch = true
        inTitle = true
        matches.push({
          location: 'title',
          line: 0,
          text: frontmatter.title,
          highlight: highlightMatch(frontmatter.title, query, options.case),
        })
      }
    }

    // Search in tags
    if (
      (options.tags || (!options.content && !options.title)) &&
      frontmatter.tags
    ) {
      const tags = Array.isArray(frontmatter.tags)
        ? frontmatter.tags
        : [frontmatter.tags]
      tags.forEach((tag: string) => {
        if (searchRegex.test(tag)) {
          hasMatch = true
          inTags = true
          matches.push({
            location: 'tags',
            line: 0,
            text: tag,
            highlight: highlightMatch(tag, query, options.case),
          })
        }
      })
    }

    // Search in content
    if (options.content || (!options.tags && !options.title)) {
      const lines = body.split('\n')
      lines.forEach((line, index) => {
        if (searchRegex.test(line)) {
          hasMatch = true
          const trimmedLine = line.trim()
          if (trimmedLine) {
            matches.push({
              location: 'content',
              line: index + 1,
              text:
                trimmedLine.substring(0, 100) +
                (trimmedLine.length > 100 ? '...' : ''),
              highlight:
                highlightMatch(
                  trimmedLine.substring(0, 100),
                  query,
                  options.case
                ) + (trimmedLine.length > 100 ? '...' : ''),
            })
          }
        }
      })
    }

    if (!hasMatch) return null

    return {
      file: filepath.split('/').pop()!,
      title: frontmatter.title || 'Untitled',
      matches: matches.slice(0, 5), // Limit matches per file
      score: calculateScore(matches, inTitle, inTags),
    }
  } catch (error) {
    console.error(`Error reading ${filepath}:`, error)
    return null
  }
}

// Main search function
async function search() {
  const postsDir = join(process.cwd(), 'src', 'posts')
  const files = await readdir(postsDir)
  const mdFiles = files.filter((f) => f.endsWith('.md'))

  console.log(
    chalk.blue(`🔍 Searching for "${query}" in ${mdFiles.length} posts...\n`)
  )

  const results: SearchResult[] = []

  // Search all files
  for (const file of mdFiles) {
    const filepath = join(postsDir, file)
    const result = await searchFile(filepath, query, values)
    if (result) {
      results.push(result)
    }
  }

  // Sort by relevance score
  results.sort((a, b) => b.score - a.score)

  // Limit results
  const limit = parseInt(values.limit as string) || 10
  const limitedResults = results.slice(0, limit)

  // Display results
  if (limitedResults.length === 0) {
    console.log(chalk.yellow('No matches found.'))
    return
  }

  console.log(
    chalk.green(
      `Found ${results.length} matching posts${results.length > limit ? ` (showing top ${limit})` : ''}:\n`
    )
  )

  limitedResults.forEach((result, index) => {
    console.log(chalk.bold.cyan(`${index + 1}. ${result.title}`))
    console.log(chalk.gray(`   📄 ${result.file}`))

    result.matches.forEach((match) => {
      const icon =
        match.location === 'title'
          ? '📌'
          : match.location === 'tags'
            ? '🏷️ '
            : '📝'

      if (match.location === 'content') {
        console.log(
          chalk.gray(`   ${icon} Line ${match.line}: `) + match.highlight
        )
      } else {
        console.log(
          chalk.gray(`   ${icon} ${match.location}: `) + match.highlight
        )
      }
    })

    console.log('')
  })

  if (results.length > limit) {
    console.log(
      chalk.gray(`\n💡 Tip: Use -l ${limit + 10} to see more results`)
    )
  }
}

// Run search
search().catch(console.error)
