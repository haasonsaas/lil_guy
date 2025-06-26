#!/usr/bin/env bun

import { generateRSSFeed, generateAtomFeed } from './serverRssGenerator'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

async function generateStaticFeeds() {
  try {
    console.log('Generating static RSS and Atom feeds...')

    // Generate the feeds using server-compatible loaders
    const rssContent = generateRSSFeed()
    const atomContent = generateAtomFeed()

    // Ensure dist directory exists
    const distDir = join(process.cwd(), 'dist')
    mkdirSync(distDir, { recursive: true })

    // Write RSS feed
    const rssPath = join(distDir, 'rss.xml')
    writeFileSync(rssPath, rssContent, 'utf-8')
    console.log(`✅ RSS feed generated: ${rssPath}`)

    // Write Atom feed
    const atomPath = join(distDir, 'atom.xml')
    writeFileSync(atomPath, atomContent, 'utf-8')
    console.log(`✅ Atom feed generated: ${atomPath}`)

    // Also write to public directory for development
    const publicDir = join(process.cwd(), 'public')
    mkdirSync(publicDir, { recursive: true })

    const publicRssPath = join(publicDir, 'rss.xml')
    const publicAtomPath = join(publicDir, 'atom.xml')

    writeFileSync(publicRssPath, rssContent, 'utf-8')
    writeFileSync(publicAtomPath, atomContent, 'utf-8')

    console.log(`✅ RSS feed also generated in public: ${publicRssPath}`)
    console.log(`✅ Atom feed also generated in public: ${publicAtomPath}`)
  } catch (error) {
    console.error('Error generating static feeds:', error)
    process.exit(1)
  }
}

generateStaticFeeds()
