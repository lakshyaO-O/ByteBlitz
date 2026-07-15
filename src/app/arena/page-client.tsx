"use client"
import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Matchmaking } from '@/components/arena/Matchmaking';
import { BattleArenaMultiplayer as BattleArena } from '@/components/arena/BattleArenaMultiplayer';
import { ArenaHeader } from '@/components/arena/ArenaHeader';
import { PlayerStatsCard } from '@/components/arena/PlayerStatsCard';
import { PrivateRoomPanel } from '@/components/arena/PrivateRoomPanel';
import { useUser } from '@/firebase/auth/use-user';
import { fetchMatchHistory, fetchActiveBattleCount, fetchOnlinePlayerCount } from '@/services/arena';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/app-store';
import {
  Swords, Trophy, Zap, Shield, ChevronRight, Clock, Users, TrendingUp,
  Star, Target, Gamepad2, Scroll, Loader2, Sword, BookOpen, Lock, Code2,
  GraduationCap, Sparkles, CheckCircle2, ArrowRight, Flame,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { MatchRecord } from '@/types';

const TIER_DISPLAY: Record<string, { label: string; color: string; border: string; bg: string }> = {
  Beginner: { label: 'Bronze', color: 'text-amber-600', border: 'border-amber-600/40', bg: 'bg-amber-600/10' },
  Learner: { label: 'Silver', color: 'text-slate-300', border: 'border-slate-400/40', bg: 'bg-slate-400/10' },
  Intermediate: { label: 'Gold', color: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10' },
  Advanced: { label: 'Platinum', color: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10' },
  Expert: { label: 'Diamond', color: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-500/10' },
  Master: { label: 'Grandmaster', color: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-500/10' },
};

const MIN_LESSONS_FOR_ARENA = 15;
const MIN_XP_FOR_ARENA = 1000;

export default function ArenaPage() {
  const { user } = useUser();
  const { state } = useAppStore();
  const { beginner } = state;

  const [inBattle, setInBattle] = useState(false);
  const [opponent, setOpponent] = useState<{ id: string; username: string; rating: number; tier: string } | null>(null);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  const [activeBattles, setActiveBattles] = useState(0);
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [view, setView] = useState<'matchmaking' | 'private' | 'arena'>('arena');

  const completedLessons = beginner.lessonsCompleted.length;
  const canEnterArena = completedLessons >= MIN_LESSONS_FOR_ARENA;
  const lessonsRemaining = Math.max(0, MIN_LESSONS_FOR_ARENA - completedLessons);

  useEffect(() => {
    if (!user) { setReconnecting(false); return; }
    let mounted = true;

    async function loadData() {
      try {
        const { initializeFirebase } = await import('@/firebase');
        const { doc, getDoc, collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
        const { firestore: db } = initializeFirebase();
        if (!db) return;
        const snap = await getDoc(doc(db, 'users', user!.uid));
        if (snap.exists() && mounted) setProfile(snap.data());

        const [matches, active, online] = await Promise.all([
          fetchMatchHistory(user!.uid),
          fetchActiveBattleCount(),
          fetchOnlinePlayerCount(),
        ]);
        if (mounted) {
          setRecentMatches(matches);
          setActiveBattles(active);
          setOnlinePlayers(online);
        }
      } catch {}
    }
    loadData();

    async function checkActiveBattle() {
      try {
        const { initializeFirebase } = await import('@/firebase');
        const { doc, getDoc, collection, query, where, getDocs, limit } = await import('firebase/firestore');
        const { firestore: db } = initializeFirebase();
        if (!db) { if (mounted) setReconnecting(false); return; }

        const battlesQuery = query(collection(db, 'battles'), where('status', '==', 'active'), limit(10));
        const battleSnaps = await getDocs(battlesQuery);
        for (const bs of battleSnaps.docs) {
          const bd = bs.data();
          const isPlayer1 = bd.player1?.uid === user!.uid;
          const isPlayer2 = bd.player2?.uid === user!.uid;
          if (isPlayer1 || isPlayer2) {
            const enemyData = isPlayer1 ? bd.player2 : bd.player1;
            if (mounted && enemyData) {
              setBattleId(bs.id);
              setOpponent({ id: enemyData.uid, username: enemyData.username, rating: enemyData.rating, tier: enemyData.tier || 'Beginner' });
              setInBattle(true);
              break;
            }
          }
        }
      } catch {}
      if (mounted) setReconnecting(false);
    }

    checkActiveBattle();
    return () => { mounted = false; };
  }, [user]);

  const handleMatchFound = (foundOpponent: { id: string; username: string; rating: number; tier: string }, foundBattleId?: string) => {
    setOpponent(foundOpponent);
    if (foundBattleId) setBattleId(foundBattleId);
    setInBattle(true);
  };

  const handleBattleEnd = () => {
    setInBattle(false);
    setOpponent(null);
    setBattleId(null);
    setView('arena');
  };

  if (reconnecting) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground font-mono text-sm">Scanning the arena...</p>
          </div>
        </div>
      </Shell>
    );
  }

  if (inBattle && opponent && battleId) {
    return (
      <Shell>
        <BattleArena opponent={opponent} battleId={battleId} onBattleEnd={handleBattleEnd} />
      </Shell>
    );
  }

  // Progressive unlock: Show beginner gate if they haven't completed enough lessons
  if (!canEnterArena) {
    return (
      <Shell>
        <div className="max-w-4xl mx-auto space-y-8 py-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center mx-auto">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-headline font-bold">Arena is Locked 🔒</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Complete the Beginner Learning Roadmap to unlock the Arena. You need to finish at least {MIN_LESSONS_FOR_ARENA} lessons to enter.
            </p>
          </div>

          {/* Progress to unlock */}
          <Card className="max-w-lg mx-auto bg-card/50 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Your Progress</h3>
                <span className="text-sm text-muted-foreground">{completedLessons}/{MIN_LESSONS_FOR_ARENA} lessons</span>
              </div>
              <Progress value={(completedLessons / MIN_LESSONS_FOR_ARENA) * 100} className="h-3" />

              <div className="space-y-2">
                {lessonsRemaining > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">Complete {lessonsRemaining} more lesson{lessonsRemaining !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-muted-foreground">Continue your learning roadmap</p>
                    </div>
                  </div>
                )}
                {beginner.xp < MIN_XP_FOR_ARENA && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">Earn {MIN_XP_FOR_ARENA - beginner.xp} more XP</p>
                      <p className="text-xs text-muted-foreground">Keep practicing to gain experience</p>
                    </div>
                  </div>
                )}
              </div>

              <Button className="w-full gap-2" onClick={() => window.location.href = '/learning'}>
                Continue Learning <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* What is the Arena? */}
          <Card className="max-w-lg mx-auto bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                <Swords className="w-4 h-4 text-primary" /> What is the Arena?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Sword className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">Battle other coders 1v1 in real-time coding challenges</p>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">Earn ELO rating and climb the leaderboard</p>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">You will only be matched against players at a similar skill level</p>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">Complete the Beginner Roadmap first to ensure you are ready</p>
              </div>
            </CardContent>
          </Card>

          {/* Beginner Arena alternative */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-3">Not ready yet? No problem! Keep learning at your own pace.</p>
            <Button variant="outline" className="gap-2" onClick={() => window.location.href = '/practice'}>
              <Code2 className="w-4 h-4" /> Practice Problems Instead
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  // Arena is unlocked — show the full arena
  if (view === 'matchmaking') {
    return (
      <Shell>
        <div className="max-w-3xl mx-auto">
          <Matchmaking onMatchFound={handleMatchFound} />
        </div>
      </Shell>
    );
  }

  const rawTier = (profile?.tier || 'Beginner') as string;
  const tier = TIER_DISPLAY[rawTier] || TIER_DISPLAY.Beginner;
  const winRate = profile && (profile.wins + profile.losses) > 0
    ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100) : 0;

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-8 py-6">
        <ArenaHeader
          activeBattles={activeBattles}
          onlinePlayers={onlinePlayers}
          userRating={profile?.rating || 1000}
          userTier={tier.label}
        />

        {/* Arena unlocked congratulations */}
        {completedLessons >= MIN_LESSONS_FOR_ARENA && completedLessons < 16 && (
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4 flex items-center gap-4">
              <Sparkles className="w-6 h-6 text-yellow-400 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-sm">Arena Unlocked! 🎉</p>
                <p className="text-xs text-muted-foreground">You've completed enough lessons. Enter the Arena and test your skills!</p>
              </div>
              <Button size="sm" className="gap-1" onClick={() => setView('matchmaking')}>
                Enter <Swords className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-14 bg-card/50 border border-border/80">
            <TabsTrigger value="arena" className="text-xs font-bold uppercase tracking-widest data-[state=active]:text-primary">
              <Swords className="w-4 h-4 mr-2" /> Arena
            </TabsTrigger>
            <TabsTrigger value="matchmaking" className="text-xs font-bold uppercase tracking-widest data-[state=active]:text-primary">
              <Zap className="w-4 h-4 mr-2" /> Matchmaking
            </TabsTrigger>
            <TabsTrigger value="private" className="text-xs font-bold uppercase tracking-widest data-[state=active]:text-primary">
              <Shield className="w-4 h-4 mr-2" /> Private Room
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arena" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-card/60 border-border/80 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                  <div className="p-6 relative z-10">
                    <div className="flex items-center gap-4 mb-5">
                      <div className={cn("w-14 h-14 rounded-xl border-2 flex items-center justify-center", tier.border, tier.bg)}>
                        <Trophy className={cn("w-7 h-7", tier.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-headline font-bold text-lg truncate">{profile?.username || user?.displayName || user?.email?.split('@')[0] || 'Player'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={cn("text-[10px] px-2 py-0 font-bold", tier.color, tier.border, tier.bg)}>
                            {tier.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">{profile?.rating || 1000} ELO</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Wins', value: profile?.wins || 0, icon: Trophy, color: 'text-emerald-400' },
                        { label: 'Losses', value: profile?.losses || 0, icon: Shield, color: 'text-red-400' },
                        { label: 'Draws', value: profile?.draws || 0, icon: Star, color: 'text-yellow-400' },
                      ].map(stat => (
                        <div key={stat.label} className="text-center p-2 rounded-lg bg-muted/30 border border-border/50">
                          <stat.icon className={cn("w-4 h-4 mx-auto mb-1", stat.color)} />
                          <p className="text-lg font-bold font-headline">{stat.value}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {winRate > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" /> Win Rate
                          </span>
                          <span className={cn("font-bold font-mono", winRate >= 50 ? 'text-emerald-400' : 'text-red-400')}>{winRate}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="bg-card/60 border-border/80">
                  <div className="p-4 border-b border-border/60 flex items-center gap-2">
                    <Scroll className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Recent Matches</h3>
                  </div>
                  <div className="divide-y divide-border/30">
                    {recentMatches.length === 0 ? (
                      <div className="p-6 text-center">
                        <Gamepad2 className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No matches yet. Enter the arena!</p>
                      </div>
                    ) : (
                      recentMatches.slice(0, 5).map((match, i) => {
                        const myPlayer = match.players?.find(p => p.uid === user?.uid);
                        const result = myPlayer?.result || 'DRAW';
                        const eloChange = myPlayer?.eloChange || 0;
                        return (
                          <div key={match.id || i} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                            <div className={cn("w-2 h-2 rounded-full shrink-0", result === 'WIN' ? 'bg-emerald-400' : result === 'LOSS' ? 'bg-red-400' : 'bg-yellow-400')} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">vs {match.players?.find(p => p.uid !== user?.uid)?.username || 'Unknown'}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{match.problem?.title || 'Battle'}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={cn("text-xs font-bold", result === 'WIN' ? 'text-emerald-400' : result === 'LOSS' ? 'text-red-400' : 'text-yellow-400')}>
                                {result}
                              </p>
                              {eloChange !== 0 && (
                                <p className={cn("text-[10px] font-mono", eloChange > 0 ? 'text-emerald-400' : 'text-red-400')}>
                                  {eloChange > 0 ? '+' : ''}{eloChange}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <Card className="relative overflow-hidden group cursor-pointer border-primary/30 bg-primary/10"
                  onClick={() => setView('matchmaking')}>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.08),transparent_60%)] pointer-events-none" />
                  <div className="p-8 relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] px-3 py-1 mb-3">
                          <Zap className="w-3 h-3 mr-1" /> Rated
                        </Badge>
                        <h2 className="text-2xl font-headline font-bold uppercase tracking-tighter">1v1 Battle</h2>
                        <p className="text-muted-foreground text-sm mt-1 max-w-md">
                          Match against opponents near your skill level. Solve the same problem faster and with fewer errors to win ELO.
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30">
                        <Swords className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button size="lg" className="h-14 px-8 text-base font-headline font-bold gap-2 bg-primary hover:bg-primary/90 group/btn">
                        <Zap className="w-5 h-5 group-hover/btn:animate-pulse" /> FIND MATCH
                      </Button>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {onlinePlayers} online</span>
                        <span className="flex items-center gap-1"><Sword className="w-3 h-3" /> {activeBattles} active</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-card/60 border-border/80 hover:border-emerald-500/30 transition-all group cursor-pointer"
                    onClick={() => setView('matchmaking')}>
                    <div className="p-6">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Target className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h3 className="font-headline font-bold text-sm uppercase tracking-wider mb-1">Quick Match</h3>
                      <p className="text-muted-foreground text-xs mb-3">Unranked matches to hone your skills without pressure.</p>
                      <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/5">Available</Badge>
                    </div>
                  </Card>

                  <Card className="bg-card/60 border-border/80 hover:border-purple-500/30 transition-all group cursor-pointer"
                    onClick={() => setView('private')}>
                    <div className="p-6">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Shield className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="font-headline font-bold text-sm uppercase tracking-wider mb-1">Private Room</h3>
                      <p className="text-muted-foreground text-xs mb-3">Create or join private rooms to battle friends.</p>
                      <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/30 bg-purple-500/5">Available</Badge>
                    </div>
                  </Card>

                  <Link
                    href="/arena/custom-study"
                    className="block"
                  >
                    <Card className="bg-card/60 border-border/80 hover:border-emerald-500/30 transition-all group cursor-pointer h-full">
                      <div className="p-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <BookOpen className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h3 className="font-headline font-bold text-sm uppercase tracking-wider mb-1">Study Room</h3>
                        <p className="text-muted-foreground text-xs mb-3">Collaborative coding rooms. Solve problems together — no ELO pressure.</p>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/5">Available</Badge>
                          <Badge variant="outline" className="text-[10px] text-secondary border-secondary/30 bg-secondary/5">No ELO</Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="matchmaking" className="mt-6">
            <Matchmaking onMatchFound={handleMatchFound} />
          </TabsContent>

          <TabsContent value="private" className="mt-6">
            <PrivateRoomPanel />
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
