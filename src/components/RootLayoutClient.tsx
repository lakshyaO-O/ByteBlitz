'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface ProtectedLayoutProps {
  children: ReactNode;
}

// Routes that don't need the Shell layout (landing, auth)
const PUBLIC_NO_SHELL_ROUTES = ['/', '/auth'];

// Routes that require authentication (redirect to auth if not logged in)
const PROTECTED_ROUTES = [
  '/profile',
  '/settings',
  '/friends',
  '/notifications',
  '/progress',
  '/achievements',
  '/admin',
  '/analytics',
  '/learning',
  '/security',
  '/monetization',
];

export function RootLayoutClient({ children }: ProtectedLayoutProps) {
  const pathname = usePathname();
  const isPublicNoShell = PUBLIC_NO_SHELL_ROUTES.includes(pathname);
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Landing and auth pages: no shell, no guard (they handle auth themselves)
  if (isPublicNoShell) {
    return <>{children}</>;
  }

  // Protected routes (profile, settings, friends, etc.) require auth
  if (isProtectedRoute) {
    return (
      <ErrorBoundary>
        <AuthGuard>{children}</AuthGuard>
      </ErrorBoundary>
    );
  }

  // All other routes (arena, practice, contests, leaderboard, search, etc.)
  // are browsable by guests — they'll get action-level gates instead
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
