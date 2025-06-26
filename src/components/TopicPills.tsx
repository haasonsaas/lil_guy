interface TopicPillsProps {
  topics: {
    name: string
    count: number
    href: string
  }[]
}

const TopicPills = ({ topics }: TopicPillsProps) => {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold">Browse by Topic</h2>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <a
            key={topic.name}
            href={topic.href}
            className="group relative inline-flex items-center rounded-full border bg-card px-4 py-2 text-sm font-medium text-foreground/60 transition-all hover:bg-accent hover:text-foreground"
          >
            <span>{topic.name}</span>
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {topic.count}
            </span>
            <span className="absolute inset-0 rounded-full bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ))}
      </div>
    </div>
  )
}

export default TopicPills
