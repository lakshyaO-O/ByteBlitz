'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeeklySummary } from '@/app/lib/types';

interface WeeklyStatsProps {
  summary?: WeeklySummary;
  isLoading?: boolean;
}

export function WeeklyStats({ summary, isLoading }: WeeklyStatsProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No weekly data yet</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    { label: 'Coding Time', value: `${Math.floor(summary.totalCodingTime / 60)}m`, icon: TrendingUp, color: 'text-primary' },
    { label: 'Problems Solved', value: summary.problemsSolved.toString(), icon: ArrowUp, color: 'text-emerald-400' },
    { label: 'Matches Played', value: summary.matchesPlayed.toString(), icon: ArrowUp, color: 'text-blue-400' },
    { label: 'Win Rate', value: `${Math.round(summary.winRate * 100)}%`, icon: summary.winRate >= 0.5 ? ArrowUp : ArrowDown, color: summary.winRate >= 0.5 ? 'text-emerald-400' : 'text-destructive' },
    { label: 'Accuracy', value: `${Math.round(summary.accuracy)}%`, icon: summary.accuracy >= 50 ? ArrowUp : ArrowDown, color: summary.accuracy >= 50 ? 'text-primary' : 'text-yellow-400' },
    { label: 'XP Earned', value: summary.xpEarned.toString(), icon: TrendingUp, color: 'text-purple-400' },
  ];

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-headline font-bold">Weekly Progress</CardTitle>
          {summary.rankChange !== 0 && (
            <span className={cn(
              'text-sm font-bold flex items-center gap-1',
              summary.rankChange > 0 ? 'text-emerald-400' : 'text-destructive'
            )}>
              {summary.rankChange > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(summary.rankChange)} rank
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={cn('w-4 h-4', stat.color)} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{stat.label}</span>
              </div>
              <p className={cn('text-xl font-bold font-headline', stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>
        {summary.weakTopics.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
            <p className="text-xs text-destructive font-bold uppercase tracking-widest mb-2">Needs Improvement</p>
            <div className="flex flex-wrap gap-2">
              {summary.weakTopics.map(topic => (
                <span key={topic} className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-md">{topic}</span>
              ))}
            </div>
          </div>
        )}
        {summary.topTopics.length > 0 && (
          <div className="mt-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-2">Strong Areas</p>
            <div className="flex flex-wrap gap-2">
              {summary.topTopics.map(topic => (
                <span key={topic} className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded-md">{topic}</span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
