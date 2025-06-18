import { useState, useEffect } from 'react';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function useTableOfContents(contentRef: React.RefObject<HTMLElement>) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (!contentRef.current) return;

    // Find all headings and create TOC items
    const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const items: TocItem[] = [];

    headings.forEach((heading, index) => {
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.substring(1));
      
      // Create a unique ID from the heading text
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/--+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        || `heading-${index}`;

      // Set the ID on the heading element for scrolling
      heading.id = id;

      items.push({ id, text, level });
    });

    setTocItems(items);

    // Set up intersection observer for active heading detection
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleHeadings = entries
          .filter(entry => entry.isIntersecting)
          .map(entry => entry.target.id);

        if (visibleHeadings.length > 0) {
          setActiveId(visibleHeadings[0]);
        }
      },
      {
        rootMargin: '0px 0px -80% 0px', // Trigger when heading is in top 20% of viewport
        threshold: 0
      }
    );

    headings.forEach(heading => observer.observe(heading));

    return () => {
      observer.disconnect();
    };
  }, [contentRef]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return { tocItems, activeId, scrollToHeading };
}