'use client';

import { useEffect } from 'react';

function safeCaptureException(error: unknown) {
  try {
    import('@sentry/nextjs').then((Sentry) => {
      if (Sentry?.captureException) {
        Sentry.captureException(error);
      }
    }).catch(() => {});
  } catch {
    // Sentry not available
  }
}

export function GlobalErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[Unhandled Promise Rejection]', event.reason);
      safeCaptureException(event.reason || new Error('Unhandled Promise Rejection'));
    };

    const handleError = (event: ErrorEvent) => {
      console.error('[Global Error]', event.error || event.message);
      safeCaptureException(event.error || new Error(event.message));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
