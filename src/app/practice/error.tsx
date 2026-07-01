'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PracticeError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Practice Error"
      message="Failed to load the practice area. Please try again."
      onRetry={reset}
    />
  );
}
