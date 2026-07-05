'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, BookmarkCheck, Clock, Brain, Shuffle, CheckCircle2, Lock,
  Play, TrendingUp, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { PracticeWorkbench } from '@/components/practice/PracticeWorkbench';
import { DailyChallengeCard } from '@/components/practice/DailyChallengeCard';
import { AchievementPopupContainer } from '@/components/practice/AchievementPopup';
import { PracticeDashboard, ProblemBrowser } from '@/features/practice/components';
import { usePracticeProblems, useUserProgress, useRecentlyViewed } from '@/hooks/use-practice-problems';
import { usePracticeStats } from '@/hooks/use-practice-stats';
import { useDailyChallenge, useWeeklyChallenge } from '@/hooks/use-daily-challenge';
import { useProgressiveUnlocking } from '@/hooks/use-progressive-unlocking';
import { useAppStore } from '@/store/app-store';
import { enrichAllProblems, getStaticProblemById, getStaticRecommendations } from '@/lib/problem-utils';
import type { PracticeProblemDocument, Difficulty, ProblemTopic } from '@/types';

import { ALL_TOPICS } from '@/features/practice/components/ProblemFilters';

function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-7 w-44 bg-muted/30 rounded-md" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-32 bg-muted/10 rounded-lg" />
        <div className="h-32 bg-muted/10 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted/10 rounded-lg" />
        ))}
      </div>
      <div className="h-5 w-28 bg-muted/30 rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted/10 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function ContinueCard({
  problem, progress, onStart,
}: {
  problem: PracticeProblemDocument;
  progress: { lastSubmittedAt?: string };
  onStart: (p: PracticeProblemDocument) => void;
}) {
  const timeAgo = progress.lastSubmittedAt
    ? (() => {
        const diff = Date.now() - new Date(progress.lastSubmittedAt).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      })()
    : null;

  const diffColor = problem.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
    : problem.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
    : 'text-destructive border-destructive/20 bg-destructive/10';

  return (
    <Card className="border-border hover:border-primary/30 transition-colors h-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn('text-xs px-1.5 py-0.5', diffColor)}>
                {problem.difficulty}
              </Badge>
              <span className="text-xs text-muted-foreground">
                +{problem.points} XP
              </span>
            </div>
            <p className="text-sm font-medium truncate text-foreground">
              {problem.title}
            </p>
            {timeAgo && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Last attempt {timeAgo}
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStart(problem)}
            className="shrink-0 gap-1.5 text-xs h-8"
          >
            <Play className="w-3.5 h-3.5" /> Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({
  problem, onStart,
}: {
  problem: PracticeProblemDocument;
  onStart: (p: PracticeProblemDocument) => void;
}) {
  const diffColor = problem.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
    : problem.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
    : 'text-destructive border-destructive/20 bg-destructive/10';

  const topics = (problem.topics || []).slice(0, 2);

  return (
    <Card className="border-border hover:border-primary/30 transition-colors cursor-pointer h-full" onClick={() => onStart(problem)}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate text-foreground">
                {problem.title}
              </p>
            </div>
            <Badge variant="outline" className={cn('text-xs px-1.5 py-0.5 shrink-0', diffColor)}>
              {problem.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">+{problem.points} XP</span>
            <Badge className="text-xs gap-1 bg-primary/10 text-primary border-primary/20 py-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> Recommended
            </Badge>
          </div>
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {topics.map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded text-xs font-medium bg-muted/20 text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PracticePage() {
  const { user, loading: authLoading } = useUser();
  const { state } = useAppStore();
  const username = user?.displayName || user?.email?.split('@')[0] || 'Player';
  const isBeginner = state.beginner.isBeginnerMode;

  const [selectedProblem, setSelectedProblem] = useState<PracticeProblemDocument | null>(null);
  const [staticProblems] = useState<PracticeProblemDocument[]>(() => enrichAllProblems());

  const { problems: fbProblems, loading: problemsLoading } = usePracticeProblems();
  const { progress, loading: progressLoading } = useUserProgress(user?.uid || null);
  const { recent: recentlyViewed, track: trackRecent } = useRecentlyViewed(user?.uid || null);

  const {
    stats, loading: statsLoading, newAchievements,
    solvedByDifficulty, totalSolved, accuracy,
    dismissNewAchievement,
  } = usePracticeStats(user?.uid || null);

  const { daily, status: dailyStatus, loading: dailyLoading, claim: claimDaily } = useDailyChallenge(user?.uid || null);
  const { weekly, progress: weeklyProgress, loading: weeklyLoading } = useWeeklyChallenge(user?.uid || null);

  const { unlockedDifficulties, canAccess, unlockProgress } = useProgressiveUnlocking(
    user?.uid || null, totalSolved, isBeginner,
  );

  const problems = useMemo(() => {
    if (fbProblems && fbProblems.length > 0) return fbProblems;
    return staticProblems;
  }, [fbProblems, staticProblems]);

  const solvedIds = useMemo(() => {
    if (!progress) return [];
    return Object.entries(progress).filter(([, p]) => p.solved).map(([id]) => id);
  }, [progress]);

  const bookmarkedIds = useMemo(() => {
    if (!progress) return [];
    return Object.entries(progress).filter(([, p]) => p.bookmarked).map(([id]) => id);
  }, [progress]);

  const weakTopics = useMemo(() => {
    if (!stats?.byTopic) return [];
    return Object.entries(stats.byTopic)
      .filter(([, v]) => v.total > 0 && (v.solved / v.total) < 0.3)
      .map(([t]) => t);
  }, [stats]);

  const recommendations = useMemo(() => {
    return getStaticRecommendations(solvedIds, bookmarkedIds, weakTopics, 5);
  }, [solvedIds, bookmarkedIds, weakTopics]);

  const topicMastery = useMemo(() => {
    const counts: Record<string, { solved: number; total: number }> = {};
    ALL_TOPICS.forEach(t => {
      const topicProblems = problems.filter(p =>
        p.topics?.includes(t as ProblemTopic) || p.category === t,
      );
      const solved = topicProblems.filter(p => progress[p.id]?.solved).length;
      counts[t] = { solved, total: topicProblems.length };
    });
    return Object.entries(counts).map(([topic, data]) => ({
      topic, solved: data.solved, total: data.total,
    }));
  }, [problems, progress]);

  const continueSolving = useMemo(() => {
    if (!progress) return [];
    return Object.entries(progress)
      .filter(([, p]) => p.attempted && !p.solved)
      .map(([id, p]) => {
        const prob = problems.find(pr => pr.id === id);
        return prob ? { problem: prob, progress: p } : null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        const ta = a!.progress.lastSubmittedAt || '';
        const tb = b!.progress.lastSubmittedAt || '';
        return tb.localeCompare(ta);
      })
      .slice(0, 6) as { problem: PracticeProblemDocument; progress: { lastSubmittedAt?: string } }[];
  }, [progress, problems]);

  const loading = problemsLoading || progressLoading || authLoading;
  const totalProblemsCount = problems.length;

  const searchParams = useSearchParams();

  const handleStartProblem = useCallback((problem: PracticeProblemDocument | null) => {
    if (!problem) return;
    if (isBeginner && !canAccess(problem.difficulty)) return;
    trackRecent({ id: problem.id, title: problem.title, difficulty: problem.difficulty });
    setSelectedProblem(problem);
  }, [isBeginner, canAccess, trackRecent]);

  useEffect(() => {
    if (!problems.length || loading) return;
    const problemId = searchParams.get('problem');
    if (problemId) {
      const p = problems.find(pr => pr.id === problemId) || getStaticProblemById(problemId);
      if (p) handleStartProblem(p);
    }
  }, [searchParams, problems, loading, handleStartProblem]);

  const handleRandomProblem = useCallback(() => {
    const unsolved = problems.filter(p => !progress[p.id]?.solved);
    const pool = isBeginner ? unsolved.filter(p => canAccess(p.difficulty)) : unsolved;
    if (pool.length === 0) {
      const allPool = isBeginner ? problems.filter(p => canAccess(p.difficulty)) : problems;
      if (allPool.length > 0) handleStartProblem(allPool[Math.floor(Math.random() * allPool.length)]);
      return;
    }
    handleStartProblem(pool[Math.floor(Math.random() * pool.length)]);
  }, [problems, progress, isBeginner, canAccess, handleStartProblem]);

  const handleStartDaily = useCallback(() => {
    if (daily?.problemId) {
      const p = problems.find(pr => pr.id === daily.problemId) || getStaticProblemById(daily.problemId);
      if (p) handleStartProblem(p);
    } else {
      handleRandomProblem();
    }
  }, [daily, problems, handleStartProblem]);

  const handleStartWeekly = useCallback((problemId: string) => {
    const p = problems.find(pr => pr.id === problemId) || getStaticProblemById(problemId);
    if (p) handleStartProblem(p);
  }, [problems, handleStartProblem]);

  const handleTopicClick = useCallback((topicName: string) => {
    const topicProblems = problems.filter(p => p.topics?.includes(topicName as any));
    if (topicProblems.length > 0) {
      setSelectedProblem(topicProblems[0]);
    }
  }, [problems]);

  const currentIndex = selectedProblem ? problems.findIndex(p => p.id === selectedProblem.id) : -1;
  const onPrevProblem = useCallback(() => {
    if (currentIndex > 0) setSelectedProblem(problems[currentIndex - 1]);
  }, [currentIndex, problems]);
  const onNextProblem = useCallback(() => {
    if (currentIndex < problems.length - 1) setSelectedProblem(problems[currentIndex + 1]);
  }, [currentIndex, problems]);

  if (selectedProblem) {
    return (
      <Shell>
        <PracticeWorkbench
          problem={selectedProblem}
          onBack={() => setSelectedProblem(null)}
          userId={user?.uid || null}
          username={username}
          onPrevProblem={onPrevProblem}
          onNextProblem={onNextProblem}
          hasPrev={currentIndex > 0}
          hasNext={currentIndex < problems.length - 1}
        />
      </Shell>
    );
  }

  const easyCount = solvedByDifficulty.Easy || 0;
  const mediumCount = solvedByDifficulty.Medium || 0;
  const hardCount = solvedByDifficulty.Hard || 0;

  if (loading) {
    return (
      <Shell>
        <PageSkeleton />
      </Shell>
    );
  }

  return (
    <Shell>
      <AchievementPopupContainer
        achievements={newAchievements}
        onDismiss={dismissNewAchievement}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground">
                Practice
              </h1>
              {isBeginner && unlockProgress.length > 0 && (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/20 border border-border">
                  {unlockProgress.map(u => (
                    <div key={u.difficulty} className="flex items-center gap-1">
                      {u.unlocked ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className={cn(
                        'text-xs font-medium',
                        u.unlocked ? 'text-emerald-400' : 'text-muted-foreground',
                      )}>
                        {u.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {totalProblemsCount > 0
                ? `${totalSolved}/${totalProblemsCount} solved`
                : 'Loading problems...'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleRandomProblem} className="gap-1.5">
              <Shuffle className="w-3.5 h-3.5" /> Random
            </Button>
            {totalProblemsCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/5 border border-primary/20">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{Math.round((totalSolved / totalProblemsCount) * 100)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Daily Challenge */}
        <DailyChallengeCard
          daily={daily}
          status={dailyStatus}
          weekly={weekly}
          weeklyProgress={weeklyProgress}
          loading={dailyLoading || weeklyLoading}
          onStartDaily={handleStartDaily}
          onClaimDaily={claimDaily}
          onStartWeekly={handleStartWeekly}
        />

        {/* Continue Solving */}
        {continueSolving.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Play className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Continue Solving</span>
              <span className="text-xs text-muted-foreground">({continueSolving.length} in progress)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {continueSolving.map(({ problem, progress: p }) => (
                <ContinueCard key={problem.id} problem={problem} progress={p} onStart={handleStartProblem} />
              ))}
            </div>
          </div>
        )}

        {/* Statistics + Recommendations + Topics */}
        <PracticeDashboard
          totalSolved={totalSolved}
          totalProblems={totalProblemsCount}
          easySolved={easyCount}
          mediumSolved={mediumCount}
          hardSolved={hardCount}
          currentStreak={stats?.currentStreak || 0}
          totalXp={stats?.totalXpEarned || state.beginner.xp || 0}
          accuracy={accuracy}
          topicMastery={topicMastery}
          recommendations={recommendations}
          loading={statsLoading && problemsLoading}
          onStartProblem={handleStartProblem}
          onTopicClick={handleTopicClick}
        />

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <Card className="border-border overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Recently Viewed</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recentlyViewed.map((r: any) => (
                  <button
                    key={r.problemId}
                    onClick={() => {
                      const p = problems.find(pr => pr.id === r.problemId);
                      if (p) handleStartProblem(p);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-md bg-muted/20 border border-border text-xs font-medium hover:border-primary/30 hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookmarks */}
        {bookmarkedIds.length > 0 && (
          <Card className="border-primary/20 border overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookmarkCheck className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">Bookmarked</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {bookmarkedIds.slice(0, 10).map(id => {
                  const p = problems.find(pr => pr.id === id);
                  if (!p) return null;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleStartProblem(p)}
                      className="shrink-0 px-3 py-1.5 rounded-md bg-primary/5 border border-primary/20 text-xs font-medium hover:border-primary/40 transition-colors whitespace-nowrap"
                    >
                      {p.title}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Problem Browser */}
        <ProblemBrowser
          problems={problems}
          progress={progress}
          isBeginner={isBeginner}
          unlockedDifficulties={unlockedDifficulties}
          canAccess={canAccess}
          onStartProblem={handleStartProblem}
        />
      </div>
    </Shell>
  );
}
