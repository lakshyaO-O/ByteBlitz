'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProblemsError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Problems Error"
      message="Failed to load problems. Please try again."
      onRetry={reset}
    />
  );
}
