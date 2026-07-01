'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ContestsError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Contests Error"
      message="Failed to load contests. Please try again."
      onRetry={reset}
    />
  );
}
