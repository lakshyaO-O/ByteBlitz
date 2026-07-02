'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { PracticeWorkbench } from '@/components/practice/PracticeWorkbench';
import { usePracticeProblems, useUserProgress, useRecentlyViewed } from '@/hooks/use-practice-problems';
import type { PracticeProblemDocument } from '@/types';

export default function PracticePage() {
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [category, setCategory] = useState<string>('All');
  const [tab, setTab] = useState('all');
  const [selectedProblem, setSelectedProblem] = useState<PracticeProblemDocument | null>(null);

  const { problems, loading: problemsLoading } = usePracticeProblems();
  const { progress, loading: progressLoading } = useUserProgress(user?.uid || null);
  const { recent: recentlyViewed } = useRecentlyViewed(user?.uid || null);

  const username = user?.displayName || user?.email?.split('@')[0] || 'Player';

  const categories = useMemo(() => {
    if (!problems) return ['All'];
    return ['All', ...new Set(problems.map(p => p.category).filter(Boolean))];
  }, [problems]);

  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const filteredProblems = useMemo(() => {
    if (!problems) return [];
    return problems.filter((p) => {
      const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase());
      const matchesDifficulty = difficulty === 'All' || p.difficulty === difficulty;
      const matchesCategory = category === 'All' || p.category === category;
      const isSolved = progress[p.id]?.solved;
      const matchesTab =
        tab === 'all' ? true :
        tab === 'solved' ? isSolved :
        tab === 'unsolved' ? !isSolved : true;
      return matchesSearch && matchesDifficulty && matchesCategory && matchesTab;
    });
  }, [problems, search, difficulty, category, tab, progress]);

  const solvedCount = problems.filter(p => progress[p.id]?.solved).length;
  const bookmarkedProblems = problems.filter(p => progress[p.id]?.bookmarked);

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

  const loading = problemsLoading || progressLoading;

  return (
    <Shell>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              PRACTICE <span className="text-primary neon-text">ZONE</span>
            </h1>
            <p className="text-muted-foreground">
              Sharpen your skills with curated coding challenges.
              {problems.length > 0 && ` ${solvedCount}/${problems.length} solved.`}
            </p>
          </div>
          {problems.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">
                  {Math.round((solvedCount / problems.length) * 100)}% Complete
                </span>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {recentlyViewed.length > 0 && (
              <Card className="bg-card/50 border-border overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recently Viewed</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {recentlyViewed.map((r: any) => (
                      <button
                        key={r.problemId}
                        onClick={() => {
                          const p = problems.find(pr => pr.id === r.problemId);
                          if (p) setSelectedProblem(p);
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

            {bookmarkedProblems.length > 0 && (
              <Card className="bg-card/50 border-primary/20 border overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookmarkCheck className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Bookmarked</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {bookmarkedProblems.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProblem(p)}
                        className="shrink-0 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-bold hover:border-primary/50 transition-colors whitespace-nowrap"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="all" className="space-y-6" onValueChange={setTab}>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unsolved">Unsolved</TabsTrigger>
                  <TabsTrigger value="solved">Solved</TabsTrigger>
                </TabsList>

                <div className="relative flex-1 max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search problems..."
                    className="pl-10 bg-muted/50 border-border"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {difficulties.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    {difficulties.map((d) => (
                      <Button
                        key={d}
                        variant={difficulty === d ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDifficulty(d)}
                        className="text-xs font-bold uppercase tracking-widest"
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                )}
                {categories.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        variant={category === cat ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setCategory(cat)}
                        className="text-xs font-bold uppercase tracking-widest"
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <TabsContent value={tab} className="mt-0 space-y-4">
                {filteredProblems.length > 0 ? (
                  filteredProblems.map((problem: PracticeProblemDocument) => (
                    <ProblemCard
                      key={problem.id}
                      problem={problem}
                      solved={!!progress[problem.id]?.solved}
                      bookmarked={!!progress[problem.id]?.bookmarked}
                      onSelect={() => setSelectedProblem(problem)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-bold">No Matching Problems</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
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

function ProblemCard({ problem, solved, bookmarked, onSelect }: {
  problem: PracticeProblemDocument;
  solved: boolean;
  bookmarked: boolean;
  onSelect: () => void;
}) {
  const difficultyColors: Record<string, string> = {
    Easy: 'text-emerald-400',
    Medium: 'text-yellow-400',
    Hard: 'text-destructive',
  };
  const difficultyColor = difficultyColors[problem.difficulty] || 'text-muted-foreground';

  return (
    <div onClick={onSelect} className="cursor-pointer">
      <Card className="bg-card/50 border-border hover:border-primary/30 transition-all group">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 relative',
                solved ? 'bg-emerald-500/10' : 'bg-muted',
              )}>
                {solved
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  : <Code2 className="w-5 h-5 text-muted-foreground" />
                }
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {problem.title}
                  </h3>
                  {bookmarked && <BookmarkCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {problem.category && (
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-muted/50">
                      {problem.category}
                    </Badge>
                  )}
                  <span className={cn('text-[10px] font-bold uppercase tracking-widest', difficultyColor)}>
                    {problem.difficulty}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {problem.points} pts
                  </span>
                  {problem.topics?.slice(0, 2).map(topic => (
                    <Badge key={topic} variant="secondary" className="text-[9px] uppercase tracking-widest hidden sm:inline-flex">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
