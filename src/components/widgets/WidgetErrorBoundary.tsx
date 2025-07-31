import { Component, type ReactNode } from "react"
import { WidgetError } from "./WidgetError"

interface Props {
  children: ReactNode
  widgetId: string
  onError?: (error: Error, widgetId: string) => void
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary for individual widgets
 * Prevents widget errors from crashing the entire dashboard
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error(`Widget Error (${this.props.widgetId}):`, error, errorInfo)
    }

    // Call optional error handler
    this.props.onError?.(error, this.props.widgetId)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Default error UI
      return (
        <div className="widget-error-boundary">
          <WidgetError
            error={this.state.error || new Error("Unknown error")}
            onRetry={this.handleReset}
          />
        </div>
      )
    }

    return this.props.children
  }
}
