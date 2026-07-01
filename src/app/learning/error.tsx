'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LearningError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Learning Hub Error"
      message="Failed to load the learning hub. Please try again."
      onRetry={reset}
    />
  );
}
