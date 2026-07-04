'use client';

import { Crown, Zap, Loader2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AiFeature } from '@/config/ai-limits';
import { AI_FEATURE_LABELS } from '@/config/ai-limits';
import { useAiUsage } from '@/hooks/use-ai-usage';

interface UsageCardProps {
  userId: string | null;
  feature: AiFeature;
  onUpgrade?: () => void;
  className?: string;
}

export function UsageCard({ userId, feature, onUpgrade, className }: UsageCardProps) {
  const { remaining, limit, used, isPremium, isExhausted, loading, countdown, error } =
    useAiUsage(userId, feature);

  const label = AI_FEATURE_LABELS[feature];

  // Loading state
  if (loading) {
    return (
      <Card className={cn('border-border', className)}>
        <CardContent className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading usage...
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-border', className)}>
        <CardContent className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          Usage data unavailable
        </CardContent>
      </Card>
    );
  }

  // Premium / unlimited
  if (isPremium) {
    return (
      <Card className={cn('border-border/50 bg-primary/5', className)}>
        <CardContent className="p-3 flex items-center gap-2 text-sm">
          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium text-foreground">{label}</span>
          <span className="text-emerald-400 font-medium ml-auto">Unlimited</span>
        </CardContent>
      </Card>
    );
  }

  // No limit configured (remaining=null, limit=null)
  if (remaining === null && limit === null) {
    return (
      <Card className={cn('border-border/50', className)}>
        <CardContent className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-foreground">{label}</span>
          <span className="ml-auto text-xs">Unlimited (Beta)</span>
        </CardContent>
      </Card>
    );
  }

  // Limit exhausted
  if (isExhausted) {
    return (
      <Card className={cn('border-destructive/30 bg-destructive/5', className)}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span className="font-medium text-foreground">{label}</span>
            <span className="ml-auto text-xs font-medium text-destructive">
              {used}/{limit} used
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 gap-2">
            <p className="text-xs text-muted-foreground">Daily limit reached</p>
            {onUpgrade && (
              <Button size="sm" variant="default" className="gap-1.5 text-xs h-7" onClick={onUpgrade}>
                <Crown className="w-3 h-3" /> Upgrade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Limited with remaining
  const pct = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const barColor = isExhausted ? 'bg-destructive' : pct > 80 ? 'bg-amber-500' : 'bg-primary';

  return (
    <Card className={cn('border-border/50', className)}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-foreground">{label}</span>
          <span className="ml-auto text-xs font-medium tabular-nums text-muted-foreground">
            {remaining} of {limit} used today
          </span>
        </div>
        <div className="mt-1.5 w-full h-1 bg-muted/50 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        {countdown && (
          <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground/60">
            <Clock className="w-2.5 h-2.5" />
            Resets in {countdown}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
