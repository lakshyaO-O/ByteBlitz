'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap, Trophy, BookOpen, Target, Medal, Edit3, Loader2,
  Activity, Gift, Flame, Star, CheckCircle2, Sword, Sparkles,
  GraduationCap, Swords, TrendingUp,
} from 'lucide-react';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useAppStore } from '@/store/app-store';
import { DailyLoginRewards } from '@/components/gamification/DailyLoginRewards';
import { ShareAchievement } from '@/components/social/ShareAchievement';

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const { data: profile, loading: profileLoading } = useDoc(user ? `users/${user.uid}` : null);
  const { state } = useAppStore();
  const beginner = state?.beginner || { name: '', xp: 0, streak: 0, lessonsCompleted: [] };

  const loading = authLoading || profileLoading;

  const stats = profile || {};
  const tier = getTier(stats.rating || 1200);

  const initials = (stats.username || user?.displayName || user?.email || beginner.name || '?')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const winRate = (stats.wins + stats.losses) > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

  const lessonCount = beginner.lessonsCompleted.length;
  const currentLevel = Math.floor(beginner.xp / 500) + 1;
  const xpInLevel = beginner.xp % 500;
  const xpProgress = (xpInLevel / 500) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Profile Header */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 md:w-28 md:h-28 border-4 border-primary/30">
                  <AvatarImage src={user?.photoURL || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-secondary px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider text-white">
                  LVL {currentLevel}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-headline font-bold">
                    {beginner.name || stats.username || user?.displayName || 'Coder'}
                  </h1>
                  <Badge variant="outline" className={cn('text-[11px] uppercase tracking-wider', getTierColor(tier))}>
                    {tier}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {lessonCount} lessons done</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> {beginner.xp} XP</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {beginner.streak} day streak</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => router.push('/settings')}>
                    <Edit3 className="w-3 h-3" /> Edit Profile
                  </Button>
                  <ShareAchievement
                    title={`${beginner.name || stats.username || 'Player'} - DevRann Learner`}
                    description={`Level ${currentLevel} | ${beginner.xp} XP | ${lessonCount} Lessons | ${beginner.streak} Day Streak`}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Learning Progress */}
          <Card className="bg-card/50 border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" /> Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="learning">
                <TabsList className="grid grid-cols-3 gap-2 h-auto bg-muted/50 p-1 mb-4">
                  <TabsTrigger value="learning" className="text-xs"><BookOpen className="w-3 h-3" /> Lessons</TabsTrigger>
                  <TabsTrigger value="stats" className="text-xs"><Activity className="w-3 h-3" /> Stats</TabsTrigger>
                  <TabsTrigger value="rewards" className="text-xs"><Gift className="w-3 h-3" /> Rewards</TabsTrigger>
                </TabsList>

                <TabsContent value="learning">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Beginner Roadmap</span>
                        <span className="font-bold">{lessonCount}/16 lessons</span>
                      </div>
                      <Progress value={(lessonCount / 16) * 100} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatBox label="Lessons Done" value={lessonCount} color="text-primary" />
                      <StatBox label="XP Earned" value={beginner.xp} color="text-orange-400" />
                      <StatBox label="Current Level" value={currentLevel} color="text-secondary" />
                      <StatBox label="Day Streak" value={`${beginner.streak} 🔥`} color="text-orange-400" />
                    </div>

                    {/* XP Progress */}
                    <Card className="bg-muted/20 border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-muted-foreground">Level {currentLevel} Progress</span>
                          <span className="font-bold">{xpInLevel} / 500 XP</span>
                        </div>
                        <Progress value={xpProgress} className="h-2" />
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {500 - xpInLevel} XP until Level {currentLevel + 1}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Topics Mastered */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Topics Mastered</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Output', 'Variables', 'Input', 'Operators', 'Conditions', 'Loops', 'Functions', 'Arrays'].map((topic, i) => (
                          <Badge
                            key={topic}
                            variant={i < lessonCount ? 'default' : 'outline'}
                            className={cn(
                              'text-[9px] uppercase tracking-widest',
                              i < lessonCount ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'text-muted-foreground'
                            )}
                          >
                            {i < lessonCount ? <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> : null}
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="stats">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="Wins" value={stats.wins || 0} color="text-emerald-400" />
                    <StatBox label="Losses" value={stats.losses || 0} color="text-destructive" />
                    <StatBox label="Draws" value={stats.draws || 0} color="text-yellow-400" />
                    <StatBox label="Win Rate" value={winRate > 0 ? `${winRate}%` : '—'} color="text-primary" />
                    <StatBox label="Highest ELO" value={stats.highestRating || 1200} color="text-secondary" />
                    <StatBox label="Total Games" value={(stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0)} color="text-foreground" />
                    <StatBox label="Total XP" value={stats.xp || beginner.xp || 0} color="text-orange-400" />
                    <StatBox label="Rank" value={`#${stats.rank || '—'}`} color="text-muted-foreground" />
                    <StatBox label="DevCoins" value={(stats.devcoins || 0).toLocaleString()} color="text-yellow-400" />
                  </div>
                </TabsContent>

                <TabsContent value="rewards">
                  <DailyLoginRewards userId={user?.uid || null} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Achievements Sidebar */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Trophy className="w-5 h-5 text-secondary" /> Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <AchievementBadge achieved={lessonCount >= 1} label="First Steps" icon={BookOpen} />
                <AchievementBadge achieved={lessonCount >= 5} label="Getting Started" icon={Star} />
                <AchievementBadge achieved={lessonCount >= 10} label="Half Way!" icon={Trophy} />
                <AchievementBadge achieved={lessonCount >= 16} label="Arena Ready" icon={Swords} />
                <AchievementBadge achieved={beginner.streak >= 3} label="On Fire" icon={Flame} />
                <AchievementBadge achieved={beginner.streak >= 7} label="Week Warrior" icon={Zap} />
                <AchievementBadge achieved={beginner.xp >= 100} label="100 XP" icon={Sparkles} />
                <AchievementBadge achieved={beginner.xp >= 500} label="500 XP" icon={Medal} />
                <AchievementBadge achieved={beginner.xp >= 1000} label="1000 XP" icon={CrownIcon} />
                <AchievementBadge achieved={stats.wins >= 1} label="First Blood" icon={Sword} />
                <AchievementBadge achieved={stats.wins >= 10} label="10 Wins" icon={Trophy} />
                <AchievementBadge achieved={stats.rating >= 1500} label="Elite Rating" icon={Target} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="space-y-1 p-4 rounded-lg bg-muted/30">
      <div className={cn('text-2xl font-headline font-bold', color)}>{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function AchievementBadge({ achieved, label, icon: Icon }: { achieved: boolean; label: string; icon: any }) {
  return (
    <div className={cn(
      'flex flex-col items-center gap-2 p-3 rounded-lg border text-center',
      achieved ? 'border-secondary/30 bg-secondary/5' : 'border-border bg-muted/20 opacity-80'
    )}>
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', achieved ? 'bg-secondary/10' : 'bg-muted')}>
        {achieved ? (
          <Icon className="w-5 h-5 text-secondary" />
        ) : (
          <div className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 20h20M4 20V8l4 4 4-8 4 8 4-4v12" />
    </svg>
  );
}
