import React, { ErrorInfo, ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

interface LifetimeProjectionErrorBoundaryProps {
  children: ReactNode;
}

interface LifetimeProjectionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LifetimeProjectionErrorBoundary extends React.Component<
  LifetimeProjectionErrorBoundaryProps,
  LifetimeProjectionErrorBoundaryState
> {
  constructor(props: LifetimeProjectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LifetimeProjectionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lifetime projection error:', error, errorInfo);

    // Log to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `Lifetime projection error: ${error.message}`,
        fatal: false,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="lifetime-projection-error-container">
          <div className="lifetime-projection-error">
            <div className="error-icon">⚠️</div>
            <h3>
              <FormattedMessage
                id="lifetime-projection.error.title"
                defaultMessage="Long-term projections temporarily unavailable"
              />
            </h3>
            <p>
              <FormattedMessage
                id="lifetime-projection.error.message"
                defaultMessage="Your annual benefit estimates are still accurate and available above. Long-term projections will be restored shortly."
              />
            </p>
            <button
              className="retry-button"
              onClick={() => this.setState({ hasError: false })}
            >
              <FormattedMessage
                id="lifetime-projection.error.retry"
                defaultMessage="Try again"
              />
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LifetimeProjectionErrorBoundary;