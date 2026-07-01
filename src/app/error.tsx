'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Application Error"
      message="The application encountered an unexpected error. Please try again."
      onRetry={reset}
      fullScreen
    />
  );
}
