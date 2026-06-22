"use client"
import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  Lock, 
  ChevronRight, 
  Zap, 
  Trophy,
  Brain,
  Code2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const PROBLEMS = [
  { id: '1', title: 'Two Sum', difficulty: 'Easy', category: 'Arrays', solved: true, successRate: '98%', points: 10 },
  { id: '2', title: 'Add Two Numbers', difficulty: 'Medium', category: 'Linked Lists', solved: false, successRate: '85%', points: 25 },
  { id: '3', title: 'Longest Substring', difficulty: 'Medium', category: 'Sliding Window', solved: true, successRate: '72%', points: 30 },
  { id: '4', title: 'Median of Two Sorted Arrays', difficulty: 'Hard', category: 'Binary Search', solved: false, successRate: '41%', points: 100 },
  { id: '5', title: 'Container With Most Water', difficulty: 'Medium', category: 'Two Pointers', solved: false, successRate: '68%', points: 30 },
  { id: '6', title: 'String to Integer (atoi)', difficulty: 'Medium', category: 'Strings', solved: false, successRate: '55%', points: 25 },
  { id: '7', title: 'Reverse Nodes in k-Group', difficulty: 'Hard', category: 'Linked Lists', solved: false, successRate: '32%', points: 120 },
  { id: '8', title: 'Valid Parentheses', difficulty: 'Easy', category: 'Stacks', solved: true, successRate: '94%', points: 10 },
];

export default function ProblemsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  const filteredProblems = PROBLEMS.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.difficulty === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              PRACTICE <span className="text-primary neon-text">ZONE</span>
            </h1>
            <p className="text-muted-foreground">Level up your logic before entering the rated combat arena.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
            <div className="text-center px-4 border-r border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Solved</p>
              <p className="text-xl font-headline font-bold text-primary">42/150</p>
            </div>
            <div className="text-center px-4 border-r border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">XP Gained</p>
              <p className="text-xl font-headline font-bold text-foreground">4.5k</p>
            </div>
            <div className="text-center px-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Rank</p>
              <p className="text-xl font-headline font-bold text-secondary">#1248</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DifficultyCard label="Easy" count={12} total={50} color="text-emerald-400" bgColor="bg-emerald-500/10" />
          <DifficultyCard label="Medium" count={25} total={75} color="text-primary" bgColor="bg-primary/10" />
          <DifficultyCard label="Hard" count={5} total={25} color="text-destructive" bgColor="bg-destructive/10" />
        </div>

        {/* Search and Filter */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by problem name or category..." 
                className="pl-10 bg-muted/50 border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((level) => (
                <Button
                  key={level}
                  variant={filter === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(level)}
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest h-10 px-4",
                    filter === level ? "bg-primary text-background" : ""
                  )}
                >
                  {level}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Problems Table */}
        <Card className="bg-card/50 border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="p-4 w-12">Status</th>
                  <th className="p-4">Problem</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Difficulty</th>
                  <th className="p-4 text-center">Success Rate</th>
                  <th className="p-4 text-center">Points</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProblems.map((problem) => (
                  <tr key={problem.id} className="group hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className="p-4">
                      {problem.solved ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/30" />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">{problem.title}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">ID: PROB-0{problem.id}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-muted/50 border-border">
                        {problem.category}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-widest",
                        problem.difficulty === 'Easy' ? "text-emerald-400" :
                        problem.difficulty === 'Medium' ? "text-primary" : "text-destructive"
                      )}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="p-4 text-center text-sm font-mono text-muted-foreground">
                      {problem.successRate}
                    </td>
                    <td className="p-4 text-center font-headline font-bold text-foreground">
                      {problem.points}
                    </td>
                    <td className="p-4 text-right">
                      <Button asChild variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/arena`}>
                          SOLVE <ChevronRight className="ml-1 w-4 h-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProblems.length === 0 && (
            <div className="p-12 text-center space-y-4">
              <Code2 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest">No matching archives found in the databanks.</p>
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}

function DifficultyCard({ label, count, total, color, bgColor }: { label: string; count: number; total: number; color: string; bgColor: string }) {
  const percentage = Math.round((count / total) * 100);
  return (
    <Card className="bg-card/50 border-border relative overflow-hidden group">
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", bgColor, color)}>
            {label}
          </div>
          <span className="text-xs font-bold text-muted-foreground">{count}/{total} SOLVED</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-2xl font-headline font-black text-foreground">
            <span>{percentage}%</span>
            <Brain className={cn("w-6 h-6", color)} />
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full neon-glow transition-all duration-1000", color.replace('text', 'bg'))} 
              style={{ width: `${percentage}%` }} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
