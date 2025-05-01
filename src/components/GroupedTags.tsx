import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagGroup {
  name: string;
  tags: string[];
  icon?: React.ReactNode;
}

interface GroupedTagsProps {
  groups: TagGroup[];
  className?: string;
}

export default function GroupedTags({ groups, className = '' }: GroupedTagsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    groups.reduce((acc, group) => ({ ...acc, [group.name]: true }), {})
  );

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {groups.map((group) => (
        <div key={group.name} className="border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleGroup(group.name)}
            className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2">
              {group.icon}
              <span className="font-medium">{group.name}</span>
            </div>
            {expandedGroups[group.name] ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {expandedGroups[group.name] && (
            <div className="p-4 bg-background border-t">
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/tags/${tag}`}
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
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
  );
} 