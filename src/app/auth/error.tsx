'use client';

import { ErrorPage } from '@/components/common/ErrorPage';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      title="Sign In Error"
      message="Something went wrong while signing in. Please try again."
      onRetry={reset}
    />
  );
}
