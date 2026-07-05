'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, CheckCircle2, Gift, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyChallengeCardProps {
  daily: { date: string; problemId: string; xpBonus: number } | null;
  status: { completed: boolean; claimed: boolean; date: string } | null;
  weekly: { week: string; problemIds: string[]; xpBonus: number } | null;
  weeklyProgress: { solved: number; total: number; claimed: boolean };
  loading: boolean;
  onStartDaily: () => void;
  onClaimDaily: () => void;
  onStartWeekly: (problemId: string) => void;
}

function HeroSkeleton() {
  return (
    <div className="rounded-lg border border-border/50 bg-card animate-pulse p-5 space-y-3">
      <div className="h-4 w-40 bg-muted/50 rounded" />
      <div className="h-5 w-56 bg-muted/50 rounded" />
      <div className="flex gap-3">
        <div className="h-9 w-28 bg-muted/50 rounded-md" />
        <div className="h-9 w-28 bg-muted/50 rounded-md" />
      </div>
    </div>
  );
}

export function DailyChallengeCard({
  daily, status, weekly, weeklyProgress, loading,
  onStartDaily, onClaimDaily, onStartWeekly,
}: DailyChallengeCardProps) {
  if (loading) return <HeroSkeleton />;

  const dailyCompleted = status?.completed;
  const dailyClaimed = status?.claimed;

  const weeklyPct = weeklyProgress.total > 0
    ? Math.round((weeklyProgress.solved / weeklyProgress.total) * 100)
    : 0;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <div
          className={cn(
            'relative rounded-lg border transition-colors',
            dailyCompleted
              ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
              : 'border-border',
          )}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{today}</p>
                    <h2 className="text-base font-semibold text-foreground">Daily Challenge</h2>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground max-w-md">
                  {dailyCompleted
                    ? 'You completed today\'s challenge! Claim your bonus XP.'
                    : 'Solve today\'s featured problem and earn bonus XP.'}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs gap-1 py-0.5 border-primary/20">
                    <Zap className="w-3 h-3 text-primary" /> +{daily?.xpBonus || 50} XP Bonus
                  </Badge>
                  {dailyCompleted && !dailyClaimed && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs py-0.5 gap-1">
                      Ready to claim!
                    </Badge>
                  )}
                  {dailyClaimed && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs py-0.5 gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Claimed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {dailyClaimed ? (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                ) : dailyCompleted ? (
                  <Button size="sm" onClick={onClaimDaily} className="gap-1.5">
                    <Gift className="w-4 h-4" /> Claim XP
                  </Button>
                ) : (
                  <Button size="sm" onClick={onStartDaily} className="gap-1.5">
                    Solve Now
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card/30 overflow-hidden">
        <CardContent className="p-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Weekly Challenge</p>
                <p className="text-sm font-medium text-foreground">
                  {weeklyProgress.solved}/{weeklyProgress.total} solved
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{ width: `${weeklyPct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{weeklyPct}%</span>
              </div>
              {weekly && weekly.xpBonus > 0 && (
                <Badge variant="outline" className="text-xs gap-1 border-secondary/20 text-secondary">
                  <Zap className="w-3 h-3" /> +{weekly.xpBonus} XP
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {weekly?.problemIds.slice(0, 4).map((pid, i) => (
                <Button
                  key={pid}
                  variant={i < weeklyProgress.solved ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => onStartWeekly(pid)}
                  className="text-xs h-7 px-2.5 font-medium"
                >
                  {i < weeklyProgress.solved ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
                  #{i + 1}
                </Button>
              ))}
              {(weekly?.problemIds.length || 0) > 4 && (
                <span className="text-xs text-muted-foreground self-center ml-1">
                  +{weekly!.problemIds.length - 4}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
}
