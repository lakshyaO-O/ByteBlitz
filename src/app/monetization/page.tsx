'use client';

import React from 'react';
import { MonetizationSection } from '@/components/premium/MonetizationSection';
import { useUser } from '@/firebase/auth/use-user';
import { Crown } from 'lucide-react';
import { EmptyState } from '@/components/premium/EmptyState';
import { User } from 'lucide-react';

export default function MonetizationPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <EmptyState
        icon={User}
        title="Sign in required"
        description="Sign in to view subscription plans and manage your account."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="w-6 h-6 text-yellow-400" />
        <h1 className="text-2xl font-headline font-bold">Premium</h1>
      </div>
      <MonetizationSection userId={user.uid} />
    </div>
  );
}
