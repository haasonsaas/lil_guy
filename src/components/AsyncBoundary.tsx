import React, { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface AsyncBoundaryProps {
  children: ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
  onRetry?: () => void;
}

export function AsyncBoundary({
  children,
  isLoading = false,
  error = null,
  loadingFallback,
  errorFallback,
  onRetry,
}: AsyncBoundaryProps) {
  // Show loading state
  if (isLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (error) {
    if (errorFallback) {
      return <>{errorFallback}</>;
    }
    
    return (
      <div className="text-center p-8">
        <p className="text-destructive mb-4">Error: {error.message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  // Wrap children in error boundary
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

// Hook for managing async state
export function useAsyncState<T>() {
  const [state, setState] = React.useState<{
    data: T | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = React.useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ data: null, isLoading: true, error: null });
    
    try {
      const data = await asyncFunction();
      setState({ data, isLoading: false, error: null });
      return data;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setState({ data: null, isLoading: false, error: errorObj });
      throw errorObj;
    }
  }, []);

  const reset = React.useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}