'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function NotificationsError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Notifications Error"
      message="Failed to load notifications. Please try again."
      onRetry={reset}
    />
  );
}
