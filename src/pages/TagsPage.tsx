
import Layout from '@/components/Layout';
import TagCloud from '@/components/TagCloud';
import { getAllTags } from '@/utils/blogUtils';

export default function TagsPage() {
  const tags = getAllTags();
  
  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">Tags</h1>
            <p className="text-muted-foreground">
              Browse all topics covered in the blog
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-8 animate-fade-up">
            <TagCloud tags={tags} className="justify-center gap-3" />
          </div>
        </div>
      </section>
    </Layout>
  );
}
