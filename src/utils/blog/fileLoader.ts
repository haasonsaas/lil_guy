import { BlogPost, BlogPostFrontmatter } from '@/types/blog'

interface RawFrontmatter {
  postSlug?: string
  author?: string
  pubDate?: string
  title?: string
  description?: string
  featured?: boolean
  draft?: boolean
  tags?: string[] | string
  image?: {
    url?: string
    alt?: string
  }
}

/**
 * Calculate reading time in minutes based on word count
 * Inline implementation to avoid circular imports
 */
const calculateReadingTimeInline = (
  content: string
): { minutes: number; wordCount: number } => {
  // Average reading speed in words per minute
  const WORDS_PER_MINUTE = 200

  // Clean up the content while preserving meaningful text
  const text = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks with triple backticks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/^\s*[-*]\s.*$/gm, '') // Remove list items
    .replace(/^\s*\d+\.\s.*$/gm, '') // Remove numbered list items
    .replace(/^\s*#{1,6}\s.*$/gm, '') // Remove headers
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // Keep alt text from links/images
    .replace(/[#*`~>|]/g, '') // Remove markdown syntax
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))

  return {
    minutes,
    wordCount,
  }
}

/**
 * Load blog posts from markdown files in the /src/posts directory
 * @param metadataOnly - If true, only loads frontmatter without full content (default: false)
 */
export const readFilePosts = (metadataOnly: boolean = false): BlogPost[] => {
  const posts: BlogPost[] = []
  const seenSlugs = new Set<string>()
  let totalFiles = 0
  let skippedFiles = 0

  try {
    // Use import.meta.glob to get all markdown files
    const markdownFiles: Record<
      string,
      { default: { frontmatter: RawFrontmatter; content: string } }
    > = import.meta.glob('../../posts/*.md', { eager: true }) as Record<
      string,
      { default: { frontmatter: RawFrontmatter; content: string } }
    >

    totalFiles = Object.keys(markdownFiles).length
    if (import.meta.env.DEV) {
      console.log(`Found ${totalFiles} markdown files`)
    }

    Object.entries(markdownFiles).forEach(([filePath, moduleContent]) => {
      try {
        // Extract frontmatter and content from the module
        const { frontmatter, content } = moduleContent.default

        // Extract slug from filename or frontmatter
        let fileSlug = ''

        if (frontmatter && frontmatter.postSlug) {
          fileSlug = frontmatter.postSlug as string
        } else {
          // Extract the slug from filename if not specified in frontmatter
          fileSlug = filePath.split('/').pop()?.replace('.md', '') || ''
        }

        // Skip if we've already seen this slug
        if (seenSlugs.has(fileSlug)) {
          console.warn(`Skipping duplicate slug: ${fileSlug}`)
          skippedFiles++
          return
        }
        seenSlugs.add(fileSlug)

        // Set default values for any missing frontmatter fields
        const defaultFrontmatter: BlogPostFrontmatter = {
          author: 'Jonathan Haas',
          pubDate: new Date().toISOString().split('T')[0],
          title: fileSlug.replace(/-/g, ' '),
          description: 'No description provided',
          featured: false,
          draft: false,
          tags: [],
          image: {
            url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643',
            alt: 'Default blog post image',
          },
        }

        // Process tags to ensure they're in array format
        let tags: string[] = Array.isArray(frontmatter.tags)
          ? frontmatter.tags
          : []
        if (typeof frontmatter.tags === 'string') {
          tags = frontmatter.tags.split(',').map((tag) => tag.trim())
        }

        // Process image to ensure it has the correct format
        let image = { url: '', alt: '' }

        // Check if image exists in frontmatter
        if (frontmatter.image) {
          // Handle different image formats
          if (typeof frontmatter.image === 'string') {
            // If image is just a string, assume it's the URL
            image = { url: frontmatter.image as string, alt: 'Blog post image' }
          } else if (typeof frontmatter.image === 'object') {
            // If image is an object, extract url and alt properties
            const imageObj = frontmatter.image as Record<string, unknown>

            // Extract url property
            if (imageObj.url && typeof imageObj.url === 'string') {
              image.url = imageObj.url
            }

            // Extract alt property
            if (imageObj.alt && typeof imageObj.alt === 'string') {
              image.alt = imageObj.alt
            }
          }
        }

        // Ensure image has valid values or use defaults
        if (!image.url) {
          image.url = defaultFrontmatter.image!.url
        }

        if (!image.alt) {
          image.alt = defaultFrontmatter.image!.alt
        }

        // Process boolean fields - handle string boolean values
        let draftValue = defaultFrontmatter.draft
        if (frontmatter.draft !== undefined) {
          if (typeof frontmatter.draft === 'string') {
            draftValue = frontmatter.draft === 'true'
          } else {
            draftValue = !!frontmatter.draft
          }
        }

        let featuredValue = defaultFrontmatter.featured
        if (frontmatter.featured !== undefined) {
          if (typeof frontmatter.featured === 'string') {
            featuredValue = frontmatter.featured === 'true'
          } else {
            featuredValue = !!frontmatter.featured
          }
        }

        // Pre-calculate reading time if we have content and it's not metadata-only mode
        let readingTimeData
        if (!metadataOnly && content) {
          readingTimeData = calculateReadingTimeInline(content)
        }

        // Merge frontmatter with defaults, ensuring all required properties are present
        const processedFrontmatter: BlogPostFrontmatter = {
          ...defaultFrontmatter,
          author: frontmatter.author || defaultFrontmatter.author,
          pubDate: frontmatter.pubDate || defaultFrontmatter.pubDate,
          title: frontmatter.title || defaultFrontmatter.title,
          description:
            frontmatter.description || defaultFrontmatter.description,
          featured: featuredValue,
          draft: draftValue,
          tags,
          image: {
            url: frontmatter.image?.url || defaultFrontmatter.image.url,
            alt: frontmatter.image?.alt || defaultFrontmatter.image.alt,
          },
          readingTime: readingTimeData,
        }

        posts.push({
          slug: fileSlug,
          frontmatter: processedFrontmatter,
          content: content || '',
        })
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error)
        skippedFiles++
      }
    })

    if (import.meta.env.DEV) {
      console.log(
        `Successfully loaded ${posts.length} posts (${skippedFiles} skipped)`
      )
    }
    return posts
  } catch (error) {
    console.error('Error loading markdown files:', error)
    return []
  }
}
