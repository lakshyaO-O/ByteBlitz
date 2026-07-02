'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Code2, Brain, ChevronRight, CheckCircle2, Loader2, BookOpen,
  Filter, Zap, BookmarkCheck, Clock, TrendingUp, Star, Swords,
  Shuffle, Sparkles, Lock, Flame, RefreshCw, SlidersHorizontal,
  Trophy, Target, BarChart3, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { PracticeWorkbench } from '@/components/practice/PracticeWorkbench';
import { StatsDashboard } from '@/components/practice/StatsDashboard';
import { DailyChallengeCard } from '@/components/practice/DailyChallengeCard';
import { TopicMasteryGrid } from '@/components/practice/TopicMasteryGrid';
import { AchievementPopupContainer } from '@/components/practice/AchievementPopup';
import { usePracticeProblems, useUserProgress, useRecentlyViewed } from '@/hooks/use-practice-problems';
import { usePracticeStats } from '@/hooks/use-practice-stats';
import { useDailyChallenge, useWeeklyChallenge } from '@/hooks/use-daily-challenge';
import { useProgressiveUnlocking } from '@/hooks/use-progressive-unlocking';
import { useAppStore } from '@/store/app-store';
import { enrichAllProblems, getStaticProblemById, getStaticRecommendations, getRandomStaticProblem, getStaticProblemsByTopic } from '@/lib/problem-utils';
import type { PracticeProblemDocument, Difficulty, ProblemTopic } from '@/types';

const ALL_TOPICS = [
  'Arrays', 'Strings', 'Math', 'Loops', 'Functions', 'Recursion',
  'Sorting', 'Searching', 'Hashing', 'Stack', 'Queue', 'Linked List',
  'Trees', 'Graphs', 'Heap', 'Greedy', 'Dynamic Programming',
  'Backtracking', 'Bit Manipulation', 'Binary Search', 'Two Pointers',
  'Sliding Window', 'Prefix Sum', 'Tries', 'Union Find', 'Segment Tree', 'SQL',
];

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const SORT_OPTIONS = ['Default', 'XP (Low)', 'XP (High)', 'Acceptance', 'Difficulty'] as const;

export default function PracticePage() {
  const { user, loading: authLoading } = useUser();
  const { state } = useAppStore();
  const username = user?.displayName || user?.email?.split('@')[0] || 'Player';
  const isBeginner = state.beginner.isBeginnerMode;

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [topic, setTopic] = useState<string>('All');
  const [tab, setTab] = useState('all');
  const [sortBy, setSortBy] = useState<string>('Default');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<PracticeProblemDocument | null>(null);
  const [staticProblems, setStaticProblems] = useState<PracticeProblemDocument[]>(() => enrichAllProblems());

  const { problems: fbProblems, loading: problemsLoading, usingFallback } = usePracticeProblems();
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
    return Object.entries(progress)
      .filter(([, p]) => p.solved)
      .map(([id]) => id);
  }, [progress]);

  const bookmarkedIds = useMemo(() => {
    if (!progress) return [];
    return Object.entries(progress)
      .filter(([, p]) => p.bookmarked)
      .map(([id]) => id);
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

  const categoryList = useMemo(() => {
    return ['All', ...new Set(problems.map(p => p.category).filter(Boolean))];
  }, [problems]);

  const filteredProblems = useMemo(() => {
    let filtered = problems;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.topics?.some(t => t.toLowerCase().includes(q)) ||
        p.category?.toLowerCase().includes(q),
      );
    }

    if (difficulty !== 'All') {
      filtered = filtered.filter(p => p.difficulty === difficulty);
    }

    if (topic !== 'All') {
      filtered = filtered.filter(p =>
        p.topics?.includes(topic as ProblemTopic) || p.category === topic,
      );
    }

    if (isBeginner && difficulty === 'All') {
      filtered = filtered.filter(p => canAccess(p.difficulty));
    }

    filtered = filtered.filter(p => {
      const isSolved = !!progress[p.id]?.solved;
      switch (tab) {
        case 'solved': return isSolved;
        case 'unsolved': return !isSolved;
        case 'bookmarked': return !!progress[p.id]?.bookmarked;
        default: return true;
      }
    });

    switch (sortBy) {
      case 'XP (Low)': filtered.sort((a, b) => a.points - b.points); break;
      case 'XP (High)': filtered.sort((a, b) => b.points - a.points); break;
      case 'Acceptance': filtered.sort((a, b) => (b.acceptanceRate || 0) - (a.acceptanceRate || 0)); break;
      case 'Difficulty': {
        const order = { Easy: 0, Medium: 1, Hard: 2 };
        filtered.sort((a, b) => (order[a.difficulty] || 0) - (order[b.difficulty] || 0));
        break;
      }
    }

    return filtered;
  }, [problems, search, difficulty, topic, tab, sortBy, progress, isBeginner, canAccess]);

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
    const pool = isBeginner
      ? unsolved.filter(p => canAccess(p.difficulty))
      : unsolved;
    if (pool.length === 0) {
      const allPool = isBeginner
        ? problems.filter(p => canAccess(p.difficulty))
        : problems;
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
    setTopic(topicName);
    setShowFilters(true);
  }, []);

  if (selectedProblem) {
    return (
      <Shell>
        <PracticeWorkbench
          problem={selectedProblem}
          onBack={() => setSelectedProblem(null)}
          userId={user?.uid || null}
          username={username}
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
        achievements={newAchievements as any}
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleRandomProblem}
              className="gap-1.5 text-xs"
            >
              <Shuffle className="w-3.5 h-3.5" /> Random
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5 text-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </Button>
            {totalProblemsCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">
                  {Math.round((totalSolved / totalProblemsCount) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Dashboard */}
        <StatsDashboard
          totalSolved={totalSolved}
          totalProblems={totalProblemsCount}
          easySolved={easyCount}
          mediumSolved={mediumCount}
          hardSolved={hardCount}
          currentStreak={stats?.currentStreak || 0}
          totalXp={stats?.totalXpEarned || state.beginner.xp || 0}
          accuracy={accuracy}
          loading={statsLoading && problemsLoading}
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

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card className="bg-card/50 border-primary/20 border overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {weakTopics.length > 0 ? 'Focus Areas - Recommended' : 'Recommended for You'}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {recommendations.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleStartProblem(p)}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-bold hover:border-primary/50 transition-colors whitespace-nowrap"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Topic Mastery */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Topic Mastery
            </span>
          </div>
          <TopicMasteryGrid topics={topicMastery} loading={loading} onTopicClick={handleTopicClick} />
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading problems...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Recently Viewed + Bookmarks */}
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

            {/* Filters & Tabs */}
            <Tabs defaultValue="all" className="space-y-4" onValueChange={setTab}>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unsolved">Unsolved</TabsTrigger>
                  <TabsTrigger value="solved">Solved</TabsTrigger>
                  <TabsTrigger value="bookmarked">
                    <BookmarkCheck className="w-3 h-3 mr-1" />
                    Saved
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:max-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search problems..."
                      className="pl-8 h-8 text-xs bg-muted/50 border-border"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16">Difficulty</span>
                    {DIFFICULTIES.map((d) => {
                      const locked = isBeginner && d !== 'All' && d !== 'Easy' && !unlockedDifficulties.includes(d as Difficulty);
                      return (
                        <Button
                          key={d}
                          variant={difficulty === d ? 'default' : 'outline'}
                          size="sm"
                          disabled={locked}
                          onClick={() => setDifficulty(d)}
                          className="text-xs font-bold uppercase tracking-widest h-7"
                        >
                          {locked && <Lock className="w-3 h-3 mr-1" />}
                          {d}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16">Topic</span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {ALL_TOPICS.map(t => (
                        <button
                          key={t}
                          onClick={() => setTopic(topic === t ? 'All' : t)}
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap',
                            topic === t
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-border',
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {topic !== 'All' && (
                      <Button variant="ghost" size="sm" onClick={() => setTopic('All')} className="text-[10px] h-6">
                        <X className="w-3 h-3 mr-1" /> Clear
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16">Sort</span>
                    {SORT_OPTIONS.map(s => (
                      <Button
                        key={s}
                        variant={sortBy === s ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setSortBy(s)}
                        className="text-xs h-7"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <TabsContent value={tab} className="mt-0 space-y-3">
                {filteredProblems.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''}
                      </span>
                      {search && (
                        <span className="text-[10px] text-muted-foreground">
                          Searching: &ldquo;{search}&rdquo;
                        </span>
                      )}
                    </div>
                    {filteredProblems.map((problem: PracticeProblemDocument) => (
                      <ProblemCard
                        key={problem.id}
                        problem={problem}
                        solved={!!progress[problem.id]?.solved}
                        bookmarked={!!progress[problem.id]?.bookmarked}
                        locked={isBeginner && !canAccess(problem.difficulty)}
                        onSelect={() => {
                          if (isBeginner && !canAccess(problem.difficulty)) return;
                          handleStartProblem(problem);
                        }}
                      />
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-bold">No Matching Problems</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search ? 'Try a different search query.' : 'Try adjusting your filters.'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-1.5"
                      onClick={() => { setSearch(''); setDifficulty('All'); setTopic('All'); setTab('all'); }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Shell>
  );
}

function ProblemCard({ problem, solved, bookmarked, locked, onSelect }: {
  problem: PracticeProblemDocument;
  solved: boolean;
  bookmarked: boolean;
  locked: boolean;
  onSelect: () => void;
}) {
  const difficultyColors: Record<string, string> = {
    Easy: 'text-emerald-400',
    Medium: 'text-yellow-400',
    Hard: 'text-destructive',
  };
  const difficultyBg: Record<string, string> = {
    Easy: 'bg-emerald-500/10',
    Medium: 'bg-yellow-500/10',
    Hard: 'bg-destructive/10',
  };
  const difficultyColor = difficultyColors[problem.difficulty] || 'text-muted-foreground';
  const diffBg = difficultyBg[problem.difficulty] || 'bg-muted';

  return (
    <div
      onClick={locked ? undefined : onSelect}
      className={cn(
        'cursor-pointer transition-all',
        locked && 'opacity-40 cursor-not-allowed',
      )}
    >
      <Card className="bg-card/50 border-border hover:border-primary/30 transition-all group">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 relative',
                solved ? 'bg-emerald-500/10' : diffBg,
              )}>
                {locked ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : solved ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Code2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {problem.title}
                  </h3>
                  {bookmarked && <BookmarkCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={cn('text-[10px] font-bold uppercase tracking-widest', difficultyColor)}>
                    {problem.difficulty}
                  </span>
                  {problem.category && (
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-muted/30">
                      {problem.category}
                    </Badge>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {problem.points}
                  </span>
                  {problem.acceptanceRate && (
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {(problem.acceptanceRate > 0 ? '' : '')}
                    </span>
                  )}
                  {problem.topics?.slice(0, 2).map(topic => (
                    <Badge key={topic} variant="secondary" className="text-[8px] uppercase tracking-widest hidden sm:inline-flex">
                      {topic}
                    </Badge>
                  ))}
                  {problem.estimatedTime && (
                    <span className="text-[9px] text-muted-foreground hidden lg:inline">
                      ~{problem.estimatedTime}m
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!locked && (
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-4" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
