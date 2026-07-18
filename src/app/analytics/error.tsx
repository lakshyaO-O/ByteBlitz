'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AnalyticsError({ error, reset }: ErrorProps) {
  console.error('[AnalyticsError]', error?.message, error?.stack);

  const friendlyMessage = error?.message?.includes('Timestamp')
    ? 'Data format error: analytics data contains an unexpected timestamp format. Please refresh.'
    : error?.message?.includes('permission') || error?.message?.includes('denied')
    ? 'Permission denied: your session may have expired. Try logging in again.'
    : error?.message?.includes('index') || error?.message?.includes('requires an index')
    ? 'Database index missing: the analytics query needs a composite index. Contact support.'
    : `Failed to load analytics. (${error?.message || 'Unknown error'})`;

  return (
    <ErrorPage
      error={error}
      title="Analytics Error"
      message={friendlyMessage}
      onRetry={reset}
    />
  );
}
