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
  const isBlogPage = location.pathname.startsWith('/blog');

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {isBlogPage && <ReadingProgressBar />}
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
