'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SearchError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Search Error"
      message="Failed to load search. Please try again."
      onRetry={reset}
    />
  );
}
