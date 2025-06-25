import { loadPostsFromDisk } from './serverFileLoader'
import chalk from 'chalk'

async function main() {
  const posts = loadPostsFromDisk().filter((p) => !p.frontmatter.draft)
  const suggestions = []

  for (const sourcePost of posts) {
    for (const targetPost of posts) {
      if (sourcePost.slug === targetPost.slug) continue

      const targetTitle = targetPost.frontmatter.title.toLowerCase()
      const sourceContent = sourcePost.content.toLowerCase()

      if (targetTitle && sourceContent.includes(targetTitle)) {
        const link = `](/blog/${targetPost.slug})`
        if (!sourceContent.includes(link)) {
          suggestions.push({
            source: sourcePost.slug,
            target: targetPost.slug,
            text: targetPost.frontmatter.title,
          })
        }
      }
    }
  }

  if (suggestions.length > 0) {
    console.log(chalk.blue('Found the following internal link opportunities:'))
    for (const suggestion of suggestions) {
      console.log(
        `In "${chalk.bold(suggestion.source)}", found text "${chalk.green(suggestion.text)}" which could link to "${chalk.bold(suggestion.target)}"`
      )
    }
  } else {
    console.log(chalk.green('No new internal link opportunities found.'))
  }
}

main().catch(console.error)
