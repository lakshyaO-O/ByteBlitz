'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ReplayError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Replay Error"
      message="Failed to load replay. Please try again."
      onRetry={reset}
    />
  );
}
