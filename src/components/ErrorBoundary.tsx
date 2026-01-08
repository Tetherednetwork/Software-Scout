import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  // FIX: Use a class property to initialize state, which is a more modern and concise approach.
  // This resolves the errors about the 'state' property not existing on the component instance.
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-500">Something went wrong.</h1>
            <p className="mt-4">We're sorry for the inconvenience. Please try refreshing the page.</p>
            {this.state.error && (
              <details className="mt-4 text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <summary className="cursor-pointer font-semibold">Error Details</summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
