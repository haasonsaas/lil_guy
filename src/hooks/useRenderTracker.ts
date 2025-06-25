import { useEffect } from 'react';

const isDevelopment = process.env.NODE_ENV === 'development';

interface RenderInfo {
  count: number;
  lastRender: number;
  avgTime: number;
}

const renderMap = new Map<string, RenderInfo>();

export function useRenderTracker(componentName: string) {
  useEffect(() => {
    if (!isDevelopment) return;
    
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      const info = renderMap.get(componentName) || { count: 0, lastRender: 0, avgTime: 0 };
      
      info.count++;
      info.avgTime = (info.avgTime * (info.count - 1) + duration) / info.count;
      info.lastRender = Date.now();
      
      renderMap.set(componentName, info);
    };
  });
}

export { renderMap };