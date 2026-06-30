'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Zap, Flame, Timer, Trophy, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAILY_CHALLENGE = {
  title: 'Array Product Except Self',
  difficulty: 'Medium',
  points: 50,
  timeLimit: '30 min',
  completions: 342,
  description: 'Given an array of integers, return an array where each element is the product of all elements except itself.',
};

const WEEKLY_CHALLENGES = [
  { title: 'LRU Cache Implementation', difficulty: 'Hard', points: 100, progress: 0, completed: false },
  { title: 'Graph Traversal Suite', difficulty: 'Hard', points: 100, progress: 2, completed: false, total: 4 },
  { title: 'Dynamic Programming Pack', difficulty: 'Medium', points: 75, progress: 1, completed: false, total: 5 },
  { title: 'String Algorithms', difficulty: 'Medium', points: 75, progress: 0, completed: true, total: 3 },
];

export default function ChallengesPage() {
  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            DAILY & WEEKLY <span className="text-primary neon-text">CHALLENGES</span>
          </h1>
          <p className="text-muted-foreground">Complete challenges to earn bonus XP and climb the leaderboard.</p>
        </div>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 neon-border">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Flame className="w-6 h-6 text-orange-400" />
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] uppercase tracking-widest">
                    Daily Challenge
                  </Badge>
                </div>
                <h2 className="text-2xl font-headline font-bold">{DAILY_CHALLENGE.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className={cn(
                    'font-bold uppercase tracking-widest text-xs',
                    DAILY_CHALLENGE.difficulty === 'Easy' ? 'text-emerald-400' : 
                    DAILY_CHALLENGE.difficulty === 'Medium' ? 'text-yellow-400' : 'text-destructive'
                  )}>
                    {DAILY_CHALLENGE.difficulty}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" /> {DAILY_CHALLENGE.points} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" /> {DAILY_CHALLENGE.timeLimit}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" /> {DAILY_CHALLENGE.completions} completed
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{DAILY_CHALLENGE.description}</p>
              </div>
              <Button size="lg" className="shrink-0 gap-2">
                Solve Challenge <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-headline font-bold mb-6">Weekly Challenges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WEEKLY_CHALLENGES.map((challenge) => (
              <Card key={challenge.title} className={cn(
                'bg-card/50 border-border hover:border-primary/30 transition-all',
                challenge.completed && 'border-emerald-500/30 bg-emerald-500/5'
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-bold">{challenge.title}</h3>
                      <Badge variant="outline" className={cn(
                        'text-[10px] uppercase tracking-widest',
                        challenge.difficulty === 'Hard' ? 'text-destructive border-destructive/30' : 'text-yellow-400 border-yellow-400/30'
                      )}>
                        {challenge.difficulty}
                      </Badge>
                    </div>
                    {challenge.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{challenge.points} XP</span>
                    {challenge.total && (
                      <span className="text-muted-foreground">{challenge.progress}/{challenge.total} parts</span>
                    )}
                  </div>
                  {challenge.total && (
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn(
                        'h-full rounded-full transition-all',
                        challenge.completed ? 'bg-emerald-400' : 'bg-primary'
                      )} style={{ width: `${(challenge.progress / challenge.total) * 100}%` }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
