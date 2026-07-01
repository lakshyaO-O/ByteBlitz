'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Admin Error"
      message="Failed to load admin panel. Please try again."
      onRetry={reset}
    />
  );
}
