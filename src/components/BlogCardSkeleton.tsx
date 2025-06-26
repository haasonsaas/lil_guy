import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface BlogCardSkeletonProps {
  featured?: boolean
  hideAuthor?: boolean
}

export function BlogCardSkeleton({
  featured = false,
  hideAuthor = false,
}: BlogCardSkeletonProps) {
  if (featured) {
    // Featured card skeleton - matches the large overlay layout
    return (
      <div className="group relative mb-10 animate-fade-up">
        <div className="relative h-[400px] overflow-hidden rounded-lg shadow-md">
          <Skeleton className="absolute inset-0 w-full h-full" />

          {/* Overlay content skeleton */}
          <div className="absolute bottom-0 p-8 text-left">
            {/* Tags skeleton */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>

            {/* Title skeleton */}
            <div className="mb-3">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-3/4" />
            </div>

            {/* Description skeleton */}
            <div className="mb-6">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Meta info skeleton */}
            <div className="flex items-center gap-4">
              {!hideAuthor && <Skeleton className="h-4 w-24" />}
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Regular card skeleton - matches the standard layout
  return (
    <div className="group relative mb-6 animate-fade-up">
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border border-border bg-card',
          'group'
        )}
      >
        {/* Image skeleton */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <Skeleton className="absolute inset-0 w-full h-full" />

          {/* Tags overlay skeleton */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>

        {/* Content area skeleton */}
        <div className="p-6">
          {/* Meta info skeleton */}
          <div className="flex items-center gap-2 mb-3">
            {!hideAuthor && (
              <>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-1" />
              </>
            )}
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-1" />
            <Skeleton className="h-3 w-20" />
          </div>

          {/* Title skeleton */}
          <div className="mb-2">
            <Skeleton className="h-6 w-full mb-1" />
            <Skeleton className="h-6 w-2/3" />
          </div>

          {/* Description skeleton */}
          <div className="mb-4">
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Read article link skeleton */}
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  )
}
