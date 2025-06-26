import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Update state with error info
    this.setState({ errorInfo })

    // Track in analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      ;(window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.(
        'event',
        'exception',
        {
          description: error.toString(),
          fatal: false,
        }
      )
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    Something went wrong
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    An unexpected error occurred. Please try refreshing the
                    page.
                  </p>
                </div>

                {/* Show error details in development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="w-full text-left">
                    <summary className="text-xs text-muted-foreground cursor-pointer">
                      Error details
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                      {this.state.error.toString()}
                      {this.state.errorInfo &&
                        this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={this.handleReset}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try again
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = '/')}
                    className="gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Go home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Convenience wrapper for function components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
