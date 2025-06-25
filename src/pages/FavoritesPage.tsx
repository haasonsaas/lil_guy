import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useFavorites } from '@/hooks/useFavorites'
import { getAllPosts } from '@/utils/blogUtils'
import type { BlogPost } from '@/types/blog'
import BlogCard from '@/components/BlogCard'

export default function FavoritesPage() {
  const { favorites } = useFavorites()
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    const fetchPosts = async () => {
      const allPosts = await getAllPosts()
      const favoritePosts = allPosts.filter((post) =>
        favorites.includes(post.slug)
      )
      setPosts(favoritePosts)
    }
    fetchPosts()
  }, [favorites])

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Bookmarked Articles</h1>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p>You haven't bookmarked any articles yet.</p>
        )}
      </div>
    </Layout>
  )
}
