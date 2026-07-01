'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SettingsError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Settings Error"
      message="Failed to load settings. Please try again."
      onRetry={reset}
    />
  );
}
