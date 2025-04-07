
import Layout from '@/components/Layout';
import PostsList from '@/components/PostsList';

export default function AdminPage() {
  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">Admin</h1>
            <p className="text-muted-foreground mb-8">
              View and manage your blog posts
            </p>
          </div>
          
          <PostsList />
        </div>
      </section>
    </Layout>
  );
}
