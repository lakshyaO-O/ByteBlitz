'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Zap } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 z-[9999] bg-[#05070f] flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md px-6">
            <div className="relative">
              <div className="w-20 h-20 mx-auto relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping opacity-30" />
                <div className="absolute inset-2 rounded-full border-2 border-destructive/30" />
                <div className="absolute inset-4 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary fill-primary" />
                <span className="text-lg font-headline font-bold text-foreground">
                  DevRann
                </span>
              </div>
              <h2 className="text-xl font-headline font-bold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || 'An unexpected error occurred in this section.'}
              </p>
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <pre className="mt-3 p-3 rounded-lg bg-muted/30 border border-border text-xs text-left text-muted-foreground overflow-auto max-h-32">
                  {this.state.error.stack || this.state.error.message}
                </pre>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
