'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { getAuth } from 'firebase/auth';
import { Shield } from 'lucide-react';
import type { AdminRole, AdminVerificationResult } from '@/types/admin';
import { ROLE_PERMISSIONS } from '@/types/admin';

const EXEMPTED_PATHS = new Set(['/admin/setup']);

function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-3">
        <div className="w-5 h-5 border-[1.5px] border-foreground/20 border-t-foreground/60 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">{message || 'Loading...'}</p>
      </div>
    </div>
  );
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<AdminVerificationResult | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (EXEMPTED_PATHS.has(pathname)) return;
    if (authLoading) return;
    if (!user) {
      router.replace('/auth?mode=login&redirect=/admin');
      return;
    }

    const verify = async () => {
      try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const res = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setStatus({
              uid: data.uid,
              role: data.role,
              isAdmin: data.isAdmin,
              permissions: data.permissions || [],
            });
            setChecked(true);
            if (!data.isAdmin) {
              setTimeout(() => router.replace('/dashboard'), 2000);
            }
            return;
          }
        }
      } catch {
        // Server verification unavailable - deny access rather than trust client
      }

      setStatus({ uid: user.uid, role: 'user', isAdmin: false, permissions: [] });
      setChecked(true);
    };

    verify();
  }, [user, authLoading, router, pathname]);

  if (EXEMPTED_PATHS.has(pathname)) return <>{children}</>;

  if (authLoading || !checked) return <LoadingScreen message="Verifying access..." />;
  if (!status?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3 max-w-sm px-6">
          <div className="w-10 h-10 rounded-full bg-foreground/5 border border-border flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5 text-foreground/30" />
          </div>
          <h1 className="text-base font-semibold text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You need <strong>admin</strong> or <strong>super_admin</strong> role to access this panel.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
