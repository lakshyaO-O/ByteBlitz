'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Trophy,
  Users,
  ChevronRight,
  Timer,
  Loader2,
  Sword,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { GuestGate } from '@/components/auth/GuestGate';
import { EmptyState } from '@/components/premium/EmptyState';

export default function ContestsPage() {
  const db = useFirestore();

  const contestsQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'contests'), orderBy('date', 'desc'), limit(20));
  }, [db]);

  const { data: contests, loading } = useCollection(contestsQuery);

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              CODING <span className="text-primary neon-text">CONTESTS</span>
            </h1>
            <p className="text-muted-foreground">Compete against the community in timed coding competitions.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[40vh]">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : !contests || contests.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Contests Available"
            description="Check back later for upcoming coding competitions."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card/50 border-border">
                <CardContent className="p-6 text-center space-y-2">
                  <Calendar className="w-8 h-8 text-primary mx-auto" />
                  <div className="text-3xl font-headline font-bold">{contests.filter((c: any) => c.status !== 'ended').length}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Active Contests</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border">
                <CardContent className="p-6 text-center space-y-2">
                  <Users className="w-8 h-8 text-secondary mx-auto" />
                  <div className="text-3xl font-headline font-bold">
                    {contests.reduce((sum: number, c: any) => sum + (c.participants || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Participants</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border">
                <CardContent className="p-6 text-center space-y-2">
                  <Trophy className="w-8 h-8 text-orange-400 mx-auto" />
                  <div className="text-3xl font-headline font-bold">{contests.length}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Contests</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {contests.map((contest: any) => (
                <Card key={contest.id} className="bg-card/50 border-border hover:border-primary/30 transition-all group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-headline font-bold">{contest.title}</h3>
                          <Badge variant={contest.status === 'ended' ? 'outline' : 'default'} className={cn(
                            'text-[10px] uppercase tracking-widest',
                            contest.status === 'upcoming' && 'bg-primary/10 text-primary border-primary/30',
                            contest.status === 'registering' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                            contest.status === 'ended' && 'bg-muted text-muted-foreground border-border',
                          )}>
                            {contest.status === 'upcoming' ? 'Upcoming' : contest.status === 'registering' ? 'Register Now' : 'Ended'}
                          </Badge>
                        </div>
                        {contest.description && (
                          <p className="text-sm text-muted-foreground">{contest.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
                          {contest.duration && (
                            <span className="flex items-center gap-1">
                              <Timer className="w-3 h-3" /> {contest.duration}
                            </span>
                          )}
                          {contest.participants && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {contest.participants.toLocaleString()}
                            </span>
                          )}
                          {contest.prize && (
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-orange-400" /> {contest.prize}
                            </span>
                          )}
                        </div>
                      </div>
                      {contest.status === 'ended' ? (
                        <Button variant="outline" size="sm" className="shrink-0" disabled>
                          View Results <ChevronRight className="ml-1 w-4 h-4" />
                        </Button>
                      ) : (
                        <GuestGate feature="Join Contest" redirectPath="/contests">
                          <Button variant="default" size="sm" className="shrink-0">
                            Register <ChevronRight className="ml-1 w-4 h-4" />
                          </Button>
                        </GuestGate>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
