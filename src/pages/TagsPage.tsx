import Layout from '@/components/Layout';
import GroupedTags from '@/components/GroupedTags';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Hammer, Scale, Settings, HelpCircle } from 'lucide-react';

const tagGroups = [
  {
    name: "Build",
    icon: <Hammer className="w-4 h-4" />,
    tags: ["product", "ux", "ai", "engineering", "design"]
  },
  {
    name: "Scale",
    icon: <Scale className="w-4 h-4" />,
    tags: ["leadership", "productivity", "growth", "marketing", "sales"]
  },
  {
    name: "Operate",
    icon: <Settings className="w-4 h-4" />,
    tags: ["personal-growth", "strategy", "management", "culture", "career"]
  },
  {
    name: "Misc",
    icon: <HelpCircle className="w-4 h-4" />,
    tags: ["data", "security", "startup", "founder", "technical", "framework", "transparency", "trust"]
  }
];

export default function TagsPage() {
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
  );
}
