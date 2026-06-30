'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Shell } from '@/components/layout/Shell';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { user, loading } = useUser();
  const [timeoutExpired, setTimeoutExpired] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setTimeoutExpired(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading && !timeoutExpired) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading arena...</p>
        </div>
      </div>
    );
  }

  if (timeoutExpired) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Still setting up. If this persists, try signing in.
          </p>
          <button
            onClick={() => router.push('/auth?mode=login')}
            className="text-primary hover:underline text-sm font-bold"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Shell>{children}</Shell>;
}
