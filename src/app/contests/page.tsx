'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Trophy,
  Users,
  Zap,
  Sword,
  ChevronRight,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CONTESTS = [
  {
    id: 'weekly-42',
    title: 'Weekly Contest #42',
    description: 'Solve 4 problems in 90 minutes. Test your algorithmic prowess.',
    date: '2026-07-04T18:00:00Z',
    duration: '90 min',
    participants: 1247,
    status: 'upcoming',
    prize: '500 XP + Exclusive Badge',
  },
  {
    id: 'biweekly-18',
    title: 'Bi-Weekly Sprint #18',
    description: 'Fast-paced 60-minute coding sprint. 3 problems, increasing difficulty.',
    date: '2026-06-30T15:00:00Z',
    duration: '60 min',
    participants: 893,
    status: 'registering',
    prize: '300 XP + Profile Frame',
  },
  {
    id: 'masters-5',
    title: 'Masters Championship #5',
    description: 'Elite contest for 1800+ ELO. Hard problems only.',
    date: '2026-07-10T20:00:00Z',
    duration: '120 min',
    participants: 312,
    status: 'upcoming',
    prize: '1000 XP + Master Trophy',
  },
  {
    id: 'past-1',
    title: 'Weekly Contest #41',
    description: 'Arrays, Strings, and Dynamic Programming.',
    date: '2026-06-27T18:00:00Z',
    duration: '90 min',
    participants: 1156,
    status: 'ended',
    prize: '500 XP',
  },
];

export default function ContestsPage() {
  const now = new Date();

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6 text-center space-y-2">
              <Calendar className="w-8 h-8 text-primary mx-auto" />
              <div className="text-3xl font-headline font-bold">{CONTESTS.filter(c => c.status !== 'ended').length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Active Contests</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6 text-center space-y-2">
              <Users className="w-8 h-8 text-secondary mx-auto" />
              <div className="text-3xl font-headline font-bold">
                {CONTESTS.reduce((sum, c) => sum + c.participants, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Participants</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6 text-center space-y-2">
              <Trophy className="w-8 h-8 text-orange-400 mx-auto" />
              <div className="text-3xl font-headline font-bold">{CONTESTS.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Contests</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {CONTESTS.map((contest) => (
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
                    <p className="text-sm text-muted-foreground">{contest.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" /> {contest.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {contest.participants.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-orange-400" /> {contest.prize}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={contest.status === 'ended' ? 'outline' : 'default'}
                    size="sm"
                    className="shrink-0"
                    disabled={contest.status === 'ended'}
                  >
                    {contest.status === 'ended' ? 'View Results' : 'Register'}
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
