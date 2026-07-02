'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { LoadingScreen } from '@/components/common/LoadingScreen';

const LandingPage = dynamic(() => import('@/components/landing/LandingPage').then((mod) => mod.LandingPage), {
  ssr: false,
  loading: () => <LoadingScreen message="Preparing experience..." />,
});

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, error } = useUser();
  const [renderError, setRenderError] = useState<string | null>(null);

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
