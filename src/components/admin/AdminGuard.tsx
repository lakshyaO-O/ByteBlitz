'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { checkAdmin } from '@/services/admin';
import { ShieldBan } from 'lucide-react';

function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-mono">{message || 'Loading...'}</p>
      </div>
    </div>
  );
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [adminStatus, setAdminStatus] = useState<{ checked: boolean; isAdmin: boolean; role: string }>({
    checked: false, isAdmin: false, role: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth?mode=login&redirect=/admin');
      return;
    }
    checkAdmin(user.uid).then(result => {
      setAdminStatus({ checked: true, ...result });
      if (!result.isAdmin) {
        setTimeout(() => router.replace('/dashboard'), 2000);
      }
    });
  }, [user, authLoading, router]);

  if (authLoading || !adminStatus.checked) return <LoadingScreen message="Verifying access..." />;
  if (!adminStatus.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md px-6">
          <ShieldBan className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-headline font-black text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You need the <strong>super_admin</strong> role to access the admin panel. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
