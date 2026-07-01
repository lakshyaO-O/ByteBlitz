'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MonetizationError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Premium Error"
      message="Failed to load premium features. Please try again."
      onRetry={reset}
    />
  );
}
