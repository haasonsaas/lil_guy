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

// Function to extract keywords and n-grams from text
function getKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/[\s,.!?;:"'()[\]{}—-]+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ''))
    .filter((word) => word.length > 3 && !stopWords.has(word))

  const nGrams: string[] = []
  for (let i = 0; i < words.length; i++) {
    if (words[i] && words[i + 1]) {
      nGrams.push(`${words[i]} ${words[i + 1]}`) // 2-gram
    }
    if (words[i] && words[i + 1] && words[i + 2]) {
      nGrams.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`) // 3-gram
    }
  }
  return [...words, ...nGrams]
}

// Simple sentence tokenizer
function getSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
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
  sourceSlug: string
  targetSlug: string
  keyword: string
  targetTitle: string
  score: number
  suggestedSentence: string
  suggestedLine: number
}

async function main() {
  const posts: BlogPost[] = loadPostsFromDisk().filter(
    (p) => !p.frontmatter.draft
  )
  const suggestions = new Map<string, Suggestion>()

  for (const sourcePost of posts) {
    const sourceSentences = getSentences(sourcePost.content)

    for (const targetPost of posts) {
      if (sourcePost.slug === targetPost.slug) continue

      const targetKeywords = new Set([
        ...getKeywords(targetPost.frontmatter.title),
        ...getKeywords(targetPost.frontmatter.description),
        ...getKeywords(targetPost.content),
      ])

      for (let i = 0; i < sourceSentences.length; i++) {
        const sentence = sourceSentences[i]
        const sentenceLower = sentence.toLowerCase()

        for (const keyword of targetKeywords) {
          if (keyword.length < 4) continue

          const singularKeyword = singularize(keyword)

          if (
            sentenceLower.includes(` ${singularKeyword} `) ||
            sentenceLower.includes(` ${keyword} `)
          ) {
            const link = `](/blog/${targetPost.slug})`
            const suggestionKey = `${sourcePost.slug}->${targetPost.slug}->${keyword}`

            // Check if the link already exists in the source post content
            if (sourcePost.content.toLowerCase().includes(link)) {
              continue
            }

            // Check if a similar suggestion already exists to avoid duplicates
            if (suggestions.has(suggestionKey)) {
              continue
            }

            const score = calculateScore(keyword, sourcePost, targetPost)
            suggestions.set(suggestionKey, {
              sourceSlug: sourcePost.slug,
              targetSlug: targetPost.slug,
              keyword: keyword,
              targetTitle: targetPost.frontmatter.title,
              score: score,
              suggestedSentence: sentence,
              suggestedLine: i + 1, // Line numbers are 1-based
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
      if (!acc[suggestion.sourceSlug]) {
        acc[suggestion.sourceSlug] = []
      }
      acc[suggestion.sourceSlug].push(suggestion)
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
    for (const sourceSlug in groupedSuggestions) {
      console.log(`\n${chalk.bold.underline(sourceSlug)}:`)
      for (const suggestion of groupedSuggestions[sourceSlug]) {
        console.log(
          `- (Score: ${suggestion.score}) In &quot;${chalk.bold(suggestion.sourceSlug)}&quot;, the keyword &quot;${chalk.green(suggestion.keyword)}&quot; could link to &quot;${chalk.bold(suggestion.targetSlug)}&quot; (Post: ${suggestion.targetTitle}) - Line: ${suggestion.suggestedLine} - Sentence: &quot;${suggestion.suggestedSentence.substring(0, 100)}...&quot;`
        )
      }
    }
  } else {
    console.log(chalk.green('No new internal link opportunities found.'))
  }
}

main().catch(console.error)
