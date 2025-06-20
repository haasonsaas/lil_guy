import React from 'react';
import { Helmet } from 'react-helmet-async';
import { BlogPostFrontmatter } from '@/types/blog';

interface AgentStructuredDataProps {
  frontmatter: BlogPostFrontmatter;
  slug: string;
  content: string;
  readingTime?: number;
}

/**
 * Enhanced structured data specifically designed for AI agents
 * Includes additional metadata for better content understanding
 */
export function AgentStructuredData({
  frontmatter,
  slug,
  content,
  readingTime
}: AgentStructuredDataProps) {
  const baseUrl = 'https://haasonsaas.com';
  
  // Calculate content metrics
  const wordCount = content.replace(/\s+/g, ' ').split(' ').length;
  const codeBlockCount = (content.match(/```/g) || []).length / 2;
  const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
  const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
  
  // Extract topics and concepts
  const extractTopics = (text: string, tags: string[] = []) => {
    const techTerms = [
      'react', 'typescript', 'javascript', 'cloudflare', 'api', 'spa', 'ssr',
      'opengraph', 'seo', 'html', 'css', 'nodejs', 'python', 'ai', 'ml',
      'saas', 'startup', 'product', 'engineering', 'frontend', 'backend',
      'database', 'security', 'performance', 'optimization', 'testing'
    ];
    
    const businessTerms = [
      'strategy', 'leadership', 'growth', 'marketing', 'sales', 'product-market-fit',
      'mvp', 'startup', 'venture-capital', 'funding', 'metrics', 'analytics',
      'conversion', 'churn', 'retention', 'customer', 'user-experience'
    ];
    
    const foundTechTerms = techTerms.filter(term => 
      text.toLowerCase().includes(term) || tags.includes(term)
    );
    
    const foundBusinessTerms = businessTerms.filter(term => 
      text.toLowerCase().includes(term) || tags.includes(term)
    );
    
    return {
      technical: foundTechTerms,
      business: foundBusinessTerms,
      all: [...new Set([...foundTechTerms, ...foundBusinessTerms, ...tags])]
    };
  };
  
  const topics = extractTopics(content, frontmatter.tags);
  
  // Determine content complexity
  const getComplexityLevel = () => {
    if (frontmatter.tags?.includes('beginner')) return 'Beginner';
    if (frontmatter.tags?.includes('advanced')) return 'Advanced';
    if (codeBlockCount > 5 || wordCount > 2000) return 'Intermediate';
    if (frontmatter.tags?.some(tag => ['tutorial', 'guide', 'how-to'].includes(tag))) return 'Intermediate';
    return 'Beginner';
  };
  
  // Enhanced structured data for AI agents
  const agentStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'TechnicalArticle',
    '@id': `${baseUrl}/blog/${slug}#article`,
    
    // Basic article information
    headline: frontmatter.title,
    description: frontmatter.description,
    url: `${baseUrl}/blog/${slug}`,
    image: `${baseUrl}/generated/1200x630-${frontmatter.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.webp`,
    
    // Author and publisher
    author: {
      '@type': 'Person',
      name: frontmatter.author || 'Jonathan Haas',
      url: baseUrl,
      sameAs: [
        'https://twitter.com/haasonsaas',
        'https://linkedin.com/in/jonathanhaas',
        'https://github.com/jonathanhaas'
      ]
    },
    publisher: {
      '@type': 'Organization',
      name: 'Haas on SaaS',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/favicon.svg`
      }
    },
    
    // Publishing information
    datePublished: frontmatter.pubDate,
    dateModified: frontmatter.pubDate,
    inLanguage: 'en-US',
    
    // Content metrics
    wordCount,
    timeRequired: `PT${readingTime || Math.ceil(wordCount / 200)}M`,
    
    // Content categorization
    keywords: topics.all.join(', '),
    about: topics.all.map(topic => ({
      '@type': 'Thing',
      name: topic,
      sameAs: `${baseUrl}/tags/${topic}`
    })),
    
    // Technical classification
    educationalLevel: getComplexityLevel(),
    learningResourceType: frontmatter.tags?.includes('tutorial') ? 'Tutorial' : 'Article',
    genre: frontmatter.tags || [],
    
    // Content features
    accessibilityFeature: [
      'alternativeText',
      'readingOrder',
      'structuralNavigation',
      'tableOfContents',
      'printPageBreaks'
    ],
    
    // Agent-specific metadata
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'codeBlockCount',
        value: codeBlockCount
      },
      {
        '@type': 'PropertyValue',
        name: 'externalLinkCount',
        value: linkCount
      },
      {
        '@type': 'PropertyValue',
        name: 'imageCount',
        value: imageCount
      },
      {
        '@type': 'PropertyValue',
        name: 'technicalTopics',
        value: topics.technical.join(', ')
      },
      {
        '@type': 'PropertyValue',
        name: 'businessTopics',
        value: topics.business.join(', ')
      },
      {
        '@type': 'PropertyValue',
        name: 'apiEndpoint',
        value: `${baseUrl}/api/posts/${slug}`
      },
      {
        '@type': 'PropertyValue',
        name: 'contentFormat',
        value: 'markdown'
      },
      {
        '@type': 'PropertyValue',
        name: 'featured',
        value: frontmatter.featured ? 'true' : 'false'
      }
    ],
    
    // Related resources
    isPartOf: {
      '@type': 'Blog',
      name: 'Haas on SaaS',
      url: `${baseUrl}/blog`,
      description: 'Expert insights on bridging technical vision with market reality'
    },
    
    // License and usage
    license: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    copyrightHolder: {
      '@type': 'Person',
      name: frontmatter.author || 'Jonathan Haas'
    },
    copyrightYear: new Date(frontmatter.pubDate).getFullYear(),
    
    // Machine-readable content access
    encoding: [
      {
        '@type': 'MediaObject',
        encodingFormat: 'application/json',
        contentUrl: `${baseUrl}/api/posts/${slug}`,
        description: 'Structured JSON representation of the article'
      },
      {
        '@type': 'MediaObject',
        encodingFormat: 'text/markdown',
        contentUrl: `${baseUrl}/api/posts/${slug}`,
        description: 'Raw markdown content'
      }
    ]
  };
  
  // Website-level structured data for better context
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'Website',
    '@id': `${baseUrl}#website`,
    name: 'Haas on SaaS',
    url: baseUrl,
    description: 'Expert insights on bridging technical vision with market reality',
    inLanguage: 'en-US',
    
    // Publisher information
    publisher: {
      '@type': 'Person',
      name: 'Jonathan Haas',
      jobTitle: 'SaaS Product Leader',
      worksFor: {
        '@type': 'Organization',
        name: 'Independent'
      }
    },
    
    // Site features for agents
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: `${baseUrl}/api/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      },
      {
        '@type': 'ReadAction',
        target: `${baseUrl}/api/posts`,
        name: 'Access all articles via API'
      }
    ],
    
    // Content organization
    mainEntity: {
      '@type': 'Blog',
      name: 'Haas on SaaS Blog',
      description: 'Technical and business insights for SaaS builders',
      blogPost: `${baseUrl}/blog/${slug}`
    }
  };
  
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(agentStructuredData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteData)}
      </script>
      
      {/* Additional meta tags for AI agents */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="ai-agent-friendly" content="true" />
      <meta name="content-api" content={`${baseUrl}/api/posts/${slug}`} />
      <meta name="content-format" content="markdown" />
      <meta name="content-topics" content={topics.all.join(', ')} />
      <meta name="content-complexity" content={getComplexityLevel()} />
      <meta name="word-count" content={wordCount.toString()} />
      <meta name="reading-time" content={(readingTime || Math.ceil(wordCount / 200)).toString()} />
      
      {/* Dublin Core metadata for academic/research use */}
      <meta name="DC.title" content={frontmatter.title} />
      <meta name="DC.creator" content={frontmatter.author || 'Jonathan Haas'} />
      <meta name="DC.description" content={frontmatter.description} />
      <meta name="DC.date" content={frontmatter.pubDate} />
      <meta name="DC.language" content="en-US" />
      <meta name="DC.format" content="text/html" />
      <meta name="DC.identifier" content={`${baseUrl}/blog/${slug}`} />
      <meta name="DC.subject" content={topics.all.join('; ')} />
      <meta name="DC.type" content="Text.Article" />
    </Helmet>
  );
}