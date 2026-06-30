'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Flame,
  Loader2,
} from 'lucide-react';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { useUser, useDoc } from '@/firebase';

export default function ProgressPage() {
  const { user, loading: authLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc(user ? `users/${user.uid}` : null);

  if (authLoading || profileLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  const stats = profile || {};
  const tier = getTier(stats.rating || 1200);
  const winRate = (stats.wins + stats.losses) > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;
  const totalGames = (stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0);
  const xpProgress = (stats.xp || 0) % 1000;
  const xpPercent = Math.floor((xpProgress / 1000) * 100);
  const nextLevelXp = 1000 - xpProgress;

  const metrics = [
    { label: 'Win Rate', value: `${winRate}%`, color: 'text-emerald-400', icon: Activity },
    { label: 'Total Games', value: totalGames, color: 'text-primary', icon: BarChart3 },
    { label: 'Current ELO', value: stats.rating || 1200, color: 'text-secondary', icon: TrendingUp },
    { label: 'Highest ELO', value: stats.highestRating || 1200, color: 'text-orange-400', icon: Target },
    { label: 'Level', value: stats.level || 1, color: 'text-foreground', icon: Zap },
    { label: 'XP to Next Level', value: nextLevelXp, color: 'text-muted-foreground', icon: Flame },
  ];

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            PROGRESS <span className="text-primary neon-text">TRACKER</span>
          </h1>
          <p className="text-muted-foreground">Monitor your growth and performance across the arena.</p>
        </div>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-headline font-bold">{stats.username || 'Player'}</h2>
                  <Badge variant="outline" className={cn('text-[10px] uppercase tracking-widest', getTierColor(tier))}>{tier}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Rating: {stats.rating || 1200} ELO</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-3xl font-headline font-bold text-primary">{stats.wins || 0}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-headline font-bold text-destructive">{stats.losses || 0}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Losses</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-headline font-bold text-yellow-400">{stats.draws || 0}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Draws</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-border md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Level Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Level {stats.level || 1}</span>
                <span className="text-sm text-muted-foreground">
                  {xpProgress} / 1000 XP
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary neon-glow transition-all" style={{ width: `${xpPercent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {nextLevelXp} XP needed for Level {(stats.level || 1) + 1}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Target className="w-5 h-5 text-secondary" /> Win/Loss Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeDasharray={`${winRate}, ${100 - winRate}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-headline font-bold text-primary">{winRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="bg-card/50 border-border">
              <CardContent className="p-4 text-center space-y-2">
                <metric.icon className={cn('w-5 h-5 mx-auto', metric.color)} />
                <div className={cn('text-2xl font-headline font-bold', metric.color)}>{metric.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{metric.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
