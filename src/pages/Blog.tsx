import { useEffect } from 'react';
import Layout from '@/components/Layout';
import BlogCard from '@/components/BlogCard';
import { getAllPosts } from '@/utils/blogUtils';
import { generateOgImageUrl } from '@/utils/ogImageUtils';

export default function Blog() {
  const posts = getAllPosts();

  useEffect(() => {
    // Update page title
    document.title = 'Blog - Haas on SaaS';
    
    // Update OpenGraph tags for the blog listing page
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    
    if (ogTitle) ogTitle.setAttribute('content', 'Blog - Haas on SaaS');
    if (ogDesc) ogDesc.setAttribute('content', 'Explore articles on AI, technology, and software development from Jonathan Haas');
    
    // Use generated image for blog listing
    const ogImageUrl = generateOgImageUrl('Blog - Haas on SaaS');
    
    if (ogImage) ogImage.setAttribute('content', ogImageUrl);
    if (twitterImage) twitterImage.setAttribute('content', ogImageUrl);
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