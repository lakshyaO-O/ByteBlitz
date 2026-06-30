'use client';

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

const MOCK_PROBLEMS = [
  { id: 'two-sum', title: 'Two Sum', category: 'Arrays', difficulty: 'Easy', points: 10, solved: true },
  { id: 'reverse-string', title: 'Reverse String', category: 'Strings', difficulty: 'Easy', points: 5, solved: false },
  { id: 'valid-parentheses', title: 'Valid Parentheses', category: 'Stacks', difficulty: 'Medium', points: 15, solved: false },
  { id: 'fizz-buzz', title: 'FizzBuzz', category: 'Logic', difficulty: 'Easy', points: 10, solved: true },
  { id: 'merge-sorted', title: 'Merge Sorted Arrays', category: 'Arrays', difficulty: 'Medium', points: 20, solved: false },
  { id: 'palindrome', title: 'Palindrome Check', category: 'Strings', difficulty: 'Easy', points: 10, solved: false },
  { id: 'binary-search', title: 'Binary Search', category: 'Search', difficulty: 'Medium', points: 20, solved: false },
  { id: 'linked-list-cycle', title: 'Linked List Cycle', category: 'Linked Lists', difficulty: 'Hard', points: 30, solved: false },
];

export default function PracticePage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [category, setCategory] = useState<string>('All');

  const categories = ['All', 'Arrays', 'Strings', 'Stacks', 'Logic', 'Search', 'Linked Lists'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const filteredProblems = MOCK_PROBLEMS.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficulty === 'All' || p.difficulty === difficulty;
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const solvedCount = MOCK_PROBLEMS.filter((p) => p.solved).length;

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              PRACTICE <span className="text-primary neon-text">ZONE</span>
            </h1>
            <p className="text-muted-foreground">
              Sharpen your skills with curated coding challenges. {solvedCount}/{MOCK_PROBLEMS.length} solved.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">
                {Math.round((solvedCount / MOCK_PROBLEMS.length) * 100)}% Complete
              </span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unsolved">Unsolved</TabsTrigger>
              <TabsTrigger value="solved">Solved</TabsTrigger>
            </TabsList>

            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search problems..."
                className="pl-10 bg-muted/50 border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat)}
                className="text-xs font-bold uppercase tracking-widest"
              >
                {cat}
              </Button>
            ))}
          </div>

          <TabsContent value="all" className="mt-0">
            <div className="grid gap-4">
              {filteredProblems.map((problem) => (
                <ProblemCard key={problem.id} problem={problem} />
              ))}
              {filteredProblems.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-bold uppercase tracking-widest text-sm">No problems match your filters</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="unsolved" className="mt-0">
            <div className="grid gap-4">
              {filteredProblems.filter((p) => !p.solved).map((problem) => (
                <ProblemCard key={problem.id} problem={problem} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="solved" className="mt-0">
            <div className="grid gap-4">
              {filteredProblems.filter((p) => p.solved).map((problem) => (
                <ProblemCard key={problem.id} problem={problem} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}

function ProblemCard({ problem }: { problem: { id: string; title: string; category: string; difficulty: string; points: number; solved: boolean } }) {
  const difficultyColor = {
    Easy: 'text-emerald-400',
    Medium: 'text-yellow-400',
    Hard: 'text-destructive',
  }[problem.difficulty] || 'text-muted-foreground';

  return (
    <Link href={`/arena`}>
      <Card className="bg-card/50 border-border hover:border-primary/30 transition-all group cursor-pointer">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              problem.solved ? 'bg-emerald-500/10' : 'bg-muted'
            )}>
              {problem.solved ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Code2 className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                {problem.title}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-muted/50">
                  {problem.category}
                </Badge>
                <span className={cn('text-[10px] font-bold uppercase tracking-widest', difficultyColor)}>
                  {problem.difficulty}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {problem.points} pts
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
}
