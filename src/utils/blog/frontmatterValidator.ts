import { BlogPostFrontmatter } from '@/types/blog';

export interface ValidationError {
  field: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Date validation regex - supports YYYY-MM-DD format
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Valid tag pattern - lowercase, hyphenated
const TAG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// URL validation
const URL_REGEX = /^https?:\/\/.+/;

export function validateFrontmatter(frontmatter: Record<string, unknown>, filename: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required fields
  if (!frontmatter.title) {
    errors.push({
      field: 'title',
      message: 'Title is required',
      suggestion: 'Add a title field to your frontmatter'
    });
  } else if (typeof frontmatter.title !== 'string') {
    errors.push({
      field: 'title',
      message: 'Title must be a string',
      suggestion: `Change title to a string: title: "${frontmatter.title}"`
    });
  } else if (frontmatter.title.length > 100) {
    warnings.push({
      field: 'title',
      message: 'Title is longer than 100 characters',
      suggestion: 'Consider shortening your title for better display'
    });
  }

  // Author validation
  if (!frontmatter.author) {
    errors.push({
      field: 'author',
      message: 'Author is required',
      suggestion: 'Add: author: "Jonathan Haas"'
    });
  }

  // Date validation
  if (!frontmatter.pubDate) {
    errors.push({
      field: 'pubDate',
      message: 'Publication date is required',
      suggestion: `Add: pubDate: "${new Date().toISOString().split('T')[0]}"`
    });
  } else if (!DATE_REGEX.test(frontmatter.pubDate)) {
    errors.push({
      field: 'pubDate',
      message: 'Invalid date format',
      suggestion: 'Use YYYY-MM-DD format, e.g., "2024-01-15"'
    });
  } else {
    // Check if date is valid
    const date = new Date(frontmatter.pubDate + 'T00:00:00');
    if (isNaN(date.getTime())) {
      errors.push({
        field: 'pubDate',
        message: 'Invalid date',
        suggestion: 'Check that the date is valid (e.g., not February 30)'
      });
    } else {
      // Compare dates only (not time) to avoid timezone issues
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (date > today) {
        warnings.push({
          field: 'pubDate',
          message: 'Publication date is in the future',
          suggestion: 'This post will not be visible until the publication date'
        });
      }
    }
  }

  // Description validation
  if (!frontmatter.description) {
    errors.push({
      field: 'description',
      message: 'Description is required for SEO',
      suggestion: 'Add a brief description (150-160 characters)'
    });
  } else if (frontmatter.description.length > 200) {
    warnings.push({
      field: 'description',
      message: 'Description is longer than recommended',
      suggestion: 'Keep descriptions between 150-160 characters for optimal SEO'
    });
  } else if (frontmatter.description.length < 50) {
    warnings.push({
      field: 'description',
      message: 'Description is very short',
      suggestion: 'Consider adding more detail for better SEO'
    });
  }

  // Boolean field validation - Note: We handle string booleans in fileLoader
  if (frontmatter.featured !== undefined && typeof frontmatter.featured !== 'boolean') {
    // Check for string booleans - only warn, don't error since we handle this
    if (frontmatter.featured === 'true' || frontmatter.featured === 'false') {
      // We handle this conversion in fileLoader, so don't report as error
    } else {
      errors.push({
        field: 'featured',
        message: 'Featured must be true or false',
        suggestion: 'Set featured: true or featured: false'
      });
    }
  }

  if (frontmatter.draft !== undefined && typeof frontmatter.draft !== 'boolean') {
    if (frontmatter.draft === 'true' || frontmatter.draft === 'false') {
      // We handle this conversion in fileLoader, so don't report as error
    } else {
      errors.push({
        field: 'draft',
        message: 'Draft must be true or false',
        suggestion: 'Set draft: true or draft: false'
      });
    }
  }

  // Tags validation
  if (!frontmatter.tags || !Array.isArray(frontmatter.tags)) {
    warnings.push({
      field: 'tags',
      message: 'Tags should be an array',
      suggestion: 'Add tags in array format:\ntags:\n  - tag1\n  - tag2'
    });
  } else {
    frontmatter.tags.forEach((tag: unknown, index: number) => {
      if (typeof tag !== 'string') {
        errors.push({
          field: `tags[${index}]`,
          message: 'Tag must be a string',
          suggestion: 'Ensure all tags are strings'
        });
      } else if (!TAG_REGEX.test(tag)) {
        warnings.push({
          field: `tags[${index}]`,
          message: `Tag "${tag}" should be lowercase and hyphenated`,
          suggestion: `Change to: ${tag.toLowerCase().replace(/\s+/g, '-')}`
        });
      }
    });

    if (frontmatter.tags.length === 0) {
      warnings.push({
        field: 'tags',
        message: 'No tags specified',
        suggestion: 'Add relevant tags for better categorization'
      });
    } else if (frontmatter.tags.length > 10) {
      warnings.push({
        field: 'tags',
        message: 'Too many tags',
        suggestion: 'Consider using 3-5 most relevant tags'
      });
    }
  }

  // Image validation
  if (frontmatter.image) {
    if (typeof frontmatter.image === 'string') {
      warnings.push({
        field: 'image',
        message: 'Image should be an object with url and alt properties',
        suggestion: 'Use format:\nimage:\n  url: "..."\n  alt: "..."'
      });
    } else if (typeof frontmatter.image === 'object') {
      if (!frontmatter.image.url) {
        errors.push({
          field: 'image.url',
          message: 'Image URL is required',
          suggestion: 'Add a URL to your image object'
        });
      } else if (!URL_REGEX.test(frontmatter.image.url)) {
        errors.push({
          field: 'image.url',
          message: 'Invalid image URL',
          suggestion: 'Use a valid HTTP(S) URL'
        });
      }

      if (!frontmatter.image.alt) {
        warnings.push({
          field: 'image.alt',
          message: 'Image alt text is missing',
          suggestion: 'Add alt text for accessibility'
        });
      }
    }
  }

  // Check for common typos
  const validFields = ['author', 'pubDate', 'title', 'description', 'featured', 'draft', 'tags', 'image'];
  const frontmatterKeys = Object.keys(frontmatter);
  
  frontmatterKeys.forEach(key => {
    if (!validFields.includes(key)) {
      // Check for common typos
      const typoMap: Record<string, string> = {
        'date': 'pubDate',
        'published': 'pubDate',
        'publishDate': 'pubDate',
        'tag': 'tags',
        'category': 'tags',
        'categories': 'tags',
        'desc': 'description',
        'summary': 'description',
        'isDraft': 'draft',
        'is_draft': 'draft',
        'isFeatured': 'featured',
        'is_featured': 'featured',
        'coverImage': 'image',
        'cover': 'image',
        'thumbnail': 'image'
      };

      if (typoMap[key]) {
        warnings.push({
          field: key,
          message: `Unknown field "${key}"`,
          suggestion: `Did you mean "${typoMap[key]}"?`
        });
      } else {
        warnings.push({
          field: key,
          message: `Unknown field "${key}"`,
          suggestion: 'This field will be ignored'
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Format validation results for console output
export function formatValidationResults(results: ValidationResult, filename: string): string {
  const lines: string[] = [];
  
  if (!results.isValid) {
    lines.push(`\n❌ Frontmatter validation failed for ${filename}:`);
    lines.push('');
    
    results.errors.forEach(error => {
      lines.push(`  ❗ ${error.field}: ${error.message}`);
      if (error.suggestion) {
        lines.push(`     💡 ${error.suggestion}`);
      }
    });
  }
  
  if (results.warnings.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push(`⚠️  Frontmatter warnings for ${filename}:`);
    lines.push('');
    
    results.warnings.forEach(warning => {
      lines.push(`  ⚡ ${warning.field}: ${warning.message}`);
      if (warning.suggestion) {
        lines.push(`     💡 ${warning.suggestion}`);
      }
    });
  }
  
  return lines.join('\n');
}