import { useEffect } from 'react';
import Layout from '@/components/Layout';
import BlogCard from '@/components/BlogCard';
import { getAllPosts } from '@/utils/blogUtils';
import { generateOgImageUrl } from '../utils/ogImageUtils';

export default function Blog() {
  const posts = getAllPosts();

  useEffect(() => {
    // Set page title
    document.title = 'Blog - Haas on SaaS';
    
    // Update OpenGraph tags for social sharing
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const ogType = document.querySelector('meta[property="og:type"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    const twitterUrl = document.querySelector('meta[property="twitter:url"]');
    const ogAuthor = document.querySelector('meta[property="article:author"]');
    const twitterCreator = document.querySelector('meta[name="twitter:creator"]');
    
    // Set OpenGraph metadata
    if (ogTitle) ogTitle.setAttribute('content', 'Blog - Haas on SaaS');
    if (ogDesc) ogDesc.setAttribute('content', 'Explore articles on AI, technology, and software development by Jonathan Haas');
    if (ogUrl) ogUrl.setAttribute('content', 'https://haasonsaas.com/blog');
    if (ogType) ogType.setAttribute('content', 'website');
    
    // Use the generated OpenGraph image
    const ogImageUrl = generateOgImageUrl('Blog - Haas on SaaS');
    console.log('Setting OpenGraph image URL:', ogImageUrl);
    
    if (ogImage) ogImage.setAttribute('content', ogImageUrl);
    if (twitterImage) twitterImage.setAttribute('content', ogImageUrl);
    
    // Set Twitter metadata
    if (twitterTitle) twitterTitle.setAttribute('content', 'Blog - Haas on SaaS');
    if (twitterDesc) twitterDesc.setAttribute('content', 'Explore articles on AI, technology, and software development by Jonathan Haas');
    if (twitterUrl) twitterUrl.setAttribute('content', 'https://haasonsaas.com/blog');
    
    // Set author information
    if (ogAuthor) ogAuthor.setAttribute('content', 'Jonathan Haas');
    if (twitterCreator) twitterCreator.setAttribute('content', '@haasonsaas');
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </Layout>
  );
} 