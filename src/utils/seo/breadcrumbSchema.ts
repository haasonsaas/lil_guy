// Enhanced Breadcrumb Schema Generator for Better SEO

export interface BreadcrumbItem {
  name: string
  url: string
  position?: number
}

export interface EnhancedBreadcrumbStructuredData {
  '@context': string
  '@type': string
  itemListElement: Array<{
    '@type': string
    position: number
    name: string
    item: {
      '@type': string
      '@id': string
      name: string
    }
  }>
}

/**
 * Generate enhanced breadcrumb structured data with more SEO features
 */
export function generateEnhancedBreadcrumbStructuredData(
  items: BreadcrumbItem[]
): EnhancedBreadcrumbStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position || index + 1,
      name: item.name,
      item: {
        '@type': 'WebPage',
        '@id': item.url,
        name: item.name,
      },
    })),
  }
}

/**
 * Auto-generate breadcrumbs for blog posts based on URL structure and tags
 */
export function generateBlogPostBreadcrumbs(
  slug: string,
  title: string,
  tags?: string[],
  baseUrl: string = 'https://haasonsaas.com'
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      name: 'Home',
      url: baseUrl,
      position: 1,
    },
    {
      name: 'Blog',
      url: `${baseUrl}/blog`,
      position: 2,
    },
  ]

  // Add primary tag as a category if available
  if (tags && tags.length > 0) {
    const primaryTag = tags[0]
    breadcrumbs.push({
      name: formatTagName(primaryTag),
      url: `${baseUrl}/tags/${encodeURIComponent(primaryTag)}`,
      position: 3,
    })
  }

  // Add the current post
  breadcrumbs.push({
    name: title,
    url: `${baseUrl}/blog/${slug}`,
    position: breadcrumbs.length + 1,
  })

  return breadcrumbs
}

/**
 * Generate breadcrumbs for tag pages
 */
export function generateTagBreadcrumbs(
  tag: string,
  baseUrl: string = 'https://haasonsaas.com'
): BreadcrumbItem[] {
  return [
    {
      name: 'Home',
      url: baseUrl,
      position: 1,
    },
    {
      name: 'Blog',
      url: `${baseUrl}/blog`,
      position: 2,
    },
    {
      name: 'Tags',
      url: `${baseUrl}/tags`,
      position: 3,
    },
    {
      name: formatTagName(tag),
      url: `${baseUrl}/tags/${encodeURIComponent(tag)}`,
      position: 4,
    },
  ]
}

/**
 * Generate breadcrumbs for static pages
 */
export function generateStaticPageBreadcrumbs(
  pageName: string,
  pageUrl: string,
  baseUrl: string = 'https://haasonsaas.com'
): BreadcrumbItem[] {
  return [
    {
      name: 'Home',
      url: baseUrl,
      position: 1,
    },
    {
      name: pageName,
      url: pageUrl,
      position: 2,
    },
  ]
}

/**
 * Generate breadcrumbs for nested pages (like About > Team)
 */
export function generateNestedPageBreadcrumbs(
  pageHierarchy: Array<{ name: string; path: string }>,
  baseUrl: string = 'https://haasonsaas.com'
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      name: 'Home',
      url: baseUrl,
      position: 1,
    },
  ]

  pageHierarchy.forEach((page, index) => {
    breadcrumbs.push({
      name: page.name,
      url: `${baseUrl}${page.path}`,
      position: index + 2,
    })
  })

  return breadcrumbs
}

/**
 * Format tag names for better display (capitalize, replace hyphens)
 */
function formatTagName(tag: string): string {
  return tag
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Generate category-based breadcrumbs for better topical organization
 */
export function generateTopicalBreadcrumbs(
  slug: string,
  title: string,
  tags: string[],
  baseUrl: string = 'https://haasonsaas.com'
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      name: 'Home',
      url: baseUrl,
      position: 1,
    },
    {
      name: 'Blog',
      url: `${baseUrl}/blog`,
      position: 2,
    },
  ]

  // Map tags to topical categories for better SEO structure
  const topicalCategories = getTopicalCategory(tags)

  if (topicalCategories.length > 0) {
    topicalCategories.forEach((category, index) => {
      breadcrumbs.push({
        name: category.name,
        url: category.url,
        position: breadcrumbs.length + 1,
      })
    })
  }

  // Add the current post
  breadcrumbs.push({
    name: title,
    url: `${baseUrl}/blog/${slug}`,
    position: breadcrumbs.length + 1,
  })

  return breadcrumbs
}

/**
 * Map tags to topical categories for SEO hierarchy
 */
function getTopicalCategory(
  tags: string[]
): Array<{ name: string; url: string }> {
  const categories: Array<{ name: string; url: string }> = []
  const baseUrl = 'https://haasonsaas.com'

  // Define topic hierarchies
  const topicMappings: Record<
    string,
    { name: string; path: string; parent?: string }
  > = {
    ai: { name: 'AI & Machine Learning', path: '/topics/ai' },
    startup: { name: 'Startup Strategy', path: '/topics/startup' },
    'product-management': {
      name: 'Product Management',
      path: '/topics/product',
    },
    engineering: {
      name: 'Engineering Leadership',
      path: '/topics/engineering',
    },
    saas: { name: 'SaaS Development', path: '/topics/saas' },
    security: { name: 'Security', path: '/topics/security' },
    leadership: { name: 'Leadership', path: '/topics/leadership' },
  }

  // Find the most specific topic category
  for (const tag of tags) {
    if (topicMappings[tag]) {
      const mapping = topicMappings[tag]
      categories.push({
        name: mapping.name,
        url: `${baseUrl}${mapping.path}`,
      })
      break // Only add the first matching category to avoid overly deep hierarchy
    }
  }

  return categories
}

/**
 * Validate breadcrumb structure for SEO best practices
 */
export function validateBreadcrumbs(breadcrumbs: BreadcrumbItem[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (breadcrumbs.length < 2) {
    errors.push(
      'Breadcrumbs should have at least 2 items (Home + current page)'
    )
  }

  if (breadcrumbs.length > 6) {
    warnings.push(
      'Breadcrumbs are quite deep (>6 levels) - consider simplifying navigation structure'
    )
  }

  // Check first item is always "Home"
  if (breadcrumbs.length > 0 && breadcrumbs[0].name !== 'Home') {
    warnings.push(
      'First breadcrumb should typically be "Home" for best user experience'
    )
  }

  // Check for proper URL structure
  breadcrumbs.forEach((item, index) => {
    if (!item.url.startsWith('http')) {
      errors.push(
        `Breadcrumb ${index + 1}: URL should be absolute (include https://)`
      )
    }

    if (item.name.length < 1) {
      errors.push(`Breadcrumb ${index + 1}: Name cannot be empty`)
    }

    if (item.name.length > 60) {
      warnings.push(
        `Breadcrumb ${index + 1}: Name is quite long (>${60} characters) - consider shortening`
      )
    }

    // Check position numbering
    const expectedPosition = index + 1
    if (item.position && item.position !== expectedPosition) {
      warnings.push(
        `Breadcrumb ${index + 1}: Position should be ${expectedPosition} but is ${item.position}`
      )
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Generate JSON-LD script tag content for breadcrumbs
 */
export function generateBreadcrumbJsonLd(
  breadcrumbs: BreadcrumbItem[]
): string {
  const structuredData = generateEnhancedBreadcrumbStructuredData(breadcrumbs)
  return JSON.stringify(structuredData, null, 2)
}
