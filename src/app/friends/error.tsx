'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function FriendsError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Friends Error"
      message="Failed to load your friends list. Please try again."
      onRetry={reset}
    />
  );
}
