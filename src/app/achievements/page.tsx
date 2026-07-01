'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Medal, Trophy, Zap, Target, Flame, Star, Shield, Crown, Swords,
  Brain, Code2, Loader2, CheckCircle2, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useAppStore } from '@/store/app-store';

const XP_PER_LEVEL = 500;

const ACHIEVEMENTS = [
  { id: 'first-blood', title: 'First Blood', description: 'Win your first battle', icon: Trophy, requirement: '1 Win' },
  { id: 'ten-wins', title: 'Decimation', description: 'Win 10 battles', icon: Swords, requirement: '10 Wins' },
  { id: 'fifty-wins', title: 'War Machine', description: 'Win 50 battles', icon: Shield, requirement: '50 Wins' },
  { id: 'elite-rating', title: 'Elite', description: 'Reach 1500 ELO', icon: Star, requirement: '1500 ELO' },
  { id: 'master-rating', title: 'Master', description: 'Reach 2000 ELO', icon: Crown, requirement: '2000 ELO' },
  { id: 'level-5', title: 'Seasoned', description: 'Reach level 5', icon: Zap, requirement: 'Level 5' },
  { id: 'level-10', title: 'Veteran', description: 'Reach level 10', icon: Zap, requirement: 'Level 10' },
  { id: 'practice-master', title: 'Scholar', description: 'Solve 25 practice problems', icon: Brain, requirement: '25 Problems' },
  { id: 'code-wizard', title: 'Code Wizard', description: 'Solve 100 practice problems', icon: Code2, requirement: '100 Problems' },
  { id: 'streak-7', title: 'Consistent', description: 'Maintain a 7-day streak', icon: Flame, requirement: '7 Day Streak' },
  { id: 'streak-30', title: 'Unstoppable', description: 'Maintain a 30-day streak', icon: Flame, requirement: '30 Day Streak' },
  { id: 'contestant', title: 'Contestant', description: 'Participate in your first contest', icon: Trophy, requirement: '1 Contest' },
];

export default function AchievementsPage() {
  const { user, loading: authLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc(user ? `users/${user.uid}` : null);
  const { state } = useAppStore();
  const { beginner, firebaseProgressLoaded } = state;

  if (authLoading || profileLoading || !firebaseProgressLoaded) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const arenaWins = profile?.wins ?? 0;
  const arenaRating = profile?.rating ?? 1200;
  const level = Math.floor(beginner.xp / XP_PER_LEVEL) + 1;

  const isAchieved = (achievement: typeof ACHIEVEMENTS[number]) => {
    switch (achievement.id) {
      case 'first-blood': return arenaWins >= 1;
      case 'ten-wins': return arenaWins >= 10;
      case 'fifty-wins': return arenaWins >= 50;
      case 'elite-rating': return arenaRating >= 1500;
      case 'master-rating': return arenaRating >= 2000;
      case 'level-5': return level >= 5;
      case 'level-10': return level >= 10;
      case 'practice-master': return beginner.problemsSolved >= 25;
      case 'code-wizard': return beginner.problemsSolved >= 100;
      case 'streak-7': return beginner.streak >= 7;
      case 'streak-30': return beginner.streak >= 30;
      case 'contestant': return (profile?.contestsEntered ?? 0) >= 1;
      default: return false;
    }
  };

  const achievedCount = ACHIEVEMENTS.filter(a => isAchieved(a)).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            ACHIEVEMENTS
          </h1>
          <p className="text-muted-foreground">Unlock achievements by reaching milestones across learning, arena, and practice.</p>
        </div>
        <Badge className="text-sm px-4 py-2 bg-primary/10 text-primary border-primary/30">
          {achievedCount} / {ACHIEVEMENTS.length} Unlocked
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ACHIEVEMENTS.map((achievement) => {
          const achieved = isAchieved(achievement);
          return (
            <Card key={achievement.id} className={cn(
              'border-border transition-all group',
              achieved ? 'bg-card/50 border-secondary/30' : 'bg-card/30 opacity-60'
            )}>
              <CardContent className="p-6 text-center space-y-3">
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center mx-auto transition-all',
                  achieved ? 'bg-secondary/10 border-2 border-secondary' : 'bg-muted border-2 border-border'
                )}>
                  <achievement.icon className={cn(
                    'w-7 h-7',
                    achieved ? 'text-secondary' : 'text-muted-foreground'
                  )} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{achievement.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                </div>
                <div className="flex items-center justify-center gap-1">
                  {achieved ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-widest',
                    achieved ? 'text-emerald-400' : 'text-muted-foreground'
                  )}>
                    {achieved ? 'Unlocked' : achievement.requirement}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
