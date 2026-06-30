'use client';

import React from 'react';
import { SecuritySettings } from '@/components/security/SecuritySettings';
import { Shield } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-headline font-bold">Security</h1>
      </div>
      <SecuritySettings />
    </div>
  );
}
