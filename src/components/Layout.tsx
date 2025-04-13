import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { ReadingProgressBar } from './ReadingProgressBar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  // Only show reading progress on individual blog posts, not on the main blog page
  const isBlogPost = location.pathname.startsWith('/blog/') && location.pathname !== '/blog/';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {isBlogPost && <ReadingProgressBar />}
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
