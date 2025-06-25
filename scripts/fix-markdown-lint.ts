import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import chalk from 'chalk'

async function fixMarkdownLintErrors() {
  const postsDir = join(process.cwd(), 'src/posts')
  const files = await readdir(postsDir)

  console.log(
    chalk.blue(`Scanning ${files.length} markdown files for linting issues...`)
  )

  let filesChanged = 0

  for (const file of files) {
    if (!file.endsWith('.md')) continue

    const filePath = join(postsDir, file)
    let content = await readFile(filePath, 'utf-8')
    const originalContent = content

    // Fix MD029: Ordered list item prefix
    content = content.replace(/^(\s*)(\d+)\. /gm, (match, indent, number) => {
      // This is a simple fix that assumes lists are separated by blank lines.
      // A more robust solution would parse the AST.
      return `${indent}1. `
    })

    // Fix MD040: Fenced code blocks should have a language specified
    content = content.replace(/```(?!\w)/g, '```text')

    // Fix MD028: No blanks in blockquote
    content = content.replace(/>\s*\n>/g, '>\n>')

    // Fix MD049: Emphasis style (underscore to asterisk)
    content = content.replace(/_([^_]+)_/g, '*$1*')

    if (content !== originalContent) {
      await writeFile(filePath, content, 'utf-8')
      console.log(chalk.green(`Fixed linting errors in: ${file}`))
      filesChanged++
    }
  }

  if (filesChanged > 0) {
    console.log(
      chalk.blue(`
Finished fixing ${filesChanged} files.`)
    )
    console.log(
      chalk.yellow(
        'Please review the changes and run the linter again to confirm.'
      )
    )
  } else {
    console.log(chalk.green('No linting errors were automatically fixed.'))
  }
}

fixMarkdownLintErrors().catch(console.error)
