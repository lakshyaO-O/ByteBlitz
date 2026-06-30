'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { LandingPage } from '@/components/landing/LandingPage';

export default function Home() {
  const { user, loading: authLoading } = useUser();

  useEffect(() => {
    if (!authLoading && user) {
      window.location.href = '/dashboard';
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return <LandingPage />;
}
