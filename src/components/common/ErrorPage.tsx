'use client';

import { AlertTriangle, RefreshCw, Home, Zap } from 'lucide-react';

interface ErrorPageProps {
  error?: Error | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorPage({
  error,
  title = 'Something went wrong',
  message,
  onRetry,
  fullScreen = true,
}: ErrorPageProps) {
  const handleRefresh = () => window.location.reload();
  const handleHome = () => window.location.href = '/';

  const container = fullScreen
    ? 'fixed inset-0 z-[9999] bg-[#05070f] flex items-center justify-center'
    : 'min-h-[60vh] bg-[#05070f] flex items-center justify-center';

  return (
    <div className={container}>
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
          <div className="flex items-center justify-center mb-2">
            <img src="/logo.svg" alt="DevRann" className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {message || error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          {error && process.env.NODE_ENV === 'development' && (
            <pre className="mt-3 p-3 rounded-lg bg-muted/30 border border-border text-xs text-left text-muted-foreground overflow-auto max-h-32">
              {error.stack || error.message}
            </pre>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page
          </button>
          <button
            onClick={handleHome}
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
