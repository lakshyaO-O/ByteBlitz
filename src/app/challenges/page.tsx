'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Flame, Timer, Trophy, ChevronRight, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { EmptyState } from '@/components/premium/EmptyState';

export default function ChallengesPage() {
  const db = useFirestore();
  const { user } = useUser();

  const challengesQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'challenges'), orderBy('createdAt', 'desc'), limit(20));
  }, [db]);

  const { data: challenges, loading } = useCollection(challengesQuery);

  const userChallengesQuery = React.useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'challengeProgress'), limit(50));
  }, [db, user]);

  const { data: userProgress } = useCollection(userChallengesQuery);

  const progressMap = new Map();
  (userProgress || []).forEach((p: any) => {
    progressMap.set(p.challengeId, p);
  });

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            CHALLENGES
          </h1>
          <p className="text-muted-foreground">Complete challenges to earn bonus XP and climb the leaderboard.</p>
        </div>

        {!challenges || challenges.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No Challenges Available"
            description="Check back later for daily and weekly challenges."
          />
        ) : (
          <>
            {challenges.filter((c: any) => c.type === 'daily').length > 0 && (
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
                      <h2 className="text-2xl font-headline font-bold">{challenges[0].title}</h2>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className={cn(
                          'font-bold uppercase tracking-widest text-xs',
                          challenges[0].difficulty === 'Easy' ? 'text-emerald-400' : 
                          challenges[0].difficulty === 'Medium' ? 'text-yellow-400' : 'text-destructive'
                        )}>
                          {challenges[0].difficulty}
                        </span>
                        {challenges[0].points && (
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-primary" /> {challenges[0].points} XP
                          </span>
                        )}
                        {challenges[0].timeLimit && (
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" /> {challenges[0].timeLimit}
                          </span>
                        )}
                      </div>
                      {challenges[0].description && (
                        <p className="text-sm text-muted-foreground">{challenges[0].description}</p>
                      )}
                    </div>
                    <Button size="lg" className="shrink-0 gap-2">
                      Solve Challenge <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <h2 className="text-2xl font-headline font-bold mb-6">All Challenges</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {challenges.map((challenge: any) => {
                  const progress = progressMap.get(challenge.id);
                  const completed = progress?.completed;
                  const currentProgress = progress?.progress || 0;
                  const total = challenge.totalParts || 1;

                  return (
                    <Card key={challenge.id} className={cn(
                      'bg-card/50 border-border hover:border-primary/30 transition-all',
                      completed && 'border-emerald-500/30 bg-emerald-500/5'
                    )}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <h3 className="font-bold">{challenge.title}</h3>
                            <Badge variant="outline" className={cn(
                              'text-[10px] uppercase tracking-widest',
                              challenge.difficulty === 'Hard' ? 'text-destructive border-destructive/30' :
                              challenge.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-400/30' :
                              'text-emerald-400 border-emerald-400/30'
                            )}>
                              {challenge.difficulty}
                            </Badge>
                          </div>
                          {completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{challenge.points} XP</span>
                          {total > 1 && (
                            <span className="text-muted-foreground">{currentProgress}/{total} parts</span>
                          )}
                        </div>
                        {total > 1 && (
                          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={cn(
                              'h-full rounded-full transition-all',
                              completed ? 'bg-emerald-400' : 'bg-primary'
                            )} style={{ width: `${(currentProgress / total) * 100}%` }} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
