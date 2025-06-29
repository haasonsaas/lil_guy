import Layout from '@/components/Layout'
import GroupedTags from '@/components/GroupedTags'

import { Hammer, Scale, Settings, HelpCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Tag {
  tag: string
  count: number
  slug: string
  url: string
  searchUrl: string
}

interface TagCategory {
  name: string
  icon: JSX.Element
  tags: Tag[]
}

export default function TagsPage() {
  const [tagGroups, setTagGroups] = useState<TagCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        const dynamicTagGroups: TagCategory[] = [
          {
            name: 'Build',
            icon: <Hammer className="w-4 h-4" />,
            tags: data.meta.categories.technical || [],
          },
          {
            name: 'Scale',
            icon: <Scale className="w-4 h-4" />,
            tags: data.meta.categories.business || [],
          },
          {
            name: 'Operate',
            icon: <Settings className="w-4 h-4" />,
            tags: data.meta.categories.personal || [],
          },
          {
            name: 'Misc',
            icon: <HelpCircle className="w-4 h-4" />,
            tags: data.tags.filter(
              (tag: Tag) =>
                !data.meta.categories.technical.some(
                  (t: Tag) => t.tag === tag.tag
                ) &&
                !data.meta.categories.business.some(
                  (t: Tag) => t.tag === tag.tag
                ) &&
                !data.meta.categories.personal.some(
                  (t: Tag) => t.tag === tag.tag
                )
            ),
          },
        ]
        setTagGroups(dynamicTagGroups)
      } catch (e: unknown) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  if (loading) {
    return (
      <Layout>
        <section className="py-12 text-center">
          <p>Loading topics...</p>
        </section>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <section className="py-12 text-center">
          <p className="text-red-500">Error: {error}</p>
        </section>
      </Layout>
    )
  }

  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4 font-serif">Topics</h1>
            <p className="text-muted-foreground">
              Browse all topics covered in the blog
            </p>
          </div>

          <div className="bg-gradient-to-br from-card to-background border border-border rounded-xl p-8 shadow-md animate-fade-up">
            <GroupedTags groups={tagGroups} className="max-w-2xl mx-auto" />
          </div>
        </div>
      </section>
    </Layout>
  )
}
