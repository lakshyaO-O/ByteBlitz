'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProgressError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Progress Error"
      message="Failed to load progress. Please try again."
      onRetry={reset}
    />
  );
}
