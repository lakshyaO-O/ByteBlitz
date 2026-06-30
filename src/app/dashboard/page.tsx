'use client';
import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Zap, Sword, Target, Flame, Medal, ChevronRight, Loader2, Gift, Activity, TrendingUp, Swords, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/premium/EmptyState';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { useUser, useDoc, useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { DailyLoginRewards } from '@/components/gamification/DailyLoginRewards';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import type { UserProfile } from '@/app/lib/types';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

function DashboardContent() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();

  const userProfileQuery = React.useMemo(() => (user && db ? `users/${user.uid}` : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc(userProfileQuery);

  const combatLogsQuery = React.useMemo(() => {
    if (!user || !db) return null;
    return query(collection(db, 'users', user.uid, 'combatLogs'), orderBy('timestamp', 'desc'), limit(5));
  }, [user, db]);
  const { data: combatLogs, loading: logsLoading } = useCollection(combatLogsQuery);

  if (authLoading || profileLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  const stats: UserProfile = profile || {
    rating: 1000,
    highestRating: 1000,
    wins: 0,
    losses: 0,
    draws: 0,
    xp: 0,
    level: 1,
    rank: 0,
    streak: 0,
    username: user?.displayName || 'Architect',
  } as any;

  const tier = getTier(stats.rating);
  const winRate = (stats.wins + stats.losses + stats.draws) > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses + stats.draws)) * 100)
    : 0;

  return (
    <Shell>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row gap-6">
          <Card className="flex-1 border-primary/20 bg-primary/5 neon-border">
            <CardContent className="p-6 flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-primary p-1 neon-glow">
                  <Avatar className="w-full h-full rounded-full">
                    <AvatarImage src={user?.photoURL || ''} alt={stats.username} />
                    <AvatarFallback className="bg-muted text-lg font-headline font-bold text-primary">
                      {(stats.username || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-secondary px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white neon-glow">
                  LVL {stats.level}
                </div>
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-headline font-bold tracking-tight text-foreground truncate">{stats.username}</h2>
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/5 uppercase text-[10px] tracking-widest shrink-0">PRO</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest flex-wrap">
                  <span className={cn(getTierColor(tier))}>{tier}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary">{stats.rating} ELO</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">Rank #{stats.rank || '-'}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Sword className="w-3 h-3 text-emerald-400" /> {stats.wins}W</span>
                  <span className="flex items-center gap-1"><Swords className="w-3 h-3 text-destructive" /> {stats.losses}L</span>
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-400" /> {stats.draws}D</span>
                  <span className="flex items-center gap-1"><Target className="w-3 h-3 text-primary" /> {winRate}% WR</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full md:w-72 bg-card/50 border-border shrink-0">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className={cn('w-5 h-5', (stats.streak || 0) >= 3 ? 'text-orange-500' : 'text-muted-foreground')} />
                  <span className="text-xs font-bold uppercase tracking-widest">Streak</span>
                </div>
                <span className={cn('text-xl font-headline font-bold', (stats.streak || 0) >= 3 ? 'text-orange-500' : 'text-muted-foreground')}>
                  {stats.streak || 0}
                  <span className="text-xs font-mono text-muted-foreground ml-1">days</span>
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>XP to Level {stats.level + 1}</span>
                  <span>{(stats.xp || 0) % 1000} / 1000 XP</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary neon-glow transition-all duration-500 rounded-full" style={{ width: `${((stats.xp || 0) % 1000) / 10}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center space-y-1">
              <Trophy className="w-5 h-5 text-primary mx-auto" />
              <div className="text-2xl font-headline font-bold">{stats.rating}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Current ELO</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center space-y-1">
              <TrendingUp className="w-5 h-5 text-secondary mx-auto" />
              <div className="text-2xl font-headline font-bold">{stats.highestRating || stats.rating}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Peak ELO</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center space-y-1">
              <Zap className="w-5 h-5 text-orange-400 mx-auto" />
              <div className="text-2xl font-headline font-bold">{stats.xp || 0}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total XP</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center space-y-1">
              <Medal className="w-5 h-5 text-yellow-400 mx-auto" />
              <div className="text-2xl font-headline font-bold">{stats.wins || 0}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Wins</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card/50 border-border">
            <CardHeader className="border-b border-border flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Sword className="w-4 h-4 text-primary" /> Recent Combat Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="p-8 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-muted rounded" />
                        <div className="space-y-1">
                          <div className="h-4 w-24 bg-muted rounded" />
                          <div className="h-3 w-16 bg-muted rounded" />
                        </div>
                      </div>
                      <div className="h-5 w-12 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : combatLogs && combatLogs.length > 0 ? (
                <div className="divide-y divide-border">
                  {combatLogs.map((log: any) => (
                    <CombatLogItem key={log.id} opponent={log.opponentName} result={log.result} eloChange={log.eloChange} time={log.timestamp?.toDate?.()?.toISOString?.() || log.timestamp} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Sword}
                  title="No Combat Logs"
                  description="Your battle history will appear here once you start competing in the arena."
                  className="border-0 rounded-none p-8"
                />
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader className="border-b border-border py-4">
              <CardTitle className="text-base font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Medal className="w-4 h-4 text-secondary" /> Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs defaultValue="achievements">
                <TabsList className="grid grid-cols-3 gap-1 h-auto bg-muted/50 p-1 mb-4">
                  <TabsTrigger value="achievements" className="text-[10px] gap-1"><Medal className="w-3 h-3" /> Badges</TabsTrigger>
                  <TabsTrigger value="rewards" className="text-[10px] gap-1"><Gift className="w-3 h-3" /> Daily</TabsTrigger>
                  <TabsTrigger value="activity" className="text-[10px] gap-1"><Activity className="w-3 h-3" /> Feed</TabsTrigger>
                </TabsList>
                <TabsContent value="achievements">
                  <div className="grid grid-cols-3 gap-3">
                    <AchievementIcon active={stats.wins >= 10} icon={<Trophy className="w-5 h-5" />} label="10 Wins" />
                    <AchievementIcon active={stats.wins >= 1} icon={<Zap className="w-5 h-5" />} label="First Blood" />
                    <AchievementIcon active={stats.rating >= 1500} icon={<Target className="w-5 h-5" />} label="Elite" />
                  </div>
                </TabsContent>
                <TabsContent value="rewards">
                  <DailyLoginRewards userId={user?.uid || null} />
                </TabsContent>
                <TabsContent value="activity">
                  <ActivityFeed userId={user?.uid} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function CombatLogItem({ opponent, result, eloChange, time }: { opponent: string; result: 'WIN' | 'LOSS' | 'DRAW'; eloChange: string; time: string }) {
  const timeStr = React.useMemo(() => {
    try {
      const d = new Date(time);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return time;
    }
  }, [time]);

  return (
    <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <div className={cn(
          'w-14 h-9 rounded flex items-center justify-center font-headline font-bold text-xs border uppercase tracking-widest shrink-0',
          result === 'WIN' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' :
          result === 'DRAW' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' :
          'bg-destructive/10 border-destructive/50 text-destructive'
        )}>
          {result}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-tight truncate">vs {opponent}</p>
          <p className="text-[10px] text-muted-foreground font-mono">{timeStr}</p>
        </div>
      </div>
      <div className={cn(
        'text-lg font-headline font-bold shrink-0 ml-4',
        result === 'WIN' ? 'text-primary' : result === 'DRAW' ? 'text-yellow-400' : 'text-muted-foreground'
      )}>
        {eloChange}
      </div>
    </div>
  );
}

function AchievementIcon({ active, icon, label }: { active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center group">
      <div className={cn(
        'w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all',
        active
          ? 'bg-secondary/10 border-secondary text-secondary neon-glow scale-100'
          : 'bg-muted border-border text-muted-foreground opacity-40 grayscale group-hover:grayscale-0 transition-all duration-300'
      )}>
        {icon}
      </div>
      <span className={cn(
        'text-[10px] font-bold uppercase tracking-widest',
        active ? 'text-foreground' : 'text-muted-foreground'
      )}>{label}</span>
    </div>
  );
}
