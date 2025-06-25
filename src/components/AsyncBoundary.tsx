import React, { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { useAsyncState } from '../hooks/useAsyncState';

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