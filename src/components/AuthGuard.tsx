'use client';

import { useEffect, ReactNode } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { ErrorPage } from '@/components/common/ErrorPage';
import { Shell } from '@/components/layout/Shell';
import { authLog } from '@/lib/auth-debug';

interface AuthGuardProps {
  children: ReactNode;
}

function buildAuthUrl(pathname: string | null): string {
  if (!pathname || pathname === '/auth' || pathname.startsWith('/auth/')) {
    return '/auth?mode=login';
  }
  return `/auth?mode=login&redirect=${encodeURIComponent(pathname)}`;
}

// Minimal placeholder shown while the real auth state is still resolving.
// Deliberately NOT the timer-driven LoadingScreen: the loading screen's own
// countdown UI ("Something took longer than expected") must never fire while
// Firebase is legitimately working. Navigation is driven only by the auth
// status state machine below.
function AuthSplash({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Image src="/logo.svg" alt="DevRann" width={48} height={48} unoptimized className="h-12 w-12 mx-auto animate-pulse-soft" />
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-mono">{message}</p>
      </div>
    </div>
  );
}

// State machine:
//   INITIALIZING   → Firebase auth initial state has not resolved yet.
//                    Stay put, never redirect. (status === 'initializing')
//   AUTHENTICATED  → Render the protected content.
//   UNAUTHENTICATED→ router.replace to /auth?mode=login&redirect=<path>
//
// The protected route is ONLY navigated away from after the underlying auth
// listener has definitively resolved (or hit the safety fallback).
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, error } = useUser();

  const uid = user?.uid;
  const { data: userData } = useDoc(uid ? `users/${uid}` : null);

  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (status === 'initializing') return;
    authLog('AuthGuard', `zone: ${pathname}, state: ${status}`);
    if (!user) {
      authLog('AuthGuard', 'unauthenticated — navigating to auth');
      router.replace(buildAuthUrl(pathname));
    }
  }, [status, user, pathname, router]);

  useEffect(() => {
    if (userData?.banned) {
      router.replace('/auth?mode=login');
    }
  }, [userData, router]);

  if (status === 'initializing') {
    authLog('AuthGuard', 'initializing — holding protected route');
    return <AuthSplash message="Checking your account..." />;
  }

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

  if (!user) {
    authLog('AuthGuard', 'rendering redirect splash');
    return <AuthSplash message="Redirecting to sign in..." />;
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

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return <Shell>{children}</Shell>;
}