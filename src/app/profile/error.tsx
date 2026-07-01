'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProfileError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Profile Error"
      message="Failed to load your profile. Please try again."
      onRetry={reset}
    />
  );
}
