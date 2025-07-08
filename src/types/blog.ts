export interface BlogPostFrontmatter {
  author: string
  pubDate: string
  title: string
  description: string
  featured: boolean
  draft: boolean
  tags: string[]
  image: {
    url: string
    alt: string
  }
  series?: {
    name: string
    part: number
  }
  // Pre-calculated reading metrics to avoid needing full content for listings
  readingTime?: {
    minutes: number
    wordCount: number
  }
}

export interface BlogPost {
  slug: string
  frontmatter: BlogPostFrontmatter
  content: string
}
