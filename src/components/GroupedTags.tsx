import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagGroup {
  name: string
  tags: string[]
  icon?: React.ReactNode
}

interface GroupedTagsProps {
  groups: TagGroup[]
  className?: string
}

export default function GroupedTags({
  groups,
  className = '',
}: GroupedTagsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    groups.reduce((acc, group) => ({ ...acc, [group.name]: true }), {})
  )

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }))
  }

  return (
    <div className={cn('space-y-6', className)}>
      {groups.map((group) => (
        <div
          key={group.name}
          className="border border-border/50 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm"
        >
          <button
            onClick={() => toggleGroup(group.name)}
            className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {group.icon}
              <span className="font-display font-semibold text-lg">
                {group.name}
              </span>
            </div>
            {expandedGroups[group.name] ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {expandedGroups[group.name] && (
            <div className="p-4 border-t border-border/50">
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/tags/${tag}`}
                    className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
