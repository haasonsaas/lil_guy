
export interface BlogPostFrontmatter {
  author: string;
  pubDate: string;
  title: string;
  description: string;
  featured: boolean;
  draft: boolean;
  tags: string[];
  image: {
    url: string;
    alt: string;
  };
  series?: {
    name: string;
    part: number;
    description?: string;
  };
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  content: string;
}

export interface Series {
  name: string;
  description?: string;
  posts: BlogPost[];
  totalParts: number;
}
