import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useDebounce } from './useDebounce';
import { useToast } from './use-toast';

interface InteractiveDemoConfig<TConfig, TResults> {
  demoId: string;
  defaultConfig: TConfig;
  calculateFn: (config: TConfig) => TResults;
  validateConfig?: (config: TConfig) => { isValid: boolean; errors?: string[] };
  debounceMs?: number;
  enablePersistence?: boolean;
  enableAnalytics?: boolean;
}

interface InteractiveDemoState<TConfig, TResults> {
  config: TConfig;
  results: TResults;
  isCalculating: boolean;
  errors: string[];
  
  // Actions
  updateConfig: (updates: Partial<TConfig> | ((prev: TConfig) => TConfig)) => void;
  reset: () => void;
  
  // Sharing & Export
  exportData: () => void;
  shareUrl: () => string;
  copyResults: () => void;
  
  // History
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

/**
 * Powerful hook for creating standardized interactive demo components
 * Handles state, calculations, persistence, sharing, and analytics
 */
export function useInteractiveDemo<TConfig extends object, TResults>({
  demoId,
  defaultConfig,
  calculateFn,
  validateConfig,
  debounceMs = 300,
  enablePersistence = true,
  enableAnalytics = true,
}: InteractiveDemoConfig<TConfig, TResults>): InteractiveDemoState<TConfig, TResults> {
  const { toast } = useToast();
  
  // Always call the hook but conditionally use its result
  const [persistedConfig, setPersistedConfig] = useLocalStorage(`demo-${demoId}`, defaultConfig);
  
  // Use persisted or default config based on enablePersistence
  const storedConfig = enablePersistence ? persistedConfig : defaultConfig;
  
  // Memoize setStoredConfig to prevent dependencies from changing on every render
  const setStoredConfig = useMemo(() => {
    return enablePersistence ? setPersistedConfig : () => {};
  }, [enablePersistence, setPersistedConfig]);
  
  const [config, setConfig] = useState<TConfig>(storedConfig as TConfig);
  const [history, setHistory] = useState<TConfig[]>([config]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Debounce configuration changes
  const debouncedConfig = useDebounce(config, debounceMs);
  
  // Calculate results
  const results = useMemo(() => {
    setIsCalculating(true);
    
    try {
      // Validate if validator provided
      if (validateConfig) {
        const validation = validateConfig(debouncedConfig);
        if (!validation.isValid) {
          setErrors(validation.errors || ['Invalid configuration']);
          setIsCalculating(false);
          return {} as TResults;
        }
      }
      
      setErrors([]);
      const calculatedResults = calculateFn(debouncedConfig);
      setIsCalculating(false);
      
      // Track calculation if analytics enabled
      if (enableAnalytics && typeof window !== 'undefined' && 'gtag' in window) {
        (window as Record<string, unknown>).gtag('event', 'interactive_demo_calculation', {
          demo_id: demoId,
          config_hash: JSON.stringify(debouncedConfig).length, // Privacy-safe metric
        });
      }
      
      return calculatedResults;
    } catch (error) {
      console.error('Calculation error:', error);
      setErrors(['Calculation error occurred']);
      setIsCalculating(false);
      return {} as TResults;
    }
  }, [debouncedConfig, calculateFn, validateConfig, demoId, enableAnalytics]);
  
  // Update configuration with history tracking
  const updateConfig = useCallback((updates: Partial<TConfig> | ((prev: TConfig) => TConfig)) => {
    setConfig(prevConfig => {
      const newConfig = typeof updates === 'function' 
        ? updates(prevConfig)
        : { ...prevConfig, ...updates };
      
      // Update history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newConfig);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      // Persist if enabled
      if (enablePersistence) {
        setStoredConfig(newConfig);
      }
      
      return newConfig;
    });
  }, [history, historyIndex, enablePersistence, setStoredConfig]);
  
  // Reset to defaults
  const reset = useCallback(() => {
    setConfig(defaultConfig);
    setHistory([defaultConfig]);
    setHistoryIndex(0);
    if (enablePersistence) {
      setStoredConfig(defaultConfig);
    }
    toast({
      title: "Reset to defaults",
      description: "Configuration has been reset",
    });
  }, [defaultConfig, enablePersistence, setStoredConfig, toast]);
  
  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousConfig = history[newIndex];
      setConfig(previousConfig);
      setHistoryIndex(newIndex);
      if (enablePersistence) {
        setStoredConfig(previousConfig);
      }
    }
  }, [history, historyIndex, enablePersistence, setStoredConfig]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextConfig = history[newIndex];
      setConfig(nextConfig);
      setHistoryIndex(newIndex);
      if (enablePersistence) {
        setStoredConfig(nextConfig);
      }
    }
  }, [history, historyIndex, enablePersistence, setStoredConfig]);
  
  // Export functionality
  const exportData = useCallback(() => {
    const exportObj = {
      demoId,
      timestamp: new Date().toISOString(),
      config,
      results,
    };
    
    const dataStr = JSON.stringify(exportObj, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${demoId}-${Date.now()}.json`);
    linkElement.click();
    
    toast({
      title: "Data exported",
      description: "Results have been downloaded",
    });
  }, [demoId, config, results, toast]);
  
  // Generate shareable URL
  const shareUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('demo', demoId);
    params.set('config', btoa(JSON.stringify(config)));
    
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    return url;
  }, [demoId, config]);
  
  // Copy results to clipboard
  const copyResults = useCallback(() => {
    const text = `${demoId} Results:\n${JSON.stringify(results, null, 2)}`;
    
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Results have been copied",
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    });
  }, [demoId, results, toast]);
  
  // Load from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const demoParam = params.get('demo');
      const configParam = params.get('config');
      
      if (demoParam === demoId && configParam) {
        try {
          const loadedConfig = JSON.parse(atob(configParam));
          setConfig(loadedConfig);
          if (enablePersistence) {
            setStoredConfig(loadedConfig);
          }
          toast({
            title: "Configuration loaded",
            description: "Loaded shared configuration from URL",
          });
        } catch (error) {
          console.error('Failed to load config from URL:', error);
        }
      }
    }
  }, [demoId, enablePersistence, setStoredConfig, toast]);
  
  return {
    config,
    results,
    isCalculating,
    errors,
    updateConfig,
    reset,
    exportData,
    shareUrl,
    copyResults,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo,
  };
}