'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';

interface ProtectedLayoutProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = ['/', '/auth'];

export function RootLayoutClient({ children }: ProtectedLayoutProps) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <AuthGuard>{children}</AuthGuard>;
}
