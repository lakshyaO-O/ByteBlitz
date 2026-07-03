'use client';

import React from 'react';
import { PrivacySettings as PrivacySettingsType } from '@/types';
import { Shield, Lock, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type PrivacySection = keyof PrivacySettingsType;

interface PrivacyGateProps {
  section: PrivacySection;
  privacySettings?: PrivacySettingsType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PrivacyGate({ section, privacySettings, children, fallback }: PrivacyGateProps) {
  if (!privacySettings) return <>{children}</>;

  const isVisible = privacySettings[section];

  if (isVisible === false) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <div className="bg-card/30 border border-border/50 rounded-lg p-6">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <EyeOff className="w-5 h-5" />
          <p className="text-xs">This section is private</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
