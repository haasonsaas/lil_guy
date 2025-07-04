import React, { Component, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, RefreshCw, FileWarning, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  experimentName: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ExperimentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Experiment error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state
      const { experimentName } = this.props

      return (
        <div className="min-h-[600px] flex items-center justify-center p-8">
          <Card className="max-w-2xl w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileWarning className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {experimentName} Failed to Load
              </h2>
              <p className="text-muted-foreground">
                This experiment encountered an error and couldn't be displayed.
              </p>
            </div>

            <Alert className="mb-6 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="mt-2">
                <code className="text-sm bg-muted p-2 rounded block overflow-x-auto">
                  {error?.message || 'Unknown error occurred'}
                </code>
                {process.env.NODE_ENV === 'development' && errorInfo && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Component Stack (Development Only)
                    </summary>
                    <pre className="text-xs mt-2 bg-muted p-2 rounded overflow-x-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-semibold mb-2">Possible Solutions:</h3>
              
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="flex gap-2">
                  <span>•</span>
                  <span>Check if your browser supports WebGL/Canvas features</span>
                </div>
                <div className="flex gap-2">
                  <span>•</span>
                  <span>Try updating your browser to the latest version</span>
                </div>
                <div className="flex gap-2">
                  <span>•</span>
                  <span>Disable browser extensions that might interfere</span>
                </div>
                <div className="flex gap-2">
                  <span>•</span>
                  <span>Check if hardware acceleration is enabled in your browser</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={this.handleReset} variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" asChild>
                <Link to="/diagnostics">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Run Diagnostics
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/experiments">
                  Back to Experiments
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}