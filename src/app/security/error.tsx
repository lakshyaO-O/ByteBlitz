'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SecurityError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Security Error"
      message="Failed to load security settings. Please try again."
      onRetry={reset}
    />
  );
}
