// FAQ Schema Generator for Enhanced SEO

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQStructuredData {
  '@context': string
  '@type': string
  mainEntity: Array<{
    '@type': string
    name: string
    acceptedAnswer: {
      '@type': string
      text: string
    }
  }>
}

/**
 * Generates FAQ structured data from a list of questions and answers
 */
export function generateFAQStructuredData(
  faqItems: FAQItem[]
): FAQStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

/**
 * Extracts potential FAQ items from blog post content
 * Looks for patterns like "Q:", "Question:", headings followed by content
 */
export function extractFAQFromContent(content: string): FAQItem[] {
  const faqItems: FAQItem[] = []

  // Split content into lines
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  // Pattern 1: Look for "Q:" or "Question:" followed by "A:" or "Answer:"
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i]
    const nextLine = lines[i + 1]

    // Check if current line is a question
    if (isQuestionLine(currentLine)) {
      let answer = ''
      let j = i + 1

      // Look for answer in subsequent lines
      while (j < lines.length && !isQuestionLine(lines[j])) {
        if (isAnswerLine(lines[j])) {
          // Skip the "A:" prefix and get the actual answer
          answer += lines[j].replace(/^(A:|Answer:)\s*/i, '') + ' '
        } else if (answer.length > 0 && !isHeading(lines[j])) {
          // Continue the answer if we've already started one
          answer += lines[j] + ' '
        }
        j++
      }

      if (answer.trim().length > 10) {
        faqItems.push({
          question: cleanQuestionText(currentLine),
          answer: answer.trim(),
        })
      }
    }
  }

  // Pattern 2: Look for headings that are questions followed by content
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i]

    if (isHeading(currentLine) && isQuestionLike(currentLine)) {
      let answer = ''
      let j = i + 1

      // Collect content until next heading or question
      while (
        j < lines.length &&
        !isHeading(lines[j]) &&
        !isQuestionLine(lines[j])
      ) {
        if (lines[j].length > 0) {
          answer += lines[j] + ' '
        }
        j++
      }

      if (answer.trim().length > 20) {
        faqItems.push({
          question: cleanHeadingText(currentLine),
          answer: answer.trim(),
        })
      }
    }
  }

  // Remove duplicates and validate
  return faqItems
    .filter(
      (item, index, self) =>
        index ===
        self.findIndex(
          (other) =>
            other.question.toLowerCase() === item.question.toLowerCase()
        )
    )
    .filter(
      (item) =>
        item.question.length >= 10 &&
        item.answer.length >= 20 &&
        item.question.length <= 200 &&
        item.answer.length <= 1000
    )
}

/**
 * Check if a line is a question marker
 */
function isQuestionLine(line: string): boolean {
  return /^(Q:|Question:|❓|🤔)\s*/i.test(line)
}

/**
 * Check if a line is an answer marker
 */
function isAnswerLine(line: string): boolean {
  return /^(A:|Answer:|✅|💡)\s*/i.test(line)
}

/**
 * Check if a line is a heading (markdown style)
 */
function isHeading(line: string): boolean {
  return /^#{1,6}\s+/.test(line)
}

/**
 * Check if a line looks like a question
 */
function isQuestionLike(line: string): boolean {
  const cleanLine = line.replace(/^#{1,6}\s+/, '').trim()
  return (
    cleanLine.endsWith('?') ||
    /^(how|what|why|when|where|who|which|can|should|would|could|is|are|do|does|will)/i.test(
      cleanLine
    )
  )
}

/**
 * Clean question text by removing markers and formatting
 */
function cleanQuestionText(line: string): string {
  return line
    .replace(/^(Q:|Question:|❓|🤔)\s*/i, '')
    .replace(/^\*+\s*/, '')
    .replace(/\*+$/, '')
    .trim()
}

/**
 * Clean heading text by removing markdown syntax
 */
function cleanHeadingText(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*+/g, '')
    .trim()
}

/**
 * Auto-generate FAQ items from common blog post patterns
 */
export function generateCommonFAQs(
  frontmatter: {
    title: string
    content?: { split: (separator: string) => string[] }
  },
  tags: string[]
): FAQItem[] {
  const faqs: FAQItem[] = []

  // Add reading time FAQ
  faqs.push({
    question: `How long does it take to read "${frontmatter.title}"?`,
    answer: `This article takes approximately ${Math.ceil((frontmatter.content?.split(' ').length || 1000) / 200)} minutes to read at an average reading speed.`,
  })

  // Add topic-specific FAQs based on tags
  if (tags.includes('ai')) {
    faqs.push({
      question: 'What should I know about AI implementation in enterprise?',
      answer:
        'AI implementation requires careful planning, proper data preparation, and realistic expectations about capabilities and limitations.',
    })
  }

  if (tags.includes('startup')) {
    faqs.push({
      question: 'What are the key factors for startup success?',
      answer:
        'Successful startups focus on solving real problems, finding product-market fit, building strong teams, and managing cash flow effectively.',
    })
  }

  if (tags.includes('product-management')) {
    faqs.push({
      question: 'What skills are essential for product managers?',
      answer:
        'Product managers need strong analytical skills, customer empathy, technical understanding, communication abilities, and strategic thinking.',
    })
  }

  // Add author FAQ
  faqs.push({
    question: 'Who is Jonathan Haas and what is his background?',
    answer:
      'Jonathan Haas is a product and engineering leader with over a decade of experience in enterprise software, AI, and vertical SaaS. He has founded multiple companies and advises startups on product strategy.',
  })

  return faqs
}

/**
 * Validate FAQ items for SEO best practices
 */
export function validateFAQItems(items: FAQItem[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (items.length === 0) {
    warnings.push(
      'No FAQ items found - consider adding some Q&A content for better SEO'
    )
    return { isValid: true, errors, warnings }
  }

  if (items.length > 10) {
    warnings.push(
      'More than 10 FAQ items - consider grouping or prioritizing the most important ones'
    )
  }

  items.forEach((item, index) => {
    if (item.question.length < 10) {
      errors.push(
        `FAQ ${index + 1}: Question too short (minimum 10 characters)`
      )
    }

    if (item.question.length > 200) {
      warnings.push(
        `FAQ ${index + 1}: Question very long (over 200 characters) - consider shortening`
      )
    }

    if (item.answer.length < 20) {
      errors.push(`FAQ ${index + 1}: Answer too short (minimum 20 characters)`)
    }

    if (item.answer.length > 1000) {
      warnings.push(
        `FAQ ${index + 1}: Answer very long (over 1000 characters) - consider shortening`
      )
    }

    if (!item.question.endsWith('?')) {
      warnings.push(
        `FAQ ${index + 1}: Question should end with a question mark`
      )
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
