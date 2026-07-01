'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ChallengesError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Challenges Error"
      message="Failed to load challenges. Please try again."
      onRetry={reset}
    />
  );
}
