import type { BlogPost } from '@/types/blog'

export interface PersonSchema {
  '@context': 'https://schema.org'
  '@type': 'Person'
  name: string
  url: string
  sameAs: string[]
  jobTitle: string
  worksFor: {
    '@type': 'Organization'
    name: string
  }
}

export interface WebsiteSchema {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  url: string
  description: string
  author: PersonSchema
  potentialAction: {
    '@type': 'SearchAction'
    target: string
    'query-input': string
  }
}

export interface BlogPostSchema {
  '@context': 'https://schema.org'
  '@type': 'BlogPosting'
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  author: PersonSchema
  publisher: PersonSchema
  mainEntityOfPage: {
    '@type': 'WebPage'
    '@id': string
  }
  image?: string
  keywords?: string[]
  wordCount?: number
  timeRequired?: string
}

export const getPersonSchema = (): PersonSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Jonathan Haas',
  url: 'https://www.haasonsaas.com',
  sameAs: [
    'https://twitter.com/haasonsaas',
    'https://www.linkedin.com/in/haasonsaas',
    'https://github.com/haasonsaas',
  ],
  jobTitle: 'SaaS Product Leader',
  worksFor: {
    '@type': 'Organization',
    name: 'Independent',
  },
})

export const getWebsiteSchema = (): WebsiteSchema => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Haas on SaaS',
  url: 'https://www.haasonsaas.com',
  description:
    "Expert insights on bridging technical vision with market reality. Learn from a decade of enterprise software experience about AI, vertical SaaS, and building products that can't be ignored.",
  author: getPersonSchema(),
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.haasonsaas.com/blog?search={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
})

export const getBlogPostSchema = (
  post: BlogPost,
  wordCount: number,
  readingTimeMinutes: number
): BlogPostSchema => {
  const baseUrl = 'https://www.haasonsaas.com'
  const postUrl = `${baseUrl}/blog/${post.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    url: postUrl,
    datePublished: post.frontmatter.pubDate,
    dateModified: post.frontmatter.pubDate, // Use same date for now
    author: getPersonSchema(),
    publisher: getPersonSchema(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    image: post.frontmatter.image?.url,
    keywords: post.frontmatter.tags,
    wordCount,
    timeRequired: `PT${readingTimeMinutes}M`,
  }
}

export const injectStructuredData = (
  schema: PersonSchema | WebsiteSchema | BlogPostSchema
) => {
  // Remove existing structured data
  const existingScript = document.querySelector(
    'script[type="application/ld+json"]'
  )
  if (existingScript) {
    existingScript.remove()
  }

  // Add new structured data
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(schema)
  document.head.appendChild(script)
}
