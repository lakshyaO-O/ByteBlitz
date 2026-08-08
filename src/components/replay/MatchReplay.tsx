'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Play, Pause, SkipBack, SkipForward, Clock, Trophy, Swords, Code2, Loader2, User } from 'lucide-react';
import { MatchReplay as MatchReplayType } from '@/app/lib/types';

interface MatchReplayProps {
  matchId: string;
}

export function MatchReplay({ matchId }: MatchReplayProps) {
  const [replay, setReplay] = useState<MatchReplayType | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentEventIdx, setCurrentEventIdx] = useState(0);

  const loadReplay = useCallback(async () => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return; }
      const matchDoc = await getDoc(doc(db, 'matches', matchId));
      if (matchDoc.exists()) {
        const data = matchDoc.data() as MatchReplayType;
        setReplay({ ...data, id: matchDoc.id });
      }
      setLoading(false);
    } catch { setLoading(false); }
  }, [matchId]);

  useEffect(() => {
    loadReplay();
  }, [loadReplay]);

  const togglePlay = () => setPlaying(!playing);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!replay) return <div className="text-center py-12 text-muted-foreground">Replay not found</div>;

  const player1 = replay.players[0];
  const player2 = replay.players[1];

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
              <Swords className="w-5 h-5 text-primary" />
              Match Replay
            </CardTitle>
            <Badge variant="outline" className="text-xs">{replay.problem?.title || 'Unknown'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-primary/30">
                <AvatarImage src={''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {(player1?.username || 'P1')[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm">{player1?.username}</p>
                <p className="text-xs text-muted-foreground">{player1?.rating} ELO</p>
              </div>
              <div className="text-center px-4">
                <p className={cn('text-2xl font-bold font-headline', replay.winnerIds?.includes(player1?.uid || '') ? 'text-emerald-400' : 'text-muted-foreground')}>
                  {replay.finalScores?.[player1?.uid || ''] || 0}
                </p>
              </div>
            </div>
            <div className="text-center">
              <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">VS</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-4">
                <p className={cn('text-2xl font-bold font-headline', replay.winnerIds?.includes(player2?.uid || '') ? 'text-emerald-400' : 'text-muted-foreground')}>
                  {replay.finalScores?.[player2?.uid || ''] || 0}
                </p>
              </div>
              <Avatar className="w-10 h-10 border border-secondary/30">
                <AvatarImage src={''} />
                <AvatarFallback className="bg-secondary/10 text-secondary text-xs">
                  {(player2?.username || 'P2')[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm">{player2?.username}</p>
                <p className="text-xs text-muted-foreground">{player2?.rating} ELO</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><SkipBack className="w-4 h-4" /></Button>
            <Button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><SkipForward className="w-4 h-4" /></Button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(currentTime)} / {formatDuration(replay.duration || 0)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            Match Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {replay.timeline && replay.timeline.length > 0 ? (
            <div className="space-y-2">
              {replay.timeline.slice(0, 20).map((event, i) => (
                <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted/20">
                  <span className="text-[10px] text-muted-foreground font-mono w-12">{formatDuration(event.time)}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{event.event.replace('_', ' ')}</Badge>
                  <span className="text-muted-foreground">by {event.player}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No timeline data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
