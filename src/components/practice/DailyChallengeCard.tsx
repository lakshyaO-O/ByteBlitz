'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, CheckCircle2, Gift, Calendar, Swords } from 'lucide-react';
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

export function DailyChallengeCard({
  daily, status, weekly, weeklyProgress, loading,
  onStartDaily, onClaimDaily, onStartWeekly,
}: DailyChallengeCardProps) {
  if (loading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-5 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const dailyCompleted = status?.completed;
  const dailyClaimed = status?.claimed;
  const weeklyPct = weeklyProgress.total > 0
    ? Math.round((weeklyProgress.solved / weeklyProgress.total) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className={cn(
        'border overflow-hidden transition-all',
        dailyCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-card/50',
      )}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                  Daily Challenge
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {dailyCompleted
                  ? 'You completed today\'s challenge!'
                  : 'Solve today\'s featured problem for bonus XP.'}
              </p>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] font-bold gap-1">
                  <Zap className="w-3 h-3" /> +{daily?.xpBonus || 50} XP
                </Badge>
                {dailyCompleted && !dailyClaimed && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                    Ready to claim!
                  </Badge>
                )}
                {dailyClaimed && (
                  <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Claimed
                  </Badge>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {dailyClaimed ? (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
              ) : dailyCompleted ? (
                <Button size="sm" onClick={onClaimDaily} className="gap-1.5 text-xs h-8">
                  <Gift className="w-3.5 h-3.5" /> Claim
                </Button>
              ) : (
                <Button size="sm" onClick={onStartDaily} className="gap-1.5 text-xs h-8">
                  <Swords className="w-3.5 h-3.5" /> Solve
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                  Weekly Challenge
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {weeklyProgress.solved}/{weeklyProgress.total} problems solved
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-24">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${weeklyPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{weeklyPct}%</span>
              </div>
              {weekly && weekly.xpBonus > 0 && (
                <Badge variant="outline" className="text-[10px] font-bold gap-1">
                  <Zap className="w-3 h-3" /> +{weekly.xpBonus} XP on completion
                </Badge>
              )}
            </div>
            <div className="shrink-0 flex flex-col gap-1">
              {weekly?.problemIds.slice(0, 3).map((pid) => (
                <Button
                  key={pid}
                  variant="ghost"
                  size="sm"
                  onClick={() => onStartWeekly(pid)}
                  className="text-[10px] h-6 px-2"
                >
                  Solve
                </Button>
              ))}
              {(weekly?.problemIds.length || 0) > 3 && (
                <span className="text-[9px] text-muted-foreground text-center">
                  +{weekly!.problemIds.length - 3} more
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
