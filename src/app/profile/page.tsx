'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Zap,
  Trophy,
  Sword,
  Target,
  Medal,
  Calendar,
  Edit3,
  Loader2,
  Activity,
  Gift,
  Share2,
} from 'lucide-react';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { DailyLoginRewards } from '@/components/gamification/DailyLoginRewards';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { ShareAchievement } from '@/components/social/ShareAchievement';

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { data: profile, loading: profileLoading } = useDoc(user ? `users/${user.uid}` : null);

  if (authLoading || profileLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  const stats = profile || {};
  const tier = getTier(stats.rating || 1200);
  const initials = (stats.username || user?.displayName || user?.email || '?')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const winRate = (stats.wins + stats.losses) > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="relative">
                <Avatar className="w-28 h-28 border-4 border-primary/30">
                  <AvatarImage src={user?.photoURL || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white">
                  LVL {stats.level || 1}
                </div>
                {stats.badge && (
                  <div className="absolute -top-1 -left-1">
                    <Medal className="w-6 h-6 text-yellow-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-headline font-bold">{stats.username || user?.displayName || 'Player'}</h1>
                  <Badge variant="outline" className={cn('text-[10px] uppercase tracking-widest', getTierColor(tier))}>
                    {tier}
                  </Badge>
                  {stats.title && (
                    <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">{stats.title}</Badge>
                  )}
                  {stats.badge && (
                    <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/30 text-xs">{stats.badge}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {stats.createdAt ? new Date(stats.createdAt).toLocaleDateString() : 'Recently'}</span>
                  <span className="flex items-center gap-1"><Sword className="w-3 h-3" /> {stats.wins || 0}W / {stats.losses || 0}L</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> {stats.rating || 1200} ELO</span>
                </div>
                {stats.bio && <p className="text-sm text-muted-foreground">{stats.bio}</p>}
              </div>
              <div className="flex items-center gap-2">
                <ShareAchievement
                  title={`${stats.username || 'Player'} - CodezArena Profile`}
                  description={`${tier} | ${stats.rating} ELO | ${stats.wins} Wins | Level ${stats.level || 1}`}
                />
                <Button variant="outline" className="gap-2">
                  <Edit3 className="w-4 h-4" /> Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="bg-card/50 border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Sword className="w-5 h-5 text-primary" /> Combat Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="stats">
                <TabsList className="grid grid-cols-3 gap-2 h-auto bg-muted/50 p-1 mb-4">
                  <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs"><Activity className="w-3 h-3" /> Activity</TabsTrigger>
                  <TabsTrigger value="rewards" className="text-xs"><Gift className="w-3 h-3" /> Rewards</TabsTrigger>
                </TabsList>
                <TabsContent value="stats">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="Wins" value={stats.wins || 0} color="text-emerald-400" />
                    <StatBox label="Losses" value={stats.losses || 0} color="text-destructive" />
                    <StatBox label="Draws" value={stats.draws || 0} color="text-yellow-400" />
                    <StatBox label="Win Rate" value={`${winRate}%`} color="text-primary" />
                    <StatBox label="Highest ELO" value={stats.highestRating || 1200} color="text-secondary" />
                    <StatBox label="Total Games" value={(stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0)} color="text-foreground" />
                    <StatBox label="XP" value={stats.xp || 0} color="text-orange-400" />
                    <StatBox label="Rank" value={`#${stats.rank || '—'}`} color="text-muted-foreground" />
                  </div>
                </TabsContent>
                <TabsContent value="activity">
                  <ActivityFeed userId={user?.uid} />
                </TabsContent>
                <TabsContent value="rewards">
                  <DailyLoginRewards userId={user?.uid || null} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Trophy className="w-5 h-5 text-secondary" /> Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <AchievementBadge achieved={stats.wins >= 1} label="First Blood" />
                <AchievementBadge achieved={stats.wins >= 10} label="10 Wins" />
                <AchievementBadge achieved={stats.rating >= 1500} label="Elite Rating" />
                <AchievementBadge achieved={stats.level >= 5} label="Level 5" />
                <AchievementBadge achieved={stats.dailyLoginStreak >= 7} label="Week Warrior" />
                <AchievementBadge achieved={stats.wins >= 50} label="War Machine" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="space-y-1 p-4 rounded-lg bg-muted/30">
      <div className={cn('text-2xl font-headline font-bold', color)}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function AchievementBadge({ achieved, label }: { achieved: boolean; label: string }) {
  return (
    <div className={cn(
      'flex flex-col items-center gap-2 p-3 rounded-lg border text-center',
      achieved ? 'border-secondary/30 bg-secondary/5' : 'border-border bg-muted/20 opacity-50'
    )}>
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', achieved ? 'bg-secondary/10' : 'bg-muted')}>
        {achieved ? (
          <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}
