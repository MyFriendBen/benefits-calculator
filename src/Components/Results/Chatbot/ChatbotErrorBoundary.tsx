import { Component, ErrorInfo, ReactNode } from 'react';

type ChatbotErrorBoundaryProps = {
  /** Rendered in place of `children` once they have thrown. */
  fallback: ReactNode;
  onError?: (error: Error) => void;
  children: ReactNode;
};

type ChatbotErrorBoundaryState = { hasError: boolean };

/**
 * Keeps a render error inside Benji instead of letting it take down the results page
 * (MFB-2222).
 *
 * There is no ErrorBoundary anywhere else in the app, so without this a throw while
 * rendering the widget unmounts everything and the household is left with a blank page.
 * It is deliberately Benji-local rather than wrapped around the app root.
 *
 * Only catches errors thrown while rendering its descendants — not in event handlers or
 * async code, and not in the component that renders it. That last one is why message
 * text goes through <FormattedChatText> rather than a plain call in ChatbotProvider.
 *
 * A class because React has no hook equivalent of getDerivedStateFromError.
 */
export class ChatbotErrorBoundary extends Component<ChatbotErrorBoundaryProps, ChatbotErrorBoundaryState> {
  state: ChatbotErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ChatbotErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Benji render error', error, info.componentStack);
    this.props.onError?.(error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
