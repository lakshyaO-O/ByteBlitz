'use client';

import { useState, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, TrendingUp, TrendingDown, Brain, Target, Zap, Clock, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { usePracticeProblems, useUserProgress } from '@/hooks/use-practice-problems';
import { usePracticeStats } from '@/hooks/use-practice-stats';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PATTERNS } from '@/data/patterns';

export function LearningAnalyticsPage() {
  const { user } = useUser();
  const { problems } = usePracticeProblems();
  const { progress } = useUserProgress(user?.uid || null);
  const { stats, loading } = usePracticeStats(user?.uid || null);

  const topicData = useMemo(() => {
    if (!problems || !progress || !stats) return [];
    const counts = problems.reduce((acc, p) => {
      p.topics.forEach(t => {
        if (!acc[t]) acc[t] = { total: 0, solved: 0, attempted: 0 };
        acc[t].total++;
        if (progress[p.id]?.solved) acc[t].solved++;
        if (progress[p.id]?.attempted) acc[t].attempted++;
      });
      return acc;
    }, {} as Record<string, { total: number; solved: number; attempted: number }>);

    return Object.entries(counts)
      .map(([topic, data]) => ({
        topic,
        ...data,
        mastery: data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0,
      }))
      .sort((a, b) => a.mastery - b.mastery);
  }, [problems, progress, stats]);

  const strongTopics = topicData.filter(t => t.mastery >= 70);
  const weakTopics = topicData.filter(t => t.mastery < 40 && t.total > 0);
  const patternsMastered = useMemo(() => {
    if (!problems || !progress) return [];
    return Object.entries(PATTERNS)
      .filter(([, p]) => {
        const relatedProblems = problems.filter(pr =>
          pr.topics.some(t => p.detectionRules.some(r => r.toLowerCase().includes(t.toLowerCase())))
        );
        return relatedProblems.some(pr => progress[pr.id]?.solved);
      })
      .slice(0, 5)
      .map(([, p]) => p.name);
  }, [problems, progress]);

  const totalSolved = stats?.totalSolved || 0;
  const accuracy = stats ? Math.round((totalSolved / Math.max(1, stats.totalAttempted)) * 100) : 0;
  const weakTopicNames = weakTopics.map(t => t.topic);

  const recommendations = useMemo(() => {
    if (!problems || weakTopicNames.length === 0) return [];
    const unsolved = problems.filter(p =>
      !progress?.[p.id]?.solved &&
      p.topics.some(t => weakTopicNames.includes(t))
    );
    return unsolved.slice(0, 5);
  }, [problems, weakTopicNames, progress]);

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-primary" />
            Learning Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Your personalized learning insights powered by your practice history.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <Brain className="w-4 h-4 text-violet-400 mx-auto mb-1.5" />
            <p className="text-lg font-bold font-mono text-foreground">{totalSolved}</p>
            <p className="text-[10px] text-muted-foreground">Problems Solved</p>
          </Card>
          <Card className="p-4 text-center">
            <Target className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
            <p className="text-lg font-bold font-mono text-foreground">{accuracy}%</p>
            <p className="text-[10px] text-muted-foreground">Accuracy</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="w-4 h-4 text-amber-400 mx-auto mb-1.5" />
            <p className="text-lg font-bold font-mono text-foreground">{patternsMastered.length}</p>
            <p className="text-[10px] text-muted-foreground">Patterns Mastered</p>
          </Card>
          <Card className="p-4 text-center">
            <Sparkles className="w-4 h-4 text-blue-400 mx-auto mb-1.5" />
            <p className="text-lg font-bold font-mono text-foreground">{topicData.length}</p>
            <p className="text-[10px] text-muted-foreground">Topics Practiced</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-foreground">Strong Topics</h3>
            </div>
            {strongTopics.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/60 py-4 text-center">
                Solve more problems to build your strengths.
              </p>
            ) : (
              <div className="space-y-1.5">
                {strongTopics.map(t => (
                  <div key={t.topic} className="flex items-center justify-between px-2 py-1.5 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-[11px] font-medium text-foreground">{t.topic}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${t.mastery}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">{t.mastery}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-semibold text-foreground">Needs Practice</h3>
            </div>
            {weakTopics.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/60 py-4 text-center">
                Great job! No weak topics detected.
              </p>
            ) : (
              <div className="space-y-1.5">
                {weakTopics.map(t => (
                  <div key={t.topic} className="flex items-center justify-between px-2 py-1.5 rounded-md bg-red-500/5 border border-red-500/10">
                    <span className="text-[11px] font-medium text-foreground">{t.topic}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${t.mastery}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-red-400">{t.mastery}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold text-foreground">All Topics</h3>
            </div>
            <div className="space-y-1.5">
              {topicData.map(t => (
                <div key={t.topic} className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] text-muted-foreground">{t.topic}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn(
                        'h-full rounded-full transition-all',
                        t.mastery >= 70 ? 'bg-emerald-500' : t.mastery >= 40 ? 'bg-amber-500' : 'bg-red-500',
                      )} style={{ width: `${t.mastery}%` }} />
                    </div>
                    <span className={cn(
                      'text-[9px] font-mono w-8 text-right',
                      t.mastery >= 70 ? 'text-emerald-400' : t.mastery >= 40 ? 'text-amber-400' : 'text-red-400',
                    )}>{t.mastery}%</span>
                    <span className="text-[9px] text-muted-foreground/60">{t.solved}/{t.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-3">
            {patternsMastered.length > 0 && (
              <Card className="p-4 space-y-2">
                <h3 className="text-xs font-semibold text-foreground">Patterns Mastered</h3>
                <div className="flex flex-wrap gap-1">
                  {patternsMastered.map(p => (
                    <Badge key={p} variant="secondary" className="text-[9px] px-2 py-0.5">{p}</Badge>
                  ))}
                </div>
              </Card>
            )}

            {recommendations.length > 0 && (
              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-semibold text-foreground">Recommended Next</h3>
                </div>
                <div className="space-y-0.5">
                  {recommendations.map(p => (
                    <Link key={p.id} href={`/practice?problem=${p.id}`}
                      className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/10 transition-colors group"
                    >
                      <span className="text-[11px] text-foreground group-hover:text-primary transition-colors">{p.title}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={cn(
                          'text-[8px] px-1 py-0',
                          p.difficulty === 'Easy' && 'border-emerald-500/30 text-emerald-400',
                          p.difficulty === 'Medium' && 'border-amber-500/30 text-amber-400',
                          p.difficulty === 'Hard' && 'border-red-500/30 text-red-400',
                        )}>{p.difficulty}</Badge>
                        <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100" />
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
