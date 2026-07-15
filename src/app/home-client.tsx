'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { LandingPage } from '@/components/landing/LandingPage';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, error } = useUser();
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (error) {
      setRenderError(error);
    }
  }, [error]);

  if (!isClient) {
    return <LandingPage />;
  }

  if (authLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (user) {
    return <LoadingScreen message="Redirecting to dashboard..." />;
  }

  if (renderError) {
    return <LandingPage />;
  }

  return <LandingPage />;
}
