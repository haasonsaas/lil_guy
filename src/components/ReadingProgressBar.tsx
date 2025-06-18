import { useEffect, useState } from 'react';

export const ReadingProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      try {
        const mainContent = document.querySelector('main');
        const relatedTopics = Array.from(document.querySelectorAll('h2')).find(
          h2 => h2.textContent?.includes('Related Topics')
        );
        
        if (!mainContent) return;
        
        if (!relatedTopics) {
          // Fallback to document height if Related Topics not found
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight - windowHeight;
          const scrollTop = window.scrollY;
          const progress = (scrollTop / documentHeight) * 100;
          setProgress(Math.min(progress, 100));
          return;
        }

        const mainContentTop = mainContent.getBoundingClientRect().top;
        const relatedTopicsTop = relatedTopics.getBoundingClientRect().top;
        
        // Calculate progress based on the distance to Related Topics
        const totalDistance = relatedTopicsTop - mainContentTop;
        const scrolledDistance = Math.max(0, -mainContentTop);
        const progress = Math.min((scrolledDistance / totalDistance) * 100, 100);
        
        setProgress(progress);
      } catch (error) {
        // Silently handle errors
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      window.addEventListener('scroll', updateProgress);
      window.addEventListener('resize', updateProgress);
      updateProgress();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-muted z-[100] no-print">
      <div
        className="h-full bg-primary transition-all duration-200"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}; 