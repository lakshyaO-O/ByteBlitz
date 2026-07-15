'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorPage } from '@/components/common/ErrorPage';
import { Shell } from '@/components/layout/Shell';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, error } = useUser();

  const uid = user?.uid;
  const { data: userData } = useDoc(uid ? `users/${uid}` : null);

  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth?mode=login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (userData?.banned) {
      router.push('/auth?mode=login');
    }
  }, [userData, router]);

  if (error) {
    return (
      <ErrorPage
        error={new Error(error)}
        title="Authentication Error"
        message="There was a problem verifying your identity. Please try signing in again."
        onRetry={() => router.push('/auth?mode=login')}
      />
    );
  }

  if (loading) {
    return <LoadingScreen message={`Loading ${pathname?.replace('/', '') || 'page'}...`} />;
  }

  if (!user) {
    return <LoadingScreen message="Redirecting to sign in..." />;
  }

  if (userData?.banned) {
    return (
      <ErrorPage
        error={new Error('Account suspended')}
        title="Account Suspended"
        message="Your account has been suspended. Please contact support for more information."
      />
    );
  }

  if (isAdminRoute) return <>{children}</>;

  return <Shell>{children}</Shell>;
}
