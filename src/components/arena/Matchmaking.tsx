"use client"
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Swords } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useMatchmaking } from '@/hooks/use-matchmaking';
import { GuestGate } from '@/components/auth/GuestGate';

interface MatchmakingProps {
  onMatchFound: (opponent: { id: string; username: string; rating: number; tier: string }, battleId?: string) => void;
}

export function Matchmaking({ onMatchFound }: MatchmakingProps) {
  const { user } = useUser();
  const { data: profile } = useDoc(user ? `users/${user.uid}` : null);
  const { 
    isSearching, 
    searchTime, 
    opponent, 
    battleId,
    eloRange, 
    error, 
    startSearch, 
    cancelSearch 
  } = useMatchmaking(user?.uid || null, profile?.rating || 1200, profile?.tier || 'Beginner', profile?.username);

  React.useEffect(() => {
    if (opponent) {
      onMatchFound(opponent, battleId || undefined);
    }
  }, [opponent, battleId, onMatchFound]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-headline font-bold uppercase tracking-widest">
          <Swords className="w-3.5 h-3.5" />
          1v1 Rated Battle
        </div>
        <h2 className="text-4xl font-headline font-bold text-foreground neon-text uppercase tracking-tighter">
          The Arena Awaits
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Ready to climb the ranks? Match against opponents within your ELO range in a 1v1 battle of logic and speed. Affects your rating.
        </p>
      </div>

      {error && (
        <div className="w-full max-w-lg p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
          <p className="text-sm text-destructive font-mono">{error}</p>
        </div>
      )}

      {!isSearching ? (
        <GuestGate feature="Join Arena Matchmaking" redirectPath="/arena">
          <Button 
            size="lg" 
            onClick={() => startSearch()}
            className="h-16 px-12 text-lg font-headline font-bold bg-primary text-background hover:bg-primary/90 rounded-none transform transition-transform hover:scale-105 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            ENTER MATCHMAKING
          </Button>
        </GuestGate>
      ) : (
        <Card className="w-full max-w-lg border-primary/50 bg-primary/5 neon-border animate-in fade-in zoom-in duration-300">
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-primary font-headline font-bold uppercase tracking-widest text-sm">Searching for opponent...</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-mono font-bold">{searchTime}s</span>
                  <span className="text-muted-foreground">ELAPSED</span>
                </div>
              </div>
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-mono uppercase text-muted-foreground">
                <span>ELO Range: ±{eloRange}</span>
                <span>Matchmaking Protocol: Active</span>
              </div>
              <div className="h-2 bg-muted overflow-hidden rounded-full">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min((searchTime / 15) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Looking for opponents in your tier...
            </div>

            <Button 
              variant="ghost" 
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" 
              onClick={() => cancelSearch()}
            >
              CANCEL SEARCH
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
