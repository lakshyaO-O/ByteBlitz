'use client';

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState } from '@/components/premium/EmptyState';
import {
  Search,
  Code2,
  Brain,
  ChevronRight,
  CheckCircle2,
  Clock,
  Loader2,
  BookOpen,
  Filter,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { GuestGate } from '@/components/auth/GuestGate';

export default function PracticePage() {
  const db = useFirestore();

  const problemsQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'problems'), orderBy('points', 'asc'));
  }, [db]);

  const { data: problems, loading } = useCollection(problemsQuery);

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [category, setCategory] = useState<string>('All');
  const [tab, setTab] = useState('all');

  const categories = problems
    ? ['All', ...new Set(problems.map((p: any) => p.category).filter(Boolean))]
    : ['All'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const filteredProblems = (problems || []).filter((p: any) => {
    const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficulty === 'All' || p.difficulty === difficulty;
    const matchesCategory = category === 'All' || p.category === category;
    const matchesTab =
      tab === 'all' ? true :
      tab === 'solved' ? p.solved :
      tab === 'unsolved' ? !p.solved : true;
    return matchesSearch && matchesDifficulty && matchesCategory && matchesTab;
  });

  const solvedCount = (problems || []).filter((p: any) => p.solved).length;

  if (loading) {
    return (
      <Shell>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-card/50 border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                    <Skeleton className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              PRACTICE <span className="text-primary neon-text">ZONE</span>
            </h1>
            <p className="text-muted-foreground">
              Sharpen your skills with curated coding challenges.
              {problems && problems.length > 0 && ` ${solvedCount}/${problems.length} solved.`}
            </p>
          </div>
          {problems && problems.length > 0 && (
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

        {!problems || problems.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Problems Available"
            description="Check back later for new coding challenges to sharpen your skills."
          />
        ) : (
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

            <TabsContent value={tab} className="mt-0">
              <div className="grid gap-4">
                {filteredProblems.length > 0 ? (
                  filteredProblems.map((problem: any) => (
                    <ProblemCard key={problem.id} problem={problem} />
                  ))
                ) : (
                  <EmptyState
                    icon={Filter}
                    title="No Matching Problems"
                    description="Try adjusting your filters or search query."
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Shell>
  );
}

function ProblemCard({ problem }: { problem: any }) {
  const difficultyColors: Record<string, string> = {
    Easy: 'text-emerald-400',
    Medium: 'text-yellow-400',
    Hard: 'text-destructive',
  };
  const difficultyColor = difficultyColors[problem.difficulty as string] || 'text-muted-foreground';

  return (
    <GuestGate feature="Start Practice Session" redirectPath="/practice">
      <Link href="/arena">
        <Card className="bg-card/50 border-border hover:border-primary/30 transition-all group cursor-pointer">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                problem.solved ? 'bg-emerald-500/10' : 'bg-muted'
              )}>
                {problem.solved ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Code2 className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                  {problem.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {problem.category && (
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-muted/50">
                      {problem.category}
                    </Badge>
                  )}
                  <span className={cn('text-[10px] font-bold uppercase tracking-widest', difficultyColor)}>
                    {problem.difficulty}
                  </span>
                  {problem.points && (
                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {problem.points} pts
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-4" />
          </CardContent>
        </Card>
      </Link>
    </GuestGate>
  );
}
