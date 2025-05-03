import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'Haas on SaaS';

    if (path.startsWith('/blog/')) {
      // Blog post title is handled by the BlogPost component
      return;
    } else if (path === '/blog') {
      title = 'Blog - Haas on SaaS';
    } else if (path === '/tags') {
      title = 'Topics - Haas on SaaS';
    } else if (path === '/about') {
      title = 'About - Haas on SaaS';
    } else if (path === '/uses') {
      title = 'Uses - Haas on SaaS';
    } else if (path === '/reading') {
      title = 'Reading List - Haas on SaaS';
    } else if (path === '/') {
      title = 'Where Technical Vision Meets Market Reality | Haas on SaaS';
    }

    document.title = title;
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
