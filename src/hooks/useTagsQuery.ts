import { useQuery } from '@tanstack/react-query'

export interface Tag {
  tag: string
  count: number
  slug: string
  url: string
  searchUrl: string
}

interface TagsResponse {
  tags: Tag[]
  meta: unknown
}

export function useTagsQuery() {
  return useQuery<TagsResponse, Error>({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await fetch('/api/tags')
      if (!res.ok) {
        throw new Error('Failed to fetch tags')
      }
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })
}
