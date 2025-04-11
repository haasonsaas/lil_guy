import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { ReadingProgressBar } from './ReadingProgressBar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ReadingProgressBar />
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
