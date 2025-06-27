import { loadPostsFromDisk } from './serverFileLoader'
import chalk from 'chalk'
import type { BlogPost } from '../src/types/blog'

// Expanded list of stop words to improve suggestion quality
const stopWords = new Set([
  'a',
  'an',
  'the',
  'in',
  'on',
  'of',
  'for',
  'to',
  'and',
  'with',
  'is',
  'as',
  'it',
  'so',
  'but',
  'or',
  'about',
  'after',
  'all',
  'also',
  'always',
  'am',
  'are',
  'at',
  'be',
  'because',
  'been',
  'before',
  'being',
  'between',
  'both',
  'by',
  'can',
  'could',
  'did',
  'do',
  'does',
  'doing',
  'down',
  'during',
  'each',
  'few',
  'from',
  'further',
  'had',
  'has',
  'have',
  'having',
  'he',
  'her',
  'here',
  'hers',
  'herself',
  'him',
  'himself',
  'his',
  'how',
  'i',
  'if',
  'into',
  'is',
  'it',
  'its',
  'itself',
  'just',
  'me',
  'more',
  'most',
  'my',
  'myself',
  'no',
  'nor',
  'not',
  'now',
  'only',
  'other',
  'our',
  'ours',
  'ourselves',
  'out',
  'over',
  'own',
  'same',
  'she',
  'should',
  'so',
  'some',
  'such',
  'than',
  'that',
  'their',
  'theirs',
  'them',
  'themselves',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'too',
  'under',
  'until',
  'up',
  'very',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'will',
  'with',
  'would',
  'you',
  'your',
  'yours',
  'yourself',
  'yourselves',
  'thing',
  'things',
  'really',
  'see',
  'make',
  'use',
  'get',
  'go',
  'lot',
])

// Simple function to get the singular form of a word
function singularize(word: string): string {
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y'
  }
  if (word.endsWith('s')) {
    return word.slice(0, -1)
  }
  return word
}

// Function to extract keywords from a title
function getKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .split(/[\s,-]+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ''))
    .filter((word) => word.length > 3 && !stopWords.has(word))
}

// Calculate a relevance score for a suggestion
function calculateScore(
  keyword: string,
  sourcePost: BlogPost,
  targetPost: BlogPost
): number {
  let score = 0
  // Longer keywords are more specific and should have a higher score
  score += keyword.length * 2

  // Posts with more tags in common are more likely to be related
  const sourceTags = new Set(sourcePost.frontmatter.tags || [])
  const targetTags = new Set(targetPost.frontmatter.tags || [])
  const commonTags = new Set(
    [...sourceTags].filter((tag) => targetTags.has(tag))
  )
  score += commonTags.size * 5

  return score
}

interface Suggestion {
  source: string
  target: string
  keyword: string
  targetTitle: string
  score: number
}

async function main() {
  const posts: BlogPost[] = loadPostsFromDisk().filter(
    (p) => !p.frontmatter.draft
  )
  const suggestions = new Map<string, Suggestion>()

  for (const sourcePost of posts) {
    for (const targetPost of posts) {
      if (sourcePost.slug === targetPost.slug) continue

      const keywords = getKeywords(targetPost.frontmatter.title)
      const sourceContent = ` ${sourcePost.content.toLowerCase().replace(/[.,]/g, '')} `

      for (const keyword of keywords) {
        if (keyword.length < 4) continue

        const singularKeyword = singularize(keyword)

        if (
          sourceContent.includes(` ${singularKeyword} `) ||
          sourceContent.includes(` ${keyword} `)
        ) {
          const link = `](/blog/${targetPost.slug})`
          const suggestionKey = `${sourcePost.slug}->${targetPost.slug}`

          if (
            !sourcePost.content.toLowerCase().includes(link) &&
            !suggestions.has(suggestionKey)
          ) {
            const score = calculateScore(keyword, sourcePost, targetPost)
            suggestions.set(suggestionKey, {
              source: sourcePost.slug,
              target: targetPost.slug,
              keyword: keyword,
              targetTitle: targetPost.frontmatter.title,
              score: score,
            })
          }
        }
      }
    }
  }

  // Convert map to array and sort by score
  const sortedSuggestions = Array.from(suggestions.values()).sort(
    (a, b) => b.score - a.score
  )

  // Group suggestions by source post
  const groupedSuggestions = sortedSuggestions.reduce(
    (acc, suggestion) => {
      if (!acc[suggestion.source]) {
        acc[suggestion.source] = []
      }
      acc[suggestion.source].push(suggestion)
      return acc
    },
    {} as Record<string, Suggestion[]>
  )

  if (Object.keys(groupedSuggestions).length > 0) {
    console.log(
      chalk.blue(
        `Found ${sortedSuggestions.length} potential internal link opportunities, grouped by source post:`
      )
    )
    for (const sourcePost in groupedSuggestions) {
      console.log(`
${chalk.bold.underline(sourcePost)}:`)
      for (const suggestion of groupedSuggestions[sourcePost]) {
        console.log(
          `- (Score: ${suggestion.score}) In "${chalk.bold(suggestion.source)}", the keyword "${chalk.green(suggestion.keyword)}" could link to "${chalk.bold(suggestion.target)}" (Post: ${suggestion.targetTitle})`
        )
      }
    }
  } else {
    console.log(chalk.green('No new internal link opportunities found.'))
  }
}

main().catch(console.error)
