
'use client';
import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Brain,
  Code2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function ProblemsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const db = useFirestore();

  const problemsQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'problems'), orderBy('title', 'asc'));
  }, [db]);

  const { data: problems, loading } = useCollection(problemsQuery);

  const filteredProblems = (problems || []).filter((p: any) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.difficulty === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              PRACTICE <span className="text-primary neon-text">ZONE</span>
            </h1>
            <p className="text-muted-foreground">Level up your logic before entering the rated combat arena.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DifficultyCard label="Easy" color="text-emerald-400" bgColor="bg-emerald-500/10" />
          <DifficultyCard label="Medium" color="text-primary" bgColor="bg-primary/10" />
          <DifficultyCard label="Hard" color="text-destructive" bgColor="bg-destructive/10" />
        </div>

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

        <Card className="bg-card/50 border-border overflow-hidden">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="p-4">Problem</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Difficulty</th>
                    <th className="p-4 text-center">Points</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProblems.map((problem: any) => (
                    <tr key={problem.id} className="group hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">{problem.title}</span>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">ARCHIVE-ID: {problem.id}</span>
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
              {filteredProblems.length === 0 && (
                <div className="p-12 text-center space-y-4">
                  <Code2 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest">No matching archives found.</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}

function DifficultyCard({ label, color, bgColor }: { label: string; color: string; bgColor: string }) {
  return (
    <Card className="bg-card/50 border-border relative overflow-hidden group">
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", bgColor, color)}>
            {label}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-2xl font-headline font-black text-foreground">
             <Brain className={cn("w-6 h-6", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
