import React from 'react'
import { Helmet } from 'react-helmet-async'
import { BlogPostFrontmatter } from '@/types/blog'
import { generateBlogPostStructuredData } from '@/utils/seo/structuredData'
import {
  generateEnhancedBreadcrumbStructuredData,
  generateBlogPostBreadcrumbs,
} from '@/utils/seo/breadcrumbSchema'
import {
  generateFAQStructuredData,
  extractFAQFromContent,
  generateCommonFAQs,
} from '@/utils/seo/faqSchema'

interface AdvancedSEOProps {
  frontmatter: BlogPostFrontmatter
  slug: string
  content: string
  readingTime?: number
  enableFAQ?: boolean
  enableBreadcrumbs?: boolean
  customFAQs?: Array<{ question: string; answer: string }>
}

/**
 * Advanced SEO component with comprehensive structured data
 * Includes Blog Posting, FAQ, and Breadcrumb schemas
 */
export function AdvancedSEO({
  frontmatter,
  slug,
  content,
  readingTime,
  enableFAQ = true,
  enableBreadcrumbs = true,
  customFAQs = [],
}: AdvancedSEOProps) {
  const baseUrl = 'https://haasonsaas.com'

  // Generate blog post structured data
  const blogStructuredData = generateBlogPostStructuredData(
    frontmatter,
    slug,
    content,
    readingTime
  )

  // Enhanced structured data with additional properties
  const enhancedBlogData = {
    ...blogStructuredData,
    // Add reading time in different formats
    timeRequired: `PT${readingTime || Math.ceil(content.split(' ').length / 200)}M`,
    // Add content rating (family-friendly blog content)
    contentRating: 'General',
    // Add genre/category
    genre: frontmatter.tags || [],
    // Add word count for better indexing
    wordCount: content.replace(/\s+/g, ' ').split(' ').length,
    // Add language
    inLanguage: 'en-US',
    // Add content accessibility features
    accessibilityFeature: [
      'alternativeText',
      'readingOrder',
      'structuralNavigation',
      'tableOfContents',
    ],
    // Add content format
    encodingFormat: 'text/html',
    // Add learning resource type
    learningResourceType: frontmatter.tags?.includes('tutorial')
      ? 'Tutorial'
      : 'Article',
    // Add educational level if applicable
    educationalLevel: frontmatter.tags?.some((tag) =>
      ['beginner', 'intermediate', 'advanced'].includes(tag)
    )
      ? frontmatter.tags.find((tag) =>
          ['beginner', 'intermediate', 'advanced'].includes(tag)
        )
      : undefined,
  }

  // Generate breadcrumb structured data
  const breadcrumbData = enableBreadcrumbs
    ? generateEnhancedBreadcrumbStructuredData(
        generateBlogPostBreadcrumbs(
          slug,
          frontmatter.title,
          frontmatter.tags,
          baseUrl
        )
      )
    : null

  // Generate FAQ structured data
  let faqData = null
  if (enableFAQ) {
    // Extract FAQs from content or use custom ones
    const extractedFAQs = extractFAQFromContent(content)
    const commonFAQs = generateCommonFAQs(frontmatter, frontmatter.tags || [])
    const allFAQs = [...customFAQs, ...extractedFAQs, ...commonFAQs]

    // Remove duplicates and limit to 10 for optimal SEO
    const uniqueFAQs = allFAQs
      .filter(
        (faq, index, self) =>
          index ===
          self.findIndex(
            (other) =>
              other.question.toLowerCase() === faq.question.toLowerCase()
          )
      )
      .slice(0, 10)

    if (uniqueFAQs.length > 0) {
      faqData = generateFAQStructuredData(uniqueFAQs)
    }
  }

  // Generate How-To structured data for tutorial posts
  const generateHowToData = () => {
    if (
      !frontmatter.tags?.includes('tutorial') &&
      !frontmatter.tags?.includes('guide')
    ) {
      return null
    }

    // Extract steps from content (look for numbered lists or step patterns)
    const steps = extractStepsFromContent(content)

    if (steps.length < 2) return null

    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: frontmatter.title,
      description: frontmatter.description,
      image: `${baseUrl}/generated/1200x630-${frontmatter.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.webp`,
      totalTime: `PT${readingTime || Math.ceil(content.split(' ').length / 200)}M`,
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: '0',
      },
      supply: steps
        .map((step) => ({
          '@type': 'HowToSupply',
          name: step.supply || 'Basic development environment',
        }))
        .filter((supply) => supply.name !== 'Basic development environment')
        .slice(0, 3),
      tool: [
        {
          '@type': 'HowToTool',
          name: 'Computer with internet access',
        },
      ],
      step: steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
        url: `${baseUrl}/blog/${slug}#step-${index + 1}`,
      })),
    }
  }

  const howToData = generateHowToData()

  // Generate Video or Audio object if content mentions videos/podcasts
  const generateMediaData = () => {
    const hasVideo = /video|youtube|vimeo|embed/i.test(content)
    const hasAudio = /podcast|audio|soundcloud|spotify/i.test(content)

    if (!hasVideo && !hasAudio) return null

    if (hasVideo) {
      return {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: `${frontmatter.title} - Video Supplement`,
        description: `Video content related to: ${frontmatter.description}`,
        thumbnailUrl: `${baseUrl}/generated/1200x630-${frontmatter.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.webp`,
        contentUrl: `${baseUrl}/blog/${slug}`,
        embedUrl: `${baseUrl}/blog/${slug}`,
        uploadDate: new Date(frontmatter.pubDate).toISOString(),
        duration: `PT${(readingTime || 5) * 2}M`, // Estimate video as 2x reading time
      }
    }

    return null
  }

  const mediaData = generateMediaData()

  // Combine all structured data
  const allStructuredData = [
    enhancedBlogData,
    breadcrumbData,
    faqData,
    howToData,
    mediaData,
  ].filter(Boolean)

  return (
    <Helmet>
      {/* Enhanced meta tags for better social sharing */}
      <meta
        property="article:section"
        content={frontmatter.tags?.[0] || 'Blog'}
      />
      <meta
        property="article:tag"
        content={frontmatter.tags?.join(', ') || ''}
      />

      {/* Reading time meta */}
      <meta name="twitter:label1" content="Reading time" />
      <meta
        name="twitter:data1"
        content={`${readingTime || Math.ceil(content.split(' ').length / 200)} min read`}
      />

      {/* Content classification */}
      <meta name="twitter:label2" content="Category" />
      <meta name="twitter:data2" content={frontmatter.tags?.[0] || 'Blog'} />

      {/* Word count for indexing */}
      <meta
        name="word-count"
        content={content.replace(/\s+/g, ' ').split(' ').length.toString()}
      />

      {/* Content language */}
      <meta httpEquiv="content-language" content="en-US" />

      {/* Content type specification */}
      <meta name="content-type" content="text/html; charset=UTF-8" />

      {/* Structured data as JSON-LD */}
      {allStructuredData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data, null, 2)}
        </script>
      ))}
    </Helmet>
  )
}

/**
 * Extract steps from content for How-To structured data
 */
function extractStepsFromContent(content: string): Array<{
  name: string
  text: string
  supply?: string
}> {
  const steps: Array<{ name: string; text: string; supply?: string }> = []
  const lines = content.split('\n').map((line) => line.trim())

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Look for numbered steps (1., 2., Step 1, etc.)
    if (/^\d+\.|^Step\s+\d+/i.test(line)) {
      const stepText = line.replace(/^\d+\.\s*|^Step\s+\d+:?\s*/i, '')
      let description = ''

      // Collect description from following lines
      let j = i + 1
      while (
        j < lines.length &&
        lines[j] &&
        !/^\d+\.|^Step\s+\d+/i.test(lines[j])
      ) {
        if (lines[j].length > 0) {
          description += lines[j] + ' '
        }
        j++
      }

      if (stepText.length > 5) {
        steps.push({
          name: stepText,
          text: description.trim() || stepText,
          supply: extractSupplyFromStep(stepText + ' ' + description),
        })
      }
    }
  }

  return steps.slice(0, 10) // Limit to 10 steps for optimal SEO
}

/**
 * Extract required supplies/tools from step text
 */
function extractSupplyFromStep(stepText: string): string | undefined {
  const supplyKeywords = ['install', 'setup', 'create', 'download', 'configure']
  const lowerText = stepText.toLowerCase()

  for (const keyword of supplyKeywords) {
    if (lowerText.includes(keyword)) {
      // Extract the thing being installed/setup/created
      const match = stepText.match(
        new RegExp(`${keyword}\\s+([\\w\\s-]+)`, 'i')
      )
      if (match && match[1]) {
        return match[1].trim()
      }
    }
  }

  return undefined
}

export default AdvancedSEO
