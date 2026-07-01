'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ArenaError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Arena Error"
      message="Failed to load the arena. Please try again."
      onRetry={reset}
    />
  );
}
