'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback UI
interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
    >
      <div className="w-16 h-16 mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
      <p className="text-gray-400 max-w-md mb-6">
        An unexpected error occurred. Please try again or refresh the page.
      </p>

      {error && process.env.NODE_ENV === 'development' && (
        <details className="mb-6 text-left bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-lg w-full">
          <summary className="cursor-pointer text-red-400 font-medium">
            Error details
          </summary>
          <pre className="mt-2 text-xs text-red-300 overflow-auto">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}

      <div className="flex gap-3">
        {onReset && (
          <button
            onClick={onReset}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Try again
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white transition-colors"
        >
          Refresh page
        </button>
      </div>
    </motion.div>
  );
}

// Page-level error fallback
export function PageErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 mb-8 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-400 mb-8">
          We encountered an unexpected error. Our team has been notified.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 text-left bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm font-mono text-red-400">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg text-white transition-colors"
          >
            Go to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// API error component
interface ApiErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function ApiError({ message = 'Failed to load data', onRetry }: ApiErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="w-12 h-12 mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-yellow-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
        >
          Retry
        </button>
      )}
    </motion.div>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {icon || (
        <div className="w-16 h-16 mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      {description && <p className="text-gray-400 max-w-sm mb-6">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
