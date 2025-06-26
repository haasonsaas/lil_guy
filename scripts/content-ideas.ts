#!/usr/bin/env bun

import { parseArgs } from 'util'
import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import matter from 'gray-matter'

interface ContentIdea {
  title: string
  type:
    | 'sequel'
    | 'deep-dive'
    | 'counter-point'
    | 'practical-guide'
    | 'case-study'
    | 'comparison'
  basedOn?: string
  rationale: string
  suggestedTags: string[]
  estimatedWords: number
  difficulty: 'easy' | 'medium' | 'hard'
}

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    count: {
      type: 'string',
      short: 'n',
      default: '10',
    },
    type: {
      type: 'string',
      short: 't',
    },
    format: {
      type: 'string',
      short: 'f',
      default: 'table',
    },
    help: {
      type: 'boolean',
      short: 'h',
    },
  },
  strict: true,
  allowPositionals: true,
})

if (values.help) {
  console.log(`
${chalk.bold('Usage:')} bun run ideas [options]

${chalk.bold('Options:')}
  -n, --count     Number of ideas to generate [default: 10]
  -t, --type      Filter by type (sequel, deep-dive, practical-guide, etc.)
  -f, --format    Output format (table, json, markdown) [default: table]
  -h, --help      Show this help message

${chalk.bold('Examples:')}
  bun run ideas                     # Generate 10 content ideas
  bun run ideas -n 20 -t sequel     # Generate 20 sequel ideas
  bun run ideas -f markdown         # Export as markdown
  `)
  process.exit(0)
}

async function getAllPosts() {
  const postsDir = path.join(process.cwd(), 'src', 'posts')
  const files = await fs.readdir(postsDir)
  const markdownFiles = files.filter((file) => file.endsWith('.md'))

  const posts = await Promise.all(
    markdownFiles.map(async (file) => {
      const filePath = path.join(postsDir, file)
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const { data, content } = matter(fileContent)

      return {
        slug: file.replace('.md', ''),
        frontmatter: data,
        content,
      }
    })
  )

  return posts.filter((p) => !p.frontmatter.draft)
}

interface Post {
  slug: string
  frontmatter: {
    title: string
    pubDate: string
    description?: string
    tags?: string[]
    draft?: boolean
  }
  content: string
}

function getTopTags(posts: Post[]): Map<string, number> {
  const tagCounts = new Map<string, number>()

  posts.forEach((post) => {
    if (post.frontmatter.tags) {
      // Handle both array and string formats
      const tags = Array.isArray(post.frontmatter.tags)
        ? post.frontmatter.tags
        : [post.frontmatter.tags]

      tags.forEach((tag: string) => {
        if (typeof tag === 'string') {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        }
      })
    }
  })

  return new Map([...tagCounts.entries()].sort((a, b) => b[1] - a[1]))
}

function findContentGaps(
  posts: Post[],
  topTags: Map<string, number>
): string[] {
  const gaps: string[] = []

  // Tag combinations that don't exist
  const tagArray = Array.from(topTags.keys()).slice(0, 10)
  for (let i = 0; i < tagArray.length; i++) {
    for (let j = i + 1; j < tagArray.length; j++) {
      const tag1 = tagArray[i]
      const tag2 = tagArray[j]

      const hasCombo = posts.some((p) => {
        if (!p.frontmatter.tags) return false
        const tags = Array.isArray(p.frontmatter.tags)
          ? p.frontmatter.tags
          : [p.frontmatter.tags]
        return (
          tags.filter((t) => typeof t === 'string').includes(tag1) &&
          tags.filter((t) => typeof t === 'string').includes(tag2)
        )
      })

      if (!hasCombo && Math.random() > 0.5) {
        gaps.push(`${tag1} + ${tag2}`)
      }
    }
  }

  // Missing topic areas based on common SaaS/tech topics
  const commonTopics = [
    'security',
    'performance',
    'testing',
    'deployment',
    'monitoring',
    'team-building',
    'fundraising',
    'customer-success',
    'pricing-strategy',
    'competitive-analysis',
    'market-research',
    'user-research',
    'design-systems',
  ]

  commonTopics.forEach((topic) => {
    const hasTopic = posts.some((p) => {
      if (p.frontmatter.title.toLowerCase().includes(topic)) return true
      if (!p.frontmatter.tags) return false

      const tags = Array.isArray(p.frontmatter.tags)
        ? p.frontmatter.tags
        : [p.frontmatter.tags]
      return tags.some(
        (tag: string) => typeof tag === 'string' && tag.includes(topic)
      )
    })

    if (!hasTopic) {
      gaps.push(topic)
    }
  })

  return gaps
}

function generateIdeas(
  posts: Post[],
  count: number,
  typeFilter?: string
): ContentIdea[] {
  const ideas: ContentIdea[] = []
  const topTags = getTopTags(posts)
  const gaps = findContentGaps(posts, topTags)

  // Helper to get random items
  const getRandom = <T>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)]
  const getRandomTags = (num: number): string[] => {
    const tags = Array.from(topTags.keys())
    const selected = new Set<string>()
    while (selected.size < Math.min(num, tags.length)) {
      selected.add(getRandom(tags))
    }
    return Array.from(selected)
  }

  // Idea generators by type
  const generators: Record<string, () => ContentIdea | null> = {
    sequel: () => {
      const post = getRandom(posts)
      if (!post) return null

      return {
        title: `${post.frontmatter.title}: The Implementation Guide`,
        type: 'sequel',
        basedOn: post.frontmatter.title,
        rationale: `Readers loved the concepts in "${post.frontmatter.title}". This follow-up provides practical implementation details.`,
        suggestedTags: [
          ...(post.frontmatter.tags || []),
          'implementation',
          'tutorial',
        ],
        estimatedWords: 1500,
        difficulty: 'medium',
      }
    },

    'deep-dive': () => {
      const tag = getRandom(Array.from(topTags.keys()))
      const relatedPosts = posts.filter((p) => {
        if (!p.frontmatter.tags) return false
        const tags = Array.isArray(p.frontmatter.tags)
          ? p.frontmatter.tags
          : [p.frontmatter.tags]
        return tags.filter((t) => typeof t === 'string').includes(tag)
      })

      return {
        title: `The Complete Guide to ${tag.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`,
        type: 'deep-dive',
        rationale: `You've written ${relatedPosts.length} posts about ${tag}. Time for a comprehensive guide that ties it all together.`,
        suggestedTags: [tag, 'guide', 'comprehensive'],
        estimatedWords: 3000,
        difficulty: 'hard',
      }
    },

    'counter-point': () => {
      const post = getRandom(
        posts.filter(
          (p) =>
            p.frontmatter.title.includes('Why') ||
            p.frontmatter.title.includes('How')
        )
      )
      if (!post) return null

      const counterTitle = post.frontmatter.title
        .replace('Why You Should', "Why You Shouldn't Always")
        .replace('How to', 'When Not to')
        .replace('The Best', 'Alternatives to the Best')

      return {
        title: counterTitle,
        type: 'counter-point',
        basedOn: post.frontmatter.title,
        rationale:
          'Balanced perspectives build trust. This explores the nuances and edge cases.',
        suggestedTags: [
          ...(post.frontmatter.tags || []),
          'perspective',
          'analysis',
        ],
        estimatedWords: 1200,
        difficulty: 'medium',
      }
    },

    'practical-guide': () => {
      const gap = getRandom(gaps)

      return {
        title: `A Practical Guide to ${gap.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} for SaaS Founders`,
        type: 'practical-guide',
        rationale: `This topic hasn't been covered yet and fills a content gap in your blog.`,
        suggestedTags: [gap, 'guide', 'saas', 'founders'],
        estimatedWords: 1800,
        difficulty: 'medium',
      }
    },

    'case-study': () => {
      const topics = [
        'scaling',
        'hiring',
        'product-market-fit',
        'pricing',
        'architecture',
      ]
      const topic = getRandom(topics)

      return {
        title: `From 0 to 100k MRR: A ${topic.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Case Study`,
        type: 'case-study',
        rationale:
          'Real-world examples and data resonate strongly with your audience.',
        suggestedTags: [topic, 'case-study', 'growth', 'metrics'],
        estimatedWords: 2000,
        difficulty: 'easy',
      }
    },

    comparison: () => {
      const topics = [
        ['React', 'Vue', 'Angular'],
        ['AWS', 'GCP', 'Azure'],
        ['PostgreSQL', 'MySQL', 'MongoDB'],
        ['Stripe', 'Paddle', 'Chargebee'],
        ['Linear', 'Jira', 'Asana'],
        ['Vercel', 'Netlify', 'Cloudflare Pages'],
      ]

      const comparison = getRandom(topics)
      const [first, second] = [comparison[0], comparison[1]]

      return {
        title: `${first} vs ${second}: A Founder's Perspective`,
        type: 'comparison',
        rationale:
          'Comparison posts are highly searched and help readers make informed decisions.',
        suggestedTags: [
          'comparison',
          'tools',
          'decision-making',
          first.toLowerCase(),
          second.toLowerCase(),
        ],
        estimatedWords: 2500,
        difficulty: 'hard',
      }
    },
  }

  // Generate ideas
  const types = typeFilter ? [typeFilter] : Object.keys(generators)

  while (ideas.length < count) {
    const type = getRandom(types)
    const idea = generators[type]()

    if (idea && !ideas.some((i) => i.title === idea.title)) {
      ideas.push(idea)
    }
  }

  // Add some interactive component ideas
  const interactiveIdeas = [
    {
      title: 'Build Your Own SaaS Financial Model: An Interactive Guide',
      type: 'practical-guide' as const,
      rationale:
        'Combine your expertise in SaaS metrics with interactive components for maximum engagement.',
      suggestedTags: ['saas', 'metrics', 'interactive', 'financial-modeling'],
      estimatedWords: 1500,
      difficulty: 'medium' as const,
    },
    {
      title:
        'The Startup Decision Tree: Navigate Critical Choices Interactively',
      type: 'practical-guide' as const,
      rationale:
        'Help founders make better decisions with an interactive decision tree component.',
      suggestedTags: ['startup', 'decision-making', 'interactive', 'strategy'],
      estimatedWords: 2000,
      difficulty: 'hard' as const,
    },
  ]

  // Mix in some interactive ideas
  if (Math.random() > 0.7 && ideas.length > 2) {
    ideas.splice(2, 0, getRandom(interactiveIdeas))
  }

  return ideas.slice(0, count)
}

function formatTable(ideas: ContentIdea[]): void {
  console.log(chalk.bold.blue('\n💡 Content Ideas Generator\n'))

  ideas.forEach((idea, index) => {
    const typeColors = {
      sequel: chalk.cyan,
      'deep-dive': chalk.blue,
      'counter-point': chalk.yellow,
      'practical-guide': chalk.green,
      'case-study': chalk.magenta,
      comparison: chalk.red,
    }

    const difficultyColors = {
      easy: chalk.green,
      medium: chalk.yellow,
      hard: chalk.red,
    }

    console.log(chalk.bold(`${index + 1}. ${idea.title}`))
    console.log(
      `   ${chalk.gray('Type:')} ${typeColors[idea.type](idea.type)} | ${chalk.gray('Difficulty:')} ${difficultyColors[idea.difficulty](idea.difficulty)} | ${chalk.gray('Est. Words:')} ${idea.estimatedWords}`
    )

    if (idea.basedOn) {
      console.log(`   ${chalk.gray('Based on:')} "${idea.basedOn}"`)
    }

    console.log(`   ${chalk.gray('Rationale:')} ${idea.rationale}`)
    console.log(`   ${chalk.gray('Tags:')} ${idea.suggestedTags.join(', ')}`)
    console.log()
  })

  // Summary by type
  const byType = ideas.reduce(
    (acc, idea) => {
      acc[idea.type] = (acc[idea.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  console.log(chalk.bold('📊 Summary'))
  console.log(`  Total ideas: ${chalk.blue(ideas.length)}`)
  console.log(`  By type:`)
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`    • ${type}: ${count}`)
  })

  // Quick wins
  const easyOnes = ideas.filter((i) => i.difficulty === 'easy')
  if (easyOnes.length > 0) {
    console.log(chalk.bold('\n🎯 Quick Wins'))
    easyOnes.slice(0, 3).forEach((idea) => {
      console.log(
        `  • "${chalk.green(idea.title)}" (${idea.estimatedWords} words)`
      )
    })
  }
}

function formatMarkdown(ideas: ContentIdea[]): void {
  console.log('# Content Ideas\n')
  console.log(`Generated: ${new Date().toLocaleDateString()}\n`)

  // Group by type
  const byType = ideas.reduce(
    (acc, idea) => {
      if (!acc[idea.type]) acc[idea.type] = []
      acc[idea.type].push(idea)
      return acc
    },
    {} as Record<string, ContentIdea[]>
  )

  Object.entries(byType).forEach(([type, typeIdeas]) => {
    console.log(
      `## ${type.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}\n`
    )

    typeIdeas.forEach((idea) => {
      console.log(`### ${idea.title}\n`)
      console.log(`- **Difficulty**: ${idea.difficulty}`)
      console.log(`- **Estimated words**: ${idea.estimatedWords}`)
      if (idea.basedOn) {
        console.log(`- **Based on**: "${idea.basedOn}"`)
      }
      console.log(`- **Rationale**: ${idea.rationale}`)
      console.log(`- **Suggested tags**: ${idea.suggestedTags.join(', ')}\n`)
    })
  })
}

async function main() {
  const posts = await getAllPosts()
  const count = parseInt(values.count || '10', 10)
  const ideas = generateIdeas(posts, count, values.type)

  switch (values.format) {
    case 'json':
      console.log(JSON.stringify(ideas, null, 2))
      break
    case 'markdown':
      formatMarkdown(ideas)
      break
    default:
      formatTable(ideas)
  }
}

main().catch(console.error)
