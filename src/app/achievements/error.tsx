'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AchievementsError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Achievements Error"
      message="Failed to load achievements. Please try again."
      onRetry={reset}
    />
  );
}
