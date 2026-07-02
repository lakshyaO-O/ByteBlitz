'use client';

import { useEffect, useState, useRef } from 'react';
import { Zap, RefreshCw, RotateCcw } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  timeout?: number;
  fullScreen?: boolean;
}

export function LoadingScreen({
  message = 'Loading...',
  timeout = 10000,
  fullScreen = true,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    setProgress(0);
    setTimedOut(false);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(95, (elapsed / timeout) * 100);
      setProgress(pct);
      if (elapsed >= timeout) {
        setTimedOut(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timeout]);

  const handleRetry = () => {
    startRef.current = Date.now();
    setProgress(0);
    setTimedOut(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const container = fullScreen
    ? 'fixed inset-0 z-[9999] bg-[#05070f] flex items-center justify-center'
    : 'min-h-[60vh] bg-[#05070f] flex items-center justify-center';

  return (
    <div className={container}>
      <div className="text-center space-y-8 max-w-md px-6">
        <div className="relative">
          <div className="w-24 h-24 mx-auto relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-30" />
            <div className="absolute inset-2 rounded-full border-2 border-primary/30 animate-spin" />
            <div className="absolute inset-3 rounded-full bg-primary/10 flex items-center justify-center p-2">
              <img src="/logo.svg" alt="DevRann logo" className="h-14 w-14 object-contain" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-headline font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
              DevRann
            </span>
          </h1>
          <p className="text-muted-foreground text-sm font-mono animate-pulse">
            {message}
          </p>
        </div>

        {!timedOut ? (
          <div className="space-y-2 max-w-xs mx-auto">
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              {Math.round(progress)}%
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive font-medium">
                Something took longer than expected.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                The connection may be slow or an error occurred.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
