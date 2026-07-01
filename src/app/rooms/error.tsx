'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RoomsError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Rooms Error"
      message="Failed to load rooms. Please try again."
      onRetry={reset}
    />
  );
}
