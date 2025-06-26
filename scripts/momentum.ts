#!/usr/bin/env bun

import { parseArgs } from 'util'
import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import matter from 'gray-matter'

interface Post {
  slug: string
  frontmatter: {
    title: string
    pubDate: string
    draft?: boolean
  }
  content: string
  wordCount: number
  date: Date
}

interface MomentumData {
  currentStreak: number
  longestStreak: number
  totalWords30Days: number
  totalPosts30Days: number
  lastPostDate: Date
  daysSinceLastPost: number
  momentum: 'on-fire' | 'hot' | 'warm' | 'cooling' | 'cold'
  nudge: string
  weeklyPattern: { day: string; posts: number }[]
  recentPosts: { title: string; date: string; words: number }[]
  nextMilestone: { type: string; value: number; current: number }
}

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    format: {
      type: 'string',
      short: 'f',
      default: 'table',
    },
    quiet: {
      type: 'boolean',
      short: 'q',
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
${chalk.bold('Usage:')} bun run momentum [options]

${chalk.bold('Options:')}
  -f, --format    Output format (table, json, minimal) [default: table]
  -q, --quiet     Only show the nudge message
  -h, --help      Show this help message

${chalk.bold('Examples:')}
  bun run momentum              # Full momentum report
  bun run momentum -q           # Just the motivational nudge
  bun run momentum -f minimal   # Compact view
  `)
  process.exit(0)
}

async function getAllPosts(): Promise<Post[]> {
  const postsDir = path.join(process.cwd(), 'src', 'posts')
  const files = await fs.readdir(postsDir)
  const markdownFiles = files.filter((file) => file.endsWith('.md'))

  const posts = await Promise.all(
    markdownFiles.map(async (file) => {
      const filePath = path.join(postsDir, file)
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const { data, content } = matter(fileContent)

      const plainText = content
        .replace(/```[\s\S]*?```/g, '')
        .replace(/#+\s/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_~`]/g, '')
        .replace(/\n+/g, ' ')
      const wordCount = plainText
        .split(/\s+/)
        .filter((word) => word.length > 0).length

      return {
        slug: file.replace('.md', ''),
        frontmatter: data as Post['frontmatter'],
        content,
        wordCount,
        date: new Date(data.pubDate),
      }
    })
  )

  return posts
    .filter((p) => !p.frontmatter.draft)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

function calculateStreak(posts: Post[]): { current: number; longest: number } {
  if (posts.length === 0) return { current: 0, longest: 0 }

  const today = new Date()
  const lastPost = posts[0].date
  const daysSinceLastPost = Math.floor(
    (today.getTime() - lastPost.getTime()) / (1000 * 60 * 60 * 24)
  )

  // If last post was more than 7 days ago, streak is broken
  if (daysSinceLastPost > 7) {
    // Find longest historical streak
    let longest = 1
    let currentHistorical = 1

    for (let i = 1; i < posts.length; i++) {
      const daysBetween = Math.floor(
        (posts[i - 1].date.getTime() - posts[i].date.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      if (daysBetween <= 7) {
        currentHistorical++
        longest = Math.max(longest, currentHistorical)
      } else {
        currentHistorical = 1
      }
    }

    return { current: 0, longest }
  }

  // Calculate current streak
  let current = 1
  for (let i = 1; i < posts.length; i++) {
    const daysBetween = Math.floor(
      (posts[i - 1].date.getTime() - posts[i].date.getTime()) /
        (1000 * 60 * 60 * 24)
    )
    if (daysBetween <= 7) {
      current++
    } else {
      break
    }
  }

  // Calculate longest streak including current
  let longest = current
  let tempStreak = 1

  for (let i = 1; i < posts.length; i++) {
    const daysBetween = Math.floor(
      (posts[i - 1].date.getTime() - posts[i].date.getTime()) /
        (1000 * 60 * 60 * 24)
    )
    if (daysBetween <= 7) {
      tempStreak++
      longest = Math.max(longest, tempStreak)
    } else {
      tempStreak = 1
    }
  }

  return { current, longest }
}

function getMomentum(
  daysSinceLastPost: number,
  postsLast30Days: number
): MomentumData['momentum'] {
  if (daysSinceLastPost === 0 && postsLast30Days > 20) return 'on-fire'
  if (daysSinceLastPost <= 1 && postsLast30Days > 10) return 'hot'
  if (daysSinceLastPost <= 3 && postsLast30Days > 5) return 'warm'
  if (daysSinceLastPost <= 7) return 'cooling'
  return 'cold'
}

function getNextMilestone(
  currentStreak: number,
  totalPosts: number,
  totalWords: number
): MomentumData['nextMilestone'] {
  const milestones = [
    { type: 'streak', values: [7, 14, 30, 50, 100] },
    { type: 'posts', values: [10, 25, 50, 100, 150, 200] },
    { type: 'words', values: [10000, 25000, 50000, 100000, 250000] },
  ]

  // Find next streak milestone
  const nextStreak =
    milestones[0].values.find((v) => v > currentStreak) || currentStreak + 10
  const nextPosts =
    milestones[1].values.find((v) => v > totalPosts) || totalPosts + 25
  const nextWords =
    milestones[2].values.find((v) => v > totalWords) || totalWords + 10000

  // Find which is closest percentage-wise
  const streakPercent = currentStreak / nextStreak
  const postsPercent = totalPosts / nextPosts
  const wordsPercent = totalWords / nextWords

  if (streakPercent >= postsPercent && streakPercent >= wordsPercent) {
    return { type: 'streak days', value: nextStreak, current: currentStreak }
  } else if (postsPercent >= wordsPercent) {
    return { type: 'total posts', value: nextPosts, current: totalPosts }
  } else {
    return { type: 'total words', value: nextWords, current: totalWords }
  }
}

function getNudge(data: MomentumData): string {
  const nudges = {
    'on-fire': [
      "🔥 You're absolutely on fire! This is legendary productivity!",
      '🚀 Houston, we have liftoff! Your writing is in orbit!',
      "⚡ You're writing at the speed of light! Einstein would be proud!",
      "🌟 You're a content MACHINE! Keep this incredible pace!",
      "💫 You've entered the flow state hall of fame!",
    ],
    hot: [
      "🔥 You're on a hot streak! Keep the momentum going!",
      "💪 Strong momentum! You're in the zone!",
      "🎯 You're hitting your targets! Stay focused!",
      '📈 Your consistency is paying off big time!',
      "✨ You're glowing with productivity!",
    ],
    warm: [
      "☀️ Nice and steady! You're building great habits!",
      '🌱 Your blog is growing beautifully! Water it with another post!',
      "🎵 You've found your rhythm! Dance with it!",
      '🏃 Good pace! Marathon, not a sprint!',
      "📝 You're in a good groove! Ride the wave!",
    ],
    cooling: [
      '❄️ Getting a bit chilly... Time to warm up with a new post!',
      "🕐 It's been a few days. Your readers miss you!",
      "💭 Got any ideas brewing? Now's the perfect time to write!",
      '🎪 The stage is set for your comeback!',
      '🌅 A new day, a new post? The world awaits your words!',
    ],
    cold: [
      '🧊 Brrr! Time to break the ice with a fresh post!',
      '💤 Your blog is hibernating. Time to wake it up!',
      '🚦 Green light! The road is clear for your next masterpiece!',
      '🎬 ...and ACTION! Your audience is waiting!',
      '🗝️ Unlock your potential - even 100 words can restart the engine!',
    ],
  }

  const pool = nudges[data.momentum]
  const base = pool[Math.floor(Math.random() * pool.length)]

  // Add contextual additions
  const additions = []

  if (data.currentStreak > 0 && data.currentStreak === data.longestStreak) {
    additions.push(
      `You're at your ALL-TIME BEST streak of ${data.currentStreak} posts!`
    )
  } else if (data.currentStreak > 0) {
    additions.push(`${data.currentStreak}-post streak and counting!`)
  }

  if (data.daysSinceLastPost === 0) {
    additions.push("You already posted today - you're unstoppable!")
  } else if (data.daysSinceLastPost === 1) {
    additions.push('Just yesterday you were writing. Keep it up!')
  }

  const progressPercent = Math.round(
    (data.nextMilestone.current / data.nextMilestone.value) * 100
  )
  if (progressPercent > 80) {
    additions.push(
      `You're ${progressPercent}% to ${data.nextMilestone.value} ${data.nextMilestone.type}!`
    )
  }

  return additions.length > 0 ? `${base} ${additions.join(' ')}` : base
}

async function analyzeMomentum(): Promise<MomentumData> {
  const posts = await getAllPosts()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const recentPosts = posts.filter((p) => p.date >= thirtyDaysAgo)
  const { current: currentStreak, longest: longestStreak } =
    calculateStreak(posts)

  const lastPost = posts[0]
  const daysSinceLastPost = lastPost
    ? Math.floor(
        (now.getTime() - lastPost.date.getTime()) / (1000 * 60 * 60 * 24)
      )
    : 999

  // Weekly pattern for last 30 days
  const weekDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  const weeklyPattern = weekDays.map((day) => ({ day, posts: 0 }))

  recentPosts.forEach((post) => {
    const dayIndex = post.date.getDay()
    weeklyPattern[dayIndex].posts++
  })

  const totalWords30Days = recentPosts.reduce((sum, p) => sum + p.wordCount, 0)
  const totalAllTimeWords = posts.reduce((sum, p) => sum + p.wordCount, 0)
  const momentum = getMomentum(daysSinceLastPost, recentPosts.length)
  const nextMilestone = getNextMilestone(
    currentStreak,
    posts.length,
    totalAllTimeWords
  )

  const data: MomentumData = {
    currentStreak,
    longestStreak,
    totalWords30Days,
    totalPosts30Days: recentPosts.length,
    lastPostDate: lastPost?.date || new Date(0),
    daysSinceLastPost,
    momentum,
    nudge: '',
    weeklyPattern,
    recentPosts: posts.slice(0, 5).map((p) => ({
      title: p.frontmatter.title,
      date: p.date.toLocaleDateString(),
      words: p.wordCount,
    })),
    nextMilestone,
  }

  data.nudge = getNudge(data)

  return data
}

function formatTable(data: MomentumData): void {
  const momentumEmoji = {
    'on-fire': '🔥',
    hot: '🌟',
    warm: '☀️',
    cooling: '❄️',
    cold: '🧊',
  }

  console.log(chalk.bold.blue('\n📊 Writing Momentum Tracker\n'))

  // Big nudge message
  console.log(chalk.bold.green(data.nudge))
  console.log()

  // Momentum status
  const momentumColor = {
    'on-fire': chalk.red,
    hot: chalk.yellow,
    warm: chalk.green,
    cooling: chalk.blue,
    cold: chalk.gray,
  }[data.momentum]

  console.log(chalk.bold('Status'))
  console.log(
    `  Momentum: ${momentumEmoji[data.momentum]} ${momentumColor(data.momentum.toUpperCase())}`
  )
  console.log(
    `  Current Streak: ${chalk.green(data.currentStreak + ' posts')} ${data.currentStreak === data.longestStreak ? chalk.yellow('(Personal Best!)') : ''}`
  )
  console.log(`  Longest Streak: ${chalk.blue(data.longestStreak + ' posts')}`)
  console.log(
    `  Days Since Last Post: ${data.daysSinceLastPost === 0 ? chalk.green('Today!') : chalk.yellow(data.daysSinceLastPost + ' days')}`
  )
  console.log()

  // 30-day summary
  console.log(chalk.bold('Last 30 Days'))
  console.log(`  Posts: ${chalk.green(data.totalPosts30Days)}`)
  console.log(`  Words: ${chalk.green(data.totalWords30Days.toLocaleString())}`)
  console.log(
    `  Average: ${chalk.blue(Math.round(data.totalWords30Days / Math.max(data.totalPosts30Days, 1)) + ' words/post')}`
  )
  console.log()

  // Weekly pattern
  console.log(chalk.bold('Best Writing Days'))
  const sortedDays = [...data.weeklyPattern].sort((a, b) => b.posts - a.posts)
  sortedDays.slice(0, 3).forEach((day, i) => {
    if (day.posts > 0) {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
      console.log(`  ${medal} ${day.day}: ${day.posts} posts`)
    }
  })
  console.log()

  // Next milestone
  const progress = Math.round(
    (data.nextMilestone.current / data.nextMilestone.value) * 100
  )
  const progressBar =
    '█'.repeat(Math.floor(progress / 5)) +
    '░'.repeat(20 - Math.floor(progress / 5))
  console.log(chalk.bold('Next Milestone'))
  console.log(
    `  ${data.nextMilestone.type}: ${data.nextMilestone.current} → ${data.nextMilestone.value}`
  )
  console.log(`  Progress: [${progressBar}] ${progress}%`)
  console.log()

  // Recent posts
  console.log(chalk.bold('Recent Posts'))
  data.recentPosts.forEach((post) => {
    console.log(`  • ${chalk.cyan(post.title)}`)
    console.log(`    ${chalk.gray(post.date)} - ${post.words} words`)
  })
}

function formatMinimal(data: MomentumData): void {
  const statusLine =
    data.momentum === 'on-fire' || data.momentum === 'hot'
      ? chalk.green(`🔥 ${data.currentStreak}-day streak`)
      : data.momentum === 'warm'
        ? chalk.yellow(`☀️ ${data.currentStreak}-day streak`)
        : chalk.gray(`Last post: ${data.daysSinceLastPost} days ago`)

  const progress = Math.round(
    (data.nextMilestone.current / data.nextMilestone.value) * 100
  )

  console.log(
    `${statusLine} | ${data.totalPosts30Days} posts last 30d | ${progress}% to ${data.nextMilestone.value} ${data.nextMilestone.type}`
  )
  console.log(chalk.bold(data.nudge))
}

async function main() {
  const data = await analyzeMomentum()

  if (values.quiet) {
    console.log(chalk.bold(data.nudge))
    return
  }

  switch (values.format) {
    case 'json':
      console.log(JSON.stringify(data, null, 2))
      break
    case 'minimal':
      formatMinimal(data)
      break
    default:
      formatTable(data)
  }
}

main().catch(console.error)
