'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Brain, Trophy, Flame, Target, Zap, Code2, CheckCircle2, BarChart3, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 800;
    const start = 0;

    function tick(now: number) {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

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
          <Card key={i} className="border-border animate-pulse">
            <CardContent className="p-4 space-y-2">
              <div className="h-3 w-16 bg-muted/50 rounded" />
              <div className="h-5 w-12 bg-muted/50 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const completionPct = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

  const stats = [
    {
      label: 'Total Solved', value: totalSolved,
      display: `${totalSolved}/${totalProblems}`,
      icon: Code2, color: 'text-primary', bg: 'bg-primary/10',
      sub: `${completionPct}% complete`,
      animate: true,
    },
    {
      label: 'Easy', value: easySolved,
      display: easySolved,
      icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10',
      animate: true,
    },
    {
      label: 'Medium', value: mediumSolved,
      display: mediumSolved,
      icon: BarChart3, color: 'text-yellow-400', bg: 'bg-yellow-500/10',
      animate: true,
    },
    {
      label: 'Hard', value: hardSolved,
      display: hardSolved,
      icon: Zap, color: 'text-destructive', bg: 'bg-destructive/10',
      animate: true,
    },
    {
      label: 'Streak', value: currentStreak,
      display: `${currentStreak} days`,
      icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10',
      animate: true,
      suffix: ' days',
    },
    {
      label: 'XP Earned', value: totalXp,
      display: totalXp.toLocaleString(),
      icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10',
      animate: true,
    },
    {
      label: 'Accuracy', value: accuracy,
      display: `${accuracy}%`,
      icon: Target, color: 'text-cyan-400', bg: 'bg-cyan-500/10',
      animate: true,
      suffix: '%',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', stat.bg)}>
                  <Icon className={cn('w-4 h-4', stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    {stat.label}
                  </p>
                  <p className={cn('text-lg font-semibold tracking-tight', stat.color)}>
                    {stat.animate ? (
                      <AnimatedNumber value={stat.value} suffix={stat.suffix || ''} />
                    ) : (
                      stat.display
                    )}
                  </p>
                  {stat.sub && (
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
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
