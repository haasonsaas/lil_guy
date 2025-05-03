import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import BlogCard from '@/components/BlogCard';
import { getAllPosts, getPostBySlug } from '@/utils/blogUtils';
import { generateOgImageUrl } from '../utils/ogImageUtils';

export default function Blog() {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState([]);
  const [currentPost, setCurrentPost] = useState(null);

  useEffect(() => {
    const loadPosts = async () => {
      const loadedPosts = await getAllPosts();
      setPosts(loadedPosts);
    };
    loadPosts();
  }, []);

  useEffect(() => {
    const loadCurrentPost = async () => {
      if (slug) {
        const post = await getPostBySlug(slug);
        setCurrentPost(post);
      }
    };
    loadCurrentPost();
  }, [slug]);

  useEffect(() => {
    const updateMeta = async () => {
      const title = currentPost 
        ? `${currentPost.frontmatter.title} | Haas on SaaS`
        : 'Blog | Haas on SaaS';
      
      // Set page title
      document.title = title;
      
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
      if (ogTitle) ogTitle.setAttribute('content', title);
      if (ogDesc) ogDesc.setAttribute('content', currentPost?.frontmatter.description || 'Explore articles on AI, technology, and software development by Jonathan Haas');
      if (ogUrl) ogUrl.setAttribute('content', `https://haasonsaas.com/blog${slug ? `/${slug}` : ''}`);
      if (ogType) ogType.setAttribute('content', currentPost ? 'article' : 'website');
      
      // Use the generated OpenGraph image
      const ogImageUrl = await generateOgImageUrl(title);
      console.log('Setting OpenGraph image URL:', ogImageUrl);
      
      if (ogImage) ogImage.setAttribute('content', ogImageUrl);
      if (twitterImage) twitterImage.setAttribute('content', ogImageUrl);
      
      // Set Twitter metadata
      if (twitterTitle) twitterTitle.setAttribute('content', title);
      if (twitterDesc) twitterDesc.setAttribute('content', currentPost?.frontmatter.description || 'Explore articles on AI, technology, and software development by Jonathan Haas');
      if (twitterUrl) twitterUrl.setAttribute('content', `https://haasonsaas.com/blog${slug ? `/${slug}` : ''}`);
      
      // Set author information
      if (ogAuthor) ogAuthor.setAttribute('content', currentPost?.frontmatter.author || 'Jonathan Haas');
      if (twitterCreator) twitterCreator.setAttribute('content', '@haasonsaas');
    };

    updateMeta();
  }, [currentPost, slug]);

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