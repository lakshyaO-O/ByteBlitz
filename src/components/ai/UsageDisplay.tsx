'use client';

import { Crown, Zap, InfinityIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AiFeature } from '@/config/ai-limits';
import { AI_FEATURE_LABELS } from '@/config/ai-limits';
import { useAiUsage } from '@/hooks/use-ai-usage';

interface UsageDisplayProps {
  userId: string | null;
  feature: AiFeature;
  showLabel?: boolean;
  showProgressBar?: boolean;
  showCountdown?: boolean;
  className?: string;
}

export function UsageDisplay({
  userId, feature, showLabel = true,
  showProgressBar = true, showCountdown = false,
  className,
}: UsageDisplayProps) {
  const { remaining, limit, used, percentage, isPremium, isExhausted, loading, countdown } =
    useAiUsage(userId, feature);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
        <Zap className="w-3.5 h-3.5 animate-pulse" />
        Loading...
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-emerald-400', className)} title="Unlimited access">
        <Crown className="w-3.5 h-3.5" />
        {showLabel && <span className="font-bold uppercase tracking-wider">{AI_FEATURE_LABELS[feature]}</span>}
        <InfinityIcon className="w-3.5 h-3.5" />
        <span>Unlimited</span>
      </div>
    );
  }

  const label = showLabel ? AI_FEATURE_LABELS[feature] : null;

  return (
    <div className={cn('space-y-1', className)}>
      <div
        className={cn(
          'flex items-center gap-2 text-xs',
          isExhausted ? 'text-destructive' : 'text-muted-foreground',
        )}
        title={`${used}/${limit} used`}
      >
        {isExhausted ? (
          <Crown className="w-3.5 h-3.5 text-destructive" />
        ) : (
          <Zap className="w-3.5 h-3.5" />
        )}
        {label && <span className="font-bold uppercase tracking-wider">{label}</span>}
        <span className="font-mono font-bold">
          {remaining}/{limit}
        </span>
        {showCountdown && !isExhausted && countdown && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <Clock className="w-2.5 h-2.5" />
            {countdown}
          </span>
        )}
      </div>

      {showProgressBar && limit != null && limit > 0 && (
        <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isExhausted ? 'bg-destructive' : percentage > 80 ? 'bg-amber-500' : 'bg-primary',
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      )}
    </div>
  );
}
