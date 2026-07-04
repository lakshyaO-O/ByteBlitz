'use client';

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Target, Flame, BookOpen, Swords, Brain, Zap, Star, Coins,
  CheckCircle2, Clock, Gift, Trophy, Sparkles, Loader2,
  Code2, Users, Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const categories = [
  { id: 'practice', label: 'Practice', icon: Code2, color: 'text-blue-400' },
  { id: 'arena', label: 'Arena', icon: Swords, color: 'text-red-400' },
  { id: 'learning', label: 'Learning', icon: BookOpen, color: 'text-emerald-400' },
  { id: 'social', label: 'Social', icon: Users, color: 'text-purple-400' },
  { id: 'streak', label: 'Streak', icon: Flame, color: 'text-orange-400' },
];

const mockMissions = [
  { id: '1', title: 'Solve 3 Practice Problems', description: 'Complete any 3 practice problems today.', category: 'practice', progress: 2, total: 3, xpReward: 100, coinReward: 20, difficulty: 'Easy', completed: false },
  { id: '2', title: 'Win an Arena Match', description: 'Win 1 arena match against any opponent.', category: 'arena', progress: 1, total: 1, xpReward: 200, coinReward: 50, difficulty: 'Medium', completed: true },
  { id: '3', title: 'Complete a Lesson', description: 'Finish any learning lesson in the roadmap.', category: 'learning', progress: 0, total: 1, xpReward: 150, coinReward: 30, difficulty: 'Easy', completed: false },
  { id: '4', title: 'Share Code with a Friend', description: 'Share a code snippet with another user.', category: 'social', progress: 0, total: 1, xpReward: 80, coinReward: 15, difficulty: 'Easy', completed: false },
  { id: '5', title: '3-Day Streak', description: 'Maintain a 3-day login streak.', category: 'streak', progress: 2, total: 3, xpReward: 300, coinReward: 75, difficulty: 'Medium', completed: false },
  { id: '6', title: 'Solve 5 Problems in a Row', description: 'Solve 5 practice problems without leaving the page.', category: 'practice', progress: 3, total: 5, xpReward: 400, coinReward: 100, difficulty: 'Hard', completed: false },
  { id: '7', title: 'Win 3 Arena Matches', description: 'Win 3 arena matches in one day.', category: 'arena', progress: 1, total: 3, xpReward: 500, coinReward: 120, difficulty: 'Hard', completed: false },
  { id: '8', title: 'Read a Lesson', description: 'Read any lesson for at least 5 minutes.', category: 'learning', progress: 1, total: 1, xpReward: 60, coinReward: 10, difficulty: 'Easy', completed: true },
];

export default function MissionsPage() {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? mockMissions : mockMissions.filter(m => m.category === filter);
  const streak = 7;
  const longestStreak = 14;

  return (
    <Shell>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold text-foreground">
            Missions
          </h1>
          <p className="text-muted-foreground">Complete missions to earn XP, coins, and build your streak.</p>
        </div>

        <Card className="relative overflow-hidden border-primary/30 bg-primary/10">

          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                  <Flame className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-headline font-bold">{streak} Day Streak</h2>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[11px] uppercase tracking-wider">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Best streak: {longestStreak} days</p>
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                        i < streak % 7 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        i === streak % 7 ? 'bg-muted/30 text-muted-foreground border border-dashed border-border' :
                        'bg-muted/10 text-muted-foreground/30'
                      )}>
                        {i < streak % 7 ? <Flame className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-headline font-bold text-orange-400">🔥</p>
                <p className="text-xs text-muted-foreground mt-1">Keep going!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            key="All"
            variant={filter === 'All' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('All')}
            className="text-xs font-bold uppercase tracking-widest"
          >All</Button>
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.id}
                variant={filter === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(cat.id)}
                className="text-xs font-bold uppercase tracking-widest gap-1.5"
              >
                <Icon className="w-3 h-3" /> {cat.label}
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((mission, i) => {
            const cat = categories.find(c => c.id === mission.category);
            const Icon = cat?.icon || Target;
            const isComplete = mission.completed || mission.progress >= mission.total;

            return (
              <motion.div key={mission.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={cn(
                  'bg-card/50 border-border hover:border-primary/30 transition-all h-full',
                  isComplete && 'border-emerald-500/30 bg-emerald-500/5'
                )}>
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isComplete ? 'bg-emerald-500/10' : 'bg-muted/30')}>
                        <Icon className={cn('w-5 h-5', isComplete ? 'text-emerald-400' : cat?.color)} />
                      </div>
                      <Badge variant="outline" className={cn(
                        'text-[9px] uppercase tracking-widest',
                        mission.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-400/30' :
                        mission.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-400/30' :
                        'text-destructive border-destructive/30'
                      )}>{mission.difficulty}</Badge>
                    </div>
                    <h3 className="font-headline font-bold group-hover:text-primary transition-colors">{mission.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex-1">{mission.description}</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{mission.progress}/{mission.total}</span>
                      </div>
                      <Progress value={(mission.progress / mission.total) * 100} className={cn('h-1.5', isComplete && 'bg-emerald-500/20')} />
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> {mission.xpReward}</span>
                        <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-400" /> {mission.coinReward}</span>
                      </div>
                      {isComplete ? (
                        <Button size="sm" className="gap-1.5 text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Claim Reward
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="text-xs" disabled={mission.progress === 0}>
                          {mission.progress > 0 ? 'Continue' : 'Start'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
