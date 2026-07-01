'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LeaderboardError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Leaderboard Error"
      message="Failed to load the leaderboard. Please try again."
      onRetry={reset}
    />
  );
}
