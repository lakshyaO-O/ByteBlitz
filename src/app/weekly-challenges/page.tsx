'use client';

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Target, Flame, Trophy, Timer, Users, ChevronRight, Lock,
  CheckCircle2, Zap, Sparkles, Medal, ArrowUp, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const mockChallenges = [
  {
    id: 'current', title: 'Array Mastery Week', description: 'Solve 5 array-based challenges to earn bonus XP.',
    difficulty: 'Medium', xpReward: 500, daysRemaining: 3, participants: 1240,
    isActive: true, progress: 2, total: 5,
  },
  {
    id: '2', title: 'String Theory', description: 'String manipulation challenges to level up your skills.',
    difficulty: 'Easy', xpReward: 300, daysRemaining: 0, participants: 980,
    isActive: false, progress: 5, total: 5,
  },
  {
    id: '3', title: 'Dynamic Programming Deep Dive', description: 'Master DP with 5 progressively harder problems.',
    difficulty: 'Hard', xpReward: 800, daysRemaining: 0, participants: 560,
    isActive: false, progress: 0, total: 5,
  },
  {
    id: '4', title: 'Graph Algorithms', description: 'Navigate through graph theory challenges.',
    difficulty: 'Advanced', xpReward: 700, daysRemaining: 0, participants: 420,
    isActive: false, progress: 2, total: 5,
  },
  {
    id: '5', title: 'Sorting Sprint', description: 'Implement and optimize sorting algorithms.',
    difficulty: 'Easy', xpReward: 250, daysRemaining: 0, participants: 1500,
    isActive: false, progress: 5, total: 5,
  },
  {
    id: '6', title: 'Recursion Revolution', description: 'Think recursively with these mind-bending challenges.',
    difficulty: 'Medium', xpReward: 400, daysRemaining: 0, participants: 780,
    isActive: false, progress: 3, total: 5,
  },
];

const leaderboardData = [
  { rank: 1, username: 'alice_dev', xp: 2450, solved: 5 },
  { rank: 2, username: 'bob_codes', xp: 2100, solved: 5 },
  { rank: 3, username: 'charlie', xp: 1800, solved: 4 },
  { rank: 4, username: 'diana', xp: 1500, solved: 4 },
  { rank: 5, username: 'eve_style', xp: 1200, solved: 3 },
];

export default function WeeklyChallengesPage() {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const current = mockChallenges.find(c => c.isActive);

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            WEEKLY <span className="text-primary neon-text">CHALLENGES</span>
          </h1>
          <p className="text-muted-foreground">Compete in weekly challenges, earn XP, and climb the leaderboard.</p>
        </div>

        {current && (
          <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Flame className="w-6 h-6 text-orange-400" />
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] uppercase tracking-widest">
                      Active Challenge
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-emerald-400 border-emerald-400/30">
                      {current.difficulty}
                    </Badge>
                  </div>
                  <h2 className="text-3xl font-headline font-bold">{current.title}</h2>
                  <p className="text-muted-foreground max-w-xl">{current.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-primary" /> {current.xpReward} XP</span>
                    <span className="flex items-center gap-1"><Timer className="w-4 h-4" /> {current.daysRemaining} days remaining</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {current.participants.toLocaleString()} participants</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Your Progress</span>
                      <span>{current.progress}/{current.total}</span>
                    </div>
                    <Progress value={(current.progress / current.total) * 100} className="h-2 w-64 max-w-full" />
                  </div>
                </div>
                <Button size="lg" className="gap-2 shrink-0">Continue Challenge <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-headline font-bold">All Challenges</h2>
            <div className="space-y-3">
              {mockChallenges.map((challenge, i) => (
                <motion.div key={challenge.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={cn(
                    'bg-card/50 border-border hover:border-primary/30 transition-all cursor-pointer',
                    challenge.isActive && 'border-primary/30 bg-primary/5',
                  )}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                            challenge.progress === challenge.total ? 'bg-emerald-500/10' :
                            challenge.isActive ? 'bg-primary/10' : 'bg-muted/30',
                          )}>
                            {challenge.progress === challenge.total ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            ) : challenge.isActive ? (
                              <Target className="w-6 h-6 text-primary" />
                            ) : (
                              <Lock className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold truncate">{challenge.title}</h3>
                              <Badge variant="outline" className={cn(
                                'text-[9px] uppercase tracking-widest',
                                challenge.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-400/30' :
                                challenge.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-400/30' :
                                challenge.difficulty === 'Hard' ? 'text-destructive border-destructive/30' :
                                'text-purple-400 border-purple-400/30'
                              )}>{challenge.difficulty}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {challenge.xpReward} XP</span>
                              {challenge.daysRemaining > 0 && (
                                <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {challenge.daysRemaining}d left</span>
                              )}
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {challenge.participants}</span>
                            </div>
                            {challenge.total > 0 && (
                              <div className="mt-2 max-w-xs">
                                <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                                  <span>{challenge.progress}/{challenge.total}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div className={cn(
                                    'h-full rounded-full',
                                    challenge.progress === challenge.total ? 'bg-emerald-400' : 'bg-primary'
                                  )} style={{ width: `${(challenge.progress / challenge.total) * 100}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-4" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-5">
                <h3 className="text-sm font-headline font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-yellow-400" /> Leaderboard
                </h3>
                <div className="space-y-3">
                  {leaderboardData.map((entry) => (
                    <div key={entry.rank} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                          entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                          entry.rank === 2 ? 'bg-gray-300/20 text-gray-300' :
                          entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-muted text-muted-foreground'
                        )}>{entry.rank}</span>
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{entry.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold">{entry.username}</p>
                          <p className="text-[10px] text-muted-foreground">{entry.solved}/5 solved</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary">{entry.xp} XP</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-5 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-primary mx-auto" />
                <p className="text-sm font-bold">Complete all 5 challenges</p>
                <p className="text-xs text-muted-foreground">to earn the weekly badge and bonus XP!</p>
                <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-primary/30 text-primary">
                  <Star className="w-3 h-3 mr-1" /> Weekly Warrior Badge
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
