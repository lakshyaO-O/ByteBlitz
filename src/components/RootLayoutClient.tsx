'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';

interface ProtectedLayoutProps {
  children: ReactNode;
}

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/auth'];

export function RootLayoutClient({ children }: ProtectedLayoutProps) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (isPublicRoute) {
    // Public routes don't need auth guard
    return <>{children}</>;
  }

  // Protected routes require authentication
  return <AuthGuard>{children}</AuthGuard>;
}
