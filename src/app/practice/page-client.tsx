'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookmarkCheck, Clock, Brain, Shuffle, CheckCircle2, Lock } from 'lucide-react';
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

  const loading = problemsLoading || progressLoading || authLoading;
  const totalProblemsCount = problems.length;

  const handleStartProblem = useCallback((problem: PracticeProblemDocument | null) => {
    if (!problem) return;
    if (isBeginner && !canAccess(problem.difficulty)) return;
    trackRecent({ id: problem.id, title: problem.title, difficulty: problem.difficulty });
    setSelectedProblem(problem);
  }, [isBeginner, canAccess, trackRecent]);

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

  const handleTopicClick = useCallback((_topicName: string) => {
    // handled inside ProblemBrowser now
  }, []);

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

  return (
    <Shell>
      <AchievementPopupContainer
        achievements={newAchievements}
        onDismiss={dismissNewAchievement}
      />

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
                PRACTICE <span className="text-primary neon-text">ZONE</span>
              </h1>
              {isBeginner && unlockProgress.length > 0 && (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border">
                  {unlockProgress.map(u => (
                    <div key={u.difficulty} className="flex items-center gap-1">
                      {u.unlocked ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className={cn(
                        'text-[9px] font-bold uppercase tracking-widest',
                        u.unlocked ? 'text-emerald-400' : 'text-muted-foreground',
                      )}>
                        {u.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {totalProblemsCount > 0
                ? `${totalSolved}/${totalProblemsCount} solved`
                : 'Loading problems...'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleRandomProblem} className="gap-1.5 text-xs">
              <Shuffle className="w-3.5 h-3.5" /> Random
            </Button>
            {totalProblemsCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">{Math.round((totalSolved / totalProblemsCount) * 100)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard */}
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

        {/* Daily + Weekly Challenge */}
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

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <Card className="bg-card/50 border-border overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recently Viewed</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {recentlyViewed.map((r: any) => (
                  <button
                    key={r.problemId}
                    onClick={() => {
                      const p = problems.find(pr => pr.id === r.problemId);
                      if (p) handleStartProblem(p);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-muted/30 border border-border text-[10px] font-bold hover:border-primary/50 transition-colors whitespace-nowrap"
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
          <Card className="bg-card/50 border-primary/20 border overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookmarkCheck className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Bookmarked</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {bookmarkedIds.slice(0, 10).map(id => {
                  const p = problems.find(pr => pr.id === id);
                  if (!p) return null;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleStartProblem(p)}
                      className="shrink-0 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-bold hover:border-primary/50 transition-colors whitespace-nowrap"
                    >
                      {p.title}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading problems...</p>
            </div>
          </div>
        ) : (
          <ProblemBrowser
            problems={problems}
            progress={progress}
            isBeginner={isBeginner}
            unlockedDifficulties={unlockedDifficulties}
            canAccess={canAccess}
          onStartProblem={handleStartProblem}
          />
        )}
      </div>
    </Shell>
  );
}
