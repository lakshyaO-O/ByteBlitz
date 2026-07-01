'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Dashboard Error"
      message="Failed to load your dashboard. Please try again."
      onRetry={reset}
    />
  );
}
