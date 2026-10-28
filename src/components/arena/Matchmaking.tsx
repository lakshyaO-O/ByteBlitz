'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useArenaMatchmaking } from '@/hooks/use-arena-matchmaking';
import { QueueStatus } from './QueueStatus';
import { MatchmakingAnimation } from './MatchmakingAnimation';
import { ArenaSettings } from './ArenaSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Swords, Settings, DoorOpen, Hash, Copy, Check, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { GuestGate } from '@/components/auth/GuestGate';

interface MatchmakingProps {
  onMatchFound: (opponent: { id: string; username: string; rating: number; tier: string }, battleId?: string) => void;
}

export function Matchmaking({ onMatchFound }: MatchmakingProps) {
    const { status, opponent, battle, error, queueTime, joinQueue, leaveQueue, acceptMatch } = useArenaMatchmaking();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [privateRoomOpen, setPrivateRoomOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);

  const generateRoomCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomCode(code);
  }, []);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomCode]);

  useEffect(() => {
    if (status === 'ready' && opponent && battle) {
      onMatchFound(
        { id: opponent.uid || '_', username: opponent.username, rating: opponent.rating, tier: opponent.tier },
        battle.id
      );
    }
  }, [status, opponent, battle, onMatchFound]);

  if (status === 'searching') {
    return (
      <div className="flex flex-col items-center gap-8 py-12">
        <MatchmakingAnimation status="searching" />
        <QueueStatus
          isSearching={true}
          queueTime={queueTime}
          eloRange={0}
          onCancel={leaveQueue}
          onStartSearch={joinQueue}
        />
        {error && (
          <div className="w-full max-w-lg p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
            <p className="text-sm text-destructive font-mono">{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (status === 'found') {
    return (
      <div className="flex flex-col items-center gap-8 py-12">
        <MatchmakingAnimation status="found" opponentName={opponent?.username} />
        <Card className="w-full max-w-lg border-primary/30 bg-primary/5">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-primary font-headline font-bold uppercase tracking-widest text-sm">
                Accept the challenge?
              </p>
              <p className="text-muted-foreground text-sm">
                You have been matched with <span className="text-foreground font-bold">{opponent?.username}</span>
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={acceptMatch}
                className="flex-1 h-14 text-base font-headline font-bold gap-2"
              >
                <Swords className="w-5 h-5" />
                ACCEPT MATCH
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={leaveQueue}
                className="h-14 text-base font-headline font-bold gap-2"
              >
                <DoorOpen className="w-5 h-5" />
                LEAVE
              </Button>
            </div>
          </CardContent>
        </Card>
        {error && (
          <div className="w-full max-w-lg p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
            <p className="text-sm text-destructive font-mono">{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (status === 'creating_battle') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <p className="text-primary font-headline font-bold uppercase tracking-widest text-sm">
          Creating battle...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-headline font-bold uppercase tracking-widest">
          <Swords className="w-3.5 h-3.5" />
          1v1 Rated Battle
        </div>
        <h2 className="text-4xl font-headline font-bold text-foreground uppercase tracking-tighter">
          Find Your Match
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Enter the arena and face opponents within your skill bracket. Earn rating points and climb the leaderboard.
        </p>
      </div>

      {error && (
        <div className="w-full max-w-lg p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
          <p className="text-sm text-destructive font-mono">{error}</p>
        </div>
      )}

      {status === 'joining' ? (
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-primary font-headline font-bold uppercase tracking-widest text-sm">
            Joining queue...
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <GuestGate feature="Join Arena Matchmaking" redirectPath="/arena">
              <Button
                size="lg"
                onClick={joinQueue}
                className="h-16 px-12 text-lg font-headline font-bold bg-primary text-background hover:bg-primary/90 rounded-none transform transition-transform hover:scale-105 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                QUICK MATCH
              </Button>
            </GuestGate>

            <Dialog open={privateRoomOpen} onOpenChange={setPrivateRoomOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 px-12 text-lg font-headline font-bold border-primary/50 text-primary hover:bg-primary/10 rounded-none transform transition-transform hover:scale-105"
                >
                  <DoorOpen className="w-5 h-5" />
                  PRIVATE ROOM
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-headline">
                    <Hash className="w-5 h-5 text-primary" />
                    Private Room
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Create a private room and share the code with a friend to battle.
                    </p>
                  </div>
                  {roomCode ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-4xl font-mono font-bold tracking-[0.25em] text-primary">
                        {roomCode}
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-2">
                        {copied ? (
                          <><Check className="w-4 h-4 text-green-500" /> Copied</>
                        ) : (
                          <><Copy className="w-4 h-4" /> Copy Code</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={generateRoomCode} className="w-full gap-2" size="lg">
                      <Hash className="w-5 h-5" />
                      GENERATE ROOM CODE
                    </Button>
                  )}
                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => { setPrivateRoomOpen(false); setRoomCode(''); }}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Settings className="w-4 h-4" />
                Arena Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-headline">
                  <Settings className="w-5 h-5 text-primary" />
                  Arena Settings
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <ArenaSettings />
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
