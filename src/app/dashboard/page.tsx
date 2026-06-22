
'use client';
import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Zap, Sword, Target, Flame, Medal, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { useUser, useDoc, useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function DashboardPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();

  const userProfileQuery = React.useMemo(() => (user && db ? `/users/${user.uid}` : null), [user, db]);
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

  const stats = profile || {
    rating: 1000,
    highestRating: 1000,
    wins: 0,
    losses: 0,
    draws: 0,
    xp: 0,
    level: 1,
    rank: 0,
    streak: 0,
    username: user?.displayName || 'Architect'
  };

  const tier = getTier(stats.rating);

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row gap-8">
          <Card className="flex-1 border-primary/20 bg-primary/5 neon-border">
            <CardContent className="p-8 flex items-center gap-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-primary p-1 neon-glow">
                  <div className="w-full h-full rounded-full bg-muted overflow-hidden">
                    <img src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200/200`} alt="Profile" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white neon-glow">
                  LVL {stats.level}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-headline font-bold tracking-tight text-foreground">{stats.username}</h2>
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/5 uppercase text-[10px] tracking-widest">PRO</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                  <span className={cn(getTierColor(tier))}>{tier}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary">{stats.rating} ELO</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full md:w-80 bg-card/50 border-border">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-bold uppercase tracking-widest">Current Streak</span>
                </div>
                <span className="text-2xl font-headline font-bold text-orange-500">{stats.streak} DAYS</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Progress to Next Level</span>
                  <span>{Math.floor((stats.xp % 1000) / 10)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary neon-glow transition-all" style={{ width: `${(stats.xp % 1000) / 10}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-card/50 border-border">
            <CardHeader className="border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Sword className="w-5 h-5 text-primary" /> Recent Combat Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {combatLogs && combatLogs.length > 0 ? (
                  combatLogs.map((log: any) => (
                    <CombatLogItem key={log.id} opponent={log.opponentName} result={log.result} eloChange={log.eloChange} time={new Date(log.timestamp).toLocaleDateString()} />
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground uppercase text-xs font-bold tracking-widest">
                    No recent combat logs found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                <Medal className="w-5 h-5 text-secondary" /> Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <AchievementIcon active={stats.wins >= 10} icon={<Trophy className="w-6 h-6" />} label="10 Wins" />
                <AchievementIcon active={stats.wins >= 1} icon={<Zap className="w-6 h-6" />} label="First Blood" />
                <AchievementIcon active={stats.rating >= 1500} icon={<Target className="w-6 h-6" />} label="Elite" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function CombatLogItem({ opponent, result, eloChange, time }: { opponent: string; result: 'WIN' | 'LOSS'; eloChange: string; time: string }) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-8 rounded flex items-center justify-center font-headline font-bold text-xs border uppercase tracking-widest",
          result === 'WIN' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-destructive/10 border-destructive/50 text-destructive"
        )}>
          {result}
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-tight">vs {opponent}</p>
          <p className="text-[10px] text-muted-foreground font-mono">{time}</p>
        </div>
      </div>
      <div className={cn(
        "text-lg font-headline font-bold",
        result === 'WIN' ? "text-primary" : "text-muted-foreground"
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
        "w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all",
        active 
          ? "bg-secondary/10 border-secondary text-secondary neon-glow scale-100" 
          : "bg-muted border-border text-muted-foreground opacity-40 grayscale group-hover:grayscale-0 transition-all duration-300"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-widest",
        active ? "text-foreground" : "text-muted-foreground"
      )}>{label}</span>
    </div>
  );
}
