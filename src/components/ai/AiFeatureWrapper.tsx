'use client';

import React, { useState, useCallback, ReactNode } from 'react';
import type { AiFeature } from '@/config/ai-limits';
import { useAiUsage } from '@/hooks/use-ai-usage';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';
import { UsageDisplay } from './UsageDisplay';
import { Button } from '@/components/ui/button';
import { Crown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiFeatureWrapperProps {
  userId: string | null;
  feature: AiFeature;
  children: ReactNode;
  onConsume?: () => void | Promise<void>;
  requiresAuth?: boolean;
  className?: string;
}

export function AiFeatureWrapper({
  userId, feature, children, onConsume,
  requiresAuth = true, className,
}: AiFeatureWrapperProps) {
  const { isExhausted, isPremium, loading, consume, refresh } = useAiUsage(userId, feature);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [consuming, setConsuming] = useState(false);

  const handleAction = useCallback(async () => {
    if (!userId) {
      if (requiresAuth) return;
    }

    if (isExhausted && !isPremium) {
      setShowUpgrade(true);
      return;
    }

    setConsuming(true);
    try {
      const success = await consume();
      if (success) {
        await onConsume?.();
      } else {
        setShowUpgrade(true);
      }
    } finally {
      setConsuming(false);
    }
  }, [userId, isExhausted, isPremium, consume, onConsume, requiresAuth]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {isExhausted && !isPremium ? (
        <div className={cn('space-y-4', className)}>
          <UsageDisplay userId={userId} feature={feature} showLabel showProgressBar showCountdown />
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-4">
            <Crown className="w-10 h-10 text-destructive mx-auto" />
            <div>
              <p className="font-bold text-sm">Daily limit reached</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upgrade to Pro for unlimited {feature.replace(/([A-Z])/g, ' $1').toLowerCase()} access.
              </p>
            </div>
            <Button variant="default" onClick={() => setShowUpgrade(true)} className="gap-2">
              <Crown className="w-4 h-4" /> Upgrade to Pro
            </Button>
          </div>
        </div>
      ) : (
        <div className={cn('relative', className)}>
          {consuming && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {React.isValidElement(children)
            ? React.cloneElement(children as React.ReactElement<any>, {
                onAction: handleAction,
                disabled: consuming || (isExhausted && !isPremium),
              })
            : children}
        </div>
      )}

      <PremiumUpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={feature}
      />
    </>
  );
}
