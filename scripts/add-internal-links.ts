import { loadPostsFromDisk } from './serverFileLoader'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import chalk from 'chalk'

async function main() {
  const posts = loadPostsFromDisk().filter((p) => !p.frontmatter.draft)
  const suggestions = []

  for (const sourcePost of posts) {
    for (const targetPost of posts) {
      if (sourcePost.slug === targetPost.slug) continue

      const targetTitle = targetPost.frontmatter.title
      const sourceContent = sourcePost.content

      if (targetTitle && sourceContent.includes(targetTitle)) {
        const link = `](/blog/${targetPost.slug})`
        if (!sourceContent.includes(link)) {
          suggestions.push({
            source: sourcePost.slug,
            target: targetPost.slug,
            text: targetTitle,
          })
        }
      }
    }
  }

  if (suggestions.length > 0) {
    console.log(chalk.blue('Adding the following internal links:'))
    for (const suggestion of suggestions) {
      console.log(
        `In "${chalk.bold(suggestion.source)}", linking "${chalk.green(suggestion.text)}" to "${chalk.bold(suggestion.target)}"`
      )

      const sourcePath = join(
        process.cwd(),
        'src/posts',
        `${suggestion.source}.md`
      )
      const sourceContent = await readFile(sourcePath, 'utf-8')
      const newContent = sourceContent.replace(
        suggestion.text,
        `[${suggestion.text}](/blog/${suggestion.target})`
      )
      await writeFile(sourcePath, newContent)
    }
  } else {
    console.log(chalk.green('No new internal link opportunities found.'))
  }
}

main().catch(console.error)
