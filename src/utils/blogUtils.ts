import { BlogPost, BlogPostFrontmatter } from '@/types/blog';
import matter from 'gray-matter';

// Sample blog post with frontmatter and content
const sampleBlogPost: BlogPost = {
  slug: 'ai-experience-gap',
  frontmatter: {
    author: "Jonathan Haas",
    pubDate: "2024-11-29",
    title: "The AI Experience Gap: Why Better Models Aren't Enough",
    description: "Exploring the disconnect between AI product expectations and reality, and how to bridge it through AI-native design",
    featured: true,
    draft: false,
    tags: [
      "artificial-intelligence",
      "product-design",
      "user-experience",
      "technology",
      "software-development",
      "future-of-work",
      "human-computer-interaction"
    ],
    image: {
      url: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      alt: "A robot's hand touching a holographic interface displaying various digital elements, symbolizing the intersection of human interaction and artificial intelligence"
    }
  },
  content: `
# The AI Experience Gap: Why Better Models Aren't Enough

In the rapidly evolving landscape of artificial intelligence, there's a growing disconnect between the capabilities of AI models and the user experience of AI products. This is what I call the "AI Experience Gap."

## Understanding the Gap

The gap occurs when technically impressive AI capabilities don't translate into satisfying product experiences. Even as models like GPT-4 and Claude achieve remarkable benchmark results, users often find AI products:

- Unintuitive to interact with
- Frustrating when they fail
- Difficult to apply to real-world workflows

## Why This Matters

As AI becomes increasingly integrated into our digital tools, bridging this gap isn't just about convenience—it's essential for widespread adoption and value creation.

### Example: AI Assistants

Consider these common scenarios with AI assistants:

1. **Over-promising and under-delivering**: Products market themselves as capable of understanding any request, but users quickly hit limitations.

2. **Poor failure recovery**: When an AI makes a mistake, there's rarely a clear path to correction.

3. **Lack of context preservation**: Assistants often forget crucial details from earlier in a conversation.

## Bridging the Gap Through AI-Native Design

To create truly effective AI products, we need a fundamental rethinking of interface design. Here's how:

### 1. Set Clear Expectations

- Be explicit about capabilities and limitations
- Use progressive disclosure to introduce advanced features
- Provide examples of well-formed requests

### 2. Design for Collaborative Iteration

- Embrace incremental refinement as a core interaction model
- Let users easily modify, extend, or correct AI outputs
- Build visible history and state

### 3. Create Escape Hatches

- Always provide manual fallbacks when automation fails
- Design clear paths to human assistance
- Allow users to save and reuse successful interactions

## Conclusion

As AI capabilities continue to advance at an astounding pace, the quality of AI product experiences will increasingly depend not on the raw power of models, but on thoughtful, AI-native design that bridges the gap between technical capability and human needs.

The most successful AI products won't necessarily be those with the most advanced models, but those that most effectively translate model capabilities into intuitive, reliable tools that meaningfully enhance human work and creativity.
`
};

// Additional blog posts
const additionalBlogPosts: BlogPost[] = [
  {
    slug: 'future-of-development-tools',
    frontmatter: {
      author: "Jonathan Haas",
      pubDate: "2024-11-15",
      title: "The Future of Development Tools: AI as a Pair Programmer",
      description: "How AI is transforming the way we write code and what it means for the future of software development",
      featured: false,
      draft: false,
      tags: [
        "artificial-intelligence",
        "software-development",
        "programming",
        "future-of-work",
        "technology"
      ],
      image: {
        url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1',
        alt: "Gray and black laptop computer on surface showing code"
      }
    },
    content: `
# The Future of Development Tools: AI as a Pair Programmer

Software development is undergoing a profound transformation with the integration of AI assistants. These tools are evolving from simple code completers to sophisticated pair programmers that understand context, suggest entire functions, and help debug complex issues.

## The Current Landscape

Today's AI coding assistants can:
- Complete code as you type
- Generate functions from comments
- Explain unfamiliar code
- Suggest refactorings and optimizations

However, they're still in the early stages of their potential evolution.

## Looking Ahead: The Next Generation

The next wave of development tools will likely offer:

### 1. True Contextual Understanding

Future AI assistants will maintain a comprehensive understanding of your entire codebase, its architecture, and even the business domain. They'll suggest solutions that align with existing patterns and best practices specific to your project.

### 2. Autonomous Implementation of Complex Features

Rather than just generating individual functions, advanced AI will be capable of implementing entire features across multiple files, handling everything from data models to UI components with minimal guidance.

### 3. Interactive Debugging Partners

AI will evolve into active debugging partners that can:
- Proactively identify potential bugs before they manifest
- Explain complex runtime issues by tracing through execution paths
- Suggest and implement fixes for identified problems

### 4. Knowledge Integration

Future tools will seamlessly integrate documentation, Stack Overflow, GitHub issues, and internal knowledge bases, bringing relevant information directly into your IDE exactly when needed.

## Implications for Developers

This evolution raises important questions about the changing nature of development work:

1. **Skill Transformation**: The most valuable developer skills may shift from syntax knowledge to system design, problem formulation, and AI collaboration.

2. **Productivity Amplification**: Developers working with AI assistants may achieve productivity multipliers that fundamentally change team structures and project timelines.

3. **Learning Curves**: How will new developers learn when AI handles increasingly large portions of implementation details?

## Conclusion

The future of development tools isn't about replacing developers but transforming how they work. The most successful developers will be those who learn to effectively collaborate with AI assistants, leveraging their capabilities while providing the critical human elements of creativity, judgment, and contextual understanding that remain beyond AI's reach.

As these tools evolve, we'll need to thoughtfully adapt our development practices, training approaches, and even our understanding of what it means to be a software developer in an AI-augmented world.
`
  },
  {
    slug: 'ethical-considerations-in-ai',
    frontmatter: {
      author: "Jonathan Haas",
      pubDate: "2024-10-22",
      title: "Ethical Considerations in AI System Design",
      description: "Exploring the critical ethical questions that every AI system designer must consider",
      featured: false,
      draft: false,
      tags: [
        "artificial-intelligence",
        "ethics",
        "technology",
        "software-development",
        "responsible-ai"
      ],
      image: {
        url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
        alt: "Woman in white long sleeve shirt using black laptop computer with code on screen"
      }
    },
    content: `
# Ethical Considerations in AI System Design

As artificial intelligence becomes increasingly integrated into critical systems and everyday applications, designers and developers face a growing responsibility to consider the ethical implications of their work. This isn't simply about avoiding harm—it's about proactively designing systems that align with human values and societal wellbeing.

## Core Ethical Considerations

### 1. Fairness and Bias

AI systems can perpetuate and amplify existing biases in society. Designers must carefully consider:

- How training data may contain historical biases
- Whether certain groups might be disadvantaged by the system
- Methods for detecting and mitigating unfair outcomes
- Processes for ongoing monitoring and improvement

### 2. Transparency and Explainability

As AI systems make increasingly important decisions, the ability to understand and explain those decisions becomes crucial:

- Can users understand why the system made a particular recommendation?
- Are the limits of the system clearly communicated?
- How are confidence levels and uncertainty represented?
- Do explanations match the needs and technical understanding of different stakeholders?

### 3. Privacy and Data Governance

AI systems typically rely on large amounts of data, raising important questions:

- Is data collected with meaningful informed consent?
- How is sensitive personal information protected?
- What controls do individuals have over their data?
- How long is data retained, and for what specific purposes?

### 4. Accountability and Oversight

When AI systems cause harm, clear lines of accountability are essential:

- Who is responsible when AI systems cause harm?
- What oversight mechanisms exist for high-risk applications?
- How are incidents documented, addressed, and learned from?
- What recourse do affected individuals have?

## Practical Implementation

Addressing these considerations requires more than abstract principles. Practical implementation might include:

1. **Diverse Design Teams**: Including people with varied backgrounds and perspectives
2. **Ethical Impact Assessments**: Structured evaluation of potential impacts before deployment
3. **Ongoing Monitoring**: Systems for detecting and addressing emerging issues
4. **User Empowerment**: Designing for user agency and control
5. **Thoughtful Defaults**: Ensuring default settings align with user interests

## Conclusion

Ethical considerations shouldn't be an afterthought or compliance checkbox—they should be central to the design process from the earliest stages. By thoughtfully addressing these concerns, we can build AI systems that not only avoid harm but actively contribute to human flourishing and social good.

As AI capabilities continue to advance, the importance of ethical design will only grow. The choices we make today will shape not just individual products but the broader trajectory of how AI impacts society for years to come.
`
  },
  {
    slug: 'designing-for-scale',
    frontmatter: {
      author: "Jonathan Haas",
      pubDate: "2024-10-05",
      title: "Designing for Scale: Architecture Patterns for Growing Applications",
      description: "Architectural approaches that allow your application to scale gracefully as user demands increase",
      featured: false,
      draft: false,
      tags: [
        "software-architecture",
        "scalability",
        "software-development",
        "technology",
        "system-design"
      ],
      image: {
        url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
        alt: "People sitting down near table with assorted laptop computers"
      }
    },
    content: `
# Designing for Scale: Architecture Patterns for Growing Applications

Building applications that can scale effectively is one of the most challenging aspects of software development. An architecture that works perfectly for thousands of users might collapse entirely when faced with millions. This article explores key architectural patterns and principles for designing systems that can grow seamlessly with your user base.

## Understanding Scalability Dimensions

Before diving into specific patterns, it's important to understand the different dimensions of scalability:

### 1. Load Scalability
The ability to handle increasing request volumes without degradation in performance.

### 2. Data Scalability
The capacity to store and process growing data volumes efficiently.

### 3. Geographic Scalability
Supporting users across different regions with acceptable latency.

### 4. Administrative Scalability
Maintaining and evolving the system without increasing operational overhead proportionally.

## Foundational Principles

Regardless of the specific architecture chosen, certain principles enable scalability:

### Loose Coupling
Systems with loosely coupled components can scale individual parts independently. This allows you to direct resources precisely where needed rather than scaling everything at once.

### Statelessness
Stateless components are inherently more scalable as they can be easily replicated across multiple instances without complex state synchronization.

### Asynchronous Processing
Decoupling time-consuming operations from the request-response cycle through asynchronous processing patterns improves user experience under load and provides natural scaling points.

### Caching Strategies
Strategic caching at multiple levels (database, application, CDN) reduces load on core systems and improves response times.

## Key Architectural Patterns

### Microservices Architecture
Breaking applications into independent services allows:
- Independent scaling of components based on their specific load patterns
- Targeted resource allocation to high-demand services
- Technology diversity optimized for each service's unique requirements

### Event-Driven Architecture
Event-driven systems offer unique scaling advantages:
- Natural decoupling of components
- Ability to buffer load spikes through event queues
- Simplified addition of new capabilities through new event consumers

### CQRS (Command Query Responsibility Segregation)
Separating read and write operations allows:
- Independent scaling of read and write workloads
- Optimization of data models for each workload type
- Greater flexibility in scaling strategies for different operation types

### Sharding Patterns
For data-intensive applications, horizontal partitioning strategies enable:
- Distribution of data across multiple database instances
- Parallel processing across partitions
- Reduced contention and lock competition

## Implementation Considerations

### Infrastructure as Code
Automating infrastructure provisioning is essential for scaling operations teams effectively. Well-designed IaC enables:
- Repeatable environment creation
- Self-service infrastructure for development teams
- Rapid capacity adjustments

### Observability
You can't scale what you can't measure. Comprehensive observability includes:
- Performance metrics across all system components
- Automated anomaly detection
- Clear visibility into capacity utilization

### Failure Management
Scaled systems must be designed for failure:
- Circuit breakers to prevent cascading failures
- Graceful degradation strategies
- Self-healing capabilities where possible

## Conclusion

Designing for scale requires thinking beyond immediate requirements to anticipate future growth patterns. The most successful scalable architectures combine thoughtful patterns with continuous measurement and evolution.

Rather than attempting to build for massive scale from day one, focus on creating clean architectural boundaries and measuring real-world usage patterns. This approach allows you to apply targeted scaling strategies precisely where and when they're needed, avoiding both premature optimization and painful rewrites as your application grows.
`
  },
  {
    slug: 'continuous-learning-in-tech',
    frontmatter: {
      author: "Jonathan Haas",
      pubDate: "2024-09-18",
      title: "Continuous Learning in Tech: Strategies for Staying Current",
      description: "Effective approaches for maintaining relevant skills in the rapidly evolving technology landscape",
      featured: false,
      draft: false,
      tags: [
        "professional-development",
        "learning",
        "technology",
        "career-development",
        "future-of-work"
      ],
      image: {
        url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
        alt: "Person using MacBook Pro"
      }
    },
    content: `
# Continuous Learning in Tech: Strategies for Staying Current

In the technology field, the only constant is change. What's cutting-edge today may be obsolete tomorrow. This rapid evolution creates both a challenge and an opportunity for technology professionals: those who can effectively learn and adapt will thrive, while those who don't risk seeing their skills become increasingly irrelevant.

## The Learning Imperative

The half-life of technical skills continues to shrink. According to various estimates, technical knowledge may lose about 50% of its value every 18-24 months. This doesn't mean everything becomes obsolete, but it does highlight the importance of continuous skill development.

## Strategic Approaches to Learning

### 1. Develop Learning Meta-Skills

Rather than focusing solely on specific technologies, develop skills that make future learning more efficient:

- **Learning how to learn**: Understanding how you best acquire and retain information
- **Mental models**: Developing frameworks that help you understand new concepts quickly
- **First principles thinking**: Looking beyond surface features to understand fundamental concepts

These meta-skills have extraordinary longevity and transfer across domains.

### 2. Balance Depth and Breadth

Effective technical learning requires both:

- **T-shaped knowledge**: Deep expertise in a core area supported by broader awareness across related domains
- **Connected understanding**: Seeing relationships between different technologies and concepts
- **Foundational prioritization**: Focusing more time on learning enduring principles rather than transient syntax details

### 3. Establish Sustainable Learning Habits

Consistency trumps intensity for long-term learning. Consider:

- **Daily learning blocks**: Even 25 minutes of focused learning each day compounds dramatically over time
- **Spaced repetition**: Reviewing concepts at strategic intervals to maximize retention
- **Project-based learning**: Applying new knowledge in practical contexts for better understanding and retention

### 4. Curate High-Quality Information Sources

The volume of available information makes curation essential:

- **Follow thought leaders**: Identify and follow experts who consistently provide valuable insights
- **Leverage aggregators**: Use technology newsletters and communities that filter signal from noise
- **Build a personal knowledge management system**: Tools like Obsidian, Notion, or Roam Research to organize what you learn

## Beyond Technical Skills

Technology professionals also need complementary skills that enhance their technical expertise:

- **Communication**: Clearly explaining complex technical concepts to diverse stakeholders
- **Systems thinking**: Understanding how technologies fit into broader contexts
- **Business domain knowledge**: Connecting technical capabilities to real-world problems and opportunities

## Creating a Personal Learning Roadmap

Effective continuous learning requires intentionality. Consider developing a personal learning roadmap that:

1. Aligns with your career aspirations
2. Accounts for industry trends and emerging technologies
3. Identifies specific learning goals with timelines
4. Includes a mix of structured courses, projects, and exploration
5. Schedules regular reviews and adjustments

## Conclusion

In technology, learning isn't just a phase at the beginning of your career—it's a career-long imperative. By developing effective learning strategies and habits, you can not only keep pace with change but leverage it as a competitive advantage.

The most successful technology professionals don't just react to change; they anticipate it. They see continuous learning not as a burden but as an opportunity for growth and advancement in an increasingly dynamic field.
`
  }
];

// Function to read file-based blog posts
const readFilePosts = (): BlogPost[] => {
  const posts: BlogPost[] = [];
  
  try {
    // Use import.meta.glob to get all markdown files
    const markdownFiles = import.meta.glob('/src/posts/*.md', { eager: true, as: 'raw' });
    
    // Log the found markdown files for debugging
    console.log('Found markdown files:', Object.keys(markdownFiles));

    Object.entries(markdownFiles).forEach(([filePath, content]) => {
      try {
        if (typeof content === 'string') {
          // Parse frontmatter and content
          const { data, content: markdownContent } = matter(content);
          
          // Extract the slug from filename
          const slug = filePath.split('/').pop()?.replace('.md', '') || '';
          
          console.log(`Processing post with slug: ${slug}`);
          
          // Create the BlogPost object
          const post: BlogPost = {
            slug,
            frontmatter: data as BlogPostFrontmatter,
            content: markdownContent
          };
          
          // Add to posts array
          posts.push(post);
          console.log(`Successfully added post: ${post.frontmatter.title}`);
        }
      } catch (err) {
        console.error(`Error processing markdown file ${filePath}:`, err);
      }
    });
    
    console.log(`Total file-based posts loaded: ${posts.length}`);
  } catch (err) {
    console.error("Error loading markdown files:", err);
  }
  
  return posts;
};

// Get the file-based posts
const filePosts = readFilePosts();
console.log("File posts loaded:", filePosts.length);

// Combine all blog posts (hardcoded examples and file-based posts)
const allBlogPosts: BlogPost[] = [
  sampleBlogPost, 
  ...additionalBlogPosts,
  ...filePosts
];

// Get all blog posts
export const getAllPosts = (): BlogPost[] => {
  return allBlogPosts;
};

// Get a specific post by slug
export const getPostBySlug = (slug: string): BlogPost | undefined => {
  return allBlogPosts.find(post => post.slug === slug);
};

// Get featured posts
export const getFeaturedPosts = (): BlogPost[] => {
  return allBlogPosts.filter(post => post.frontmatter.featured);
};

// Get all tags
export const getAllTags = (): string[] => {
  const tags = new Set<string>();
  allBlogPosts.forEach(post => {
    post.frontmatter.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags);
};

// Get posts by tag
export const getPostsByTag = (tag: string): BlogPost[] => {
  return allBlogPosts.filter(post => post.frontmatter.tags.includes(tag));
};

// Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
