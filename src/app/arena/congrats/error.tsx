'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CongratsError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Results Error"
      message="Failed to load results. Please try again."
      onRetry={reset}
    />
  );
}
