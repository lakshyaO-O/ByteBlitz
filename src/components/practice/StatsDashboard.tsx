'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Brain, Trophy, Flame, Target, Zap, Code2, CheckCircle2, BarChart3, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsDashboardProps {
  totalSolved: number;
  totalProblems: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  currentStreak: number;
  totalXp: number;
  accuracy: number;
  loading?: boolean;
}

export function StatsDashboard({
  totalSolved, totalProblems, easySolved, mediumSolved, hardSolved,
  currentStreak, totalXp, accuracy, loading,
}: StatsDashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="bg-card/50 border-border animate-pulse">
            <CardContent className="p-4 space-y-2">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-6 w-12 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const completionPct = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

  const stats = [
    {
      label: 'Total Solved', value: `${totalSolved}/${totalProblems}`,
      icon: Code2, color: 'text-primary', bg: 'bg-primary/10',
      sub: `${completionPct}% complete`,
    },
    {
      label: 'Easy', value: easySolved,
      icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10',
    },
    {
      label: 'Medium', value: mediumSolved,
      icon: BarChart3, color: 'text-yellow-400', bg: 'bg-yellow-500/10',
    },
    {
      label: 'Hard', value: hardSolved,
      icon: Zap, color: 'text-destructive', bg: 'bg-destructive/10',
    },
    {
      label: 'Streak', value: `${currentStreak} days`,
      icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10',
    },
    {
      label: 'XP Earned', value: totalXp.toLocaleString(),
      icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10',
    },
    {
      label: 'Accuracy', value: `${accuracy}%`,
      icon: Target, color: 'text-cyan-400', bg: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="bg-card/50 border-border hover:border-primary/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', stat.bg)}>
                  <Icon className={cn('w-4 h-4', stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
                    {stat.label}
                  </p>
                  <p className={cn('text-lg font-black font-headline', stat.color)}>{stat.value}</p>
                  {stat.sub && (
                    <p className="text-[9px] text-muted-foreground">{stat.sub}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
