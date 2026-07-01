'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AnalyticsError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Analytics Error"
      message="Failed to load analytics. Please try again."
      onRetry={reset}
    />
  );
}
