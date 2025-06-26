import { additionalBlogPosts, sampleBlogPost } from './types'
import { BlogPost } from '@/types/blog'

// Combine all sample blog posts
const samplePosts: BlogPost[] = [sampleBlogPost, ...additionalBlogPosts]

export default samplePosts
