"use client"
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Sword, Shield, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useMatchmaking } from '@/hooks/use-matchmaking';

interface MatchmakingProps {
  onMatchFound: (opponent: { id: string; username: string; rating: number; tier: string }) => void;
}

export function Matchmaking({ onMatchFound }: MatchmakingProps) {
  const { user } = useUser();
  const { data: profile } = useDoc(user ? `/users/${user.uid}` : null);
  const { 
    isSearching, 
    searchTime, 
    opponent, 
    eloRange, 
    error, 
    startSearch, 
    cancelSearch 
  } = useMatchmaking(user?.uid || null, profile?.rating || 1200, profile?.tier || 'Beginner');

  React.useEffect(() => {
    if (opponent) {
      onMatchFound(opponent);
    }
  }, [opponent, onMatchFound]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-headline font-bold text-foreground neon-text uppercase tracking-tighter">
          The Arena Awaits
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Ready to climb the ranks? Match against users within your ELO range in a 1v1 battle of logic and speed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <ModeCard 
          icon={<Sword className="w-8 h-8 text-primary" />}
          title="Rated Battle"
          desc="Affects ELO. 1v1 standard format."
          active={true}
        />
        <ModeCard 
          icon={<Shield className="w-8 h-8 text-secondary" />}
          title="Practice"
          desc="No ELO change. AI Debugger available."
        />
        <ModeCard 
          icon={<Zap className="w-8 h-8 text-orange-400" />}
          title="Sprint"
          desc="Ultra-fast puzzles. XP only."
        />
      </div>

      {error && (
        <div className="w-full max-w-lg p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
          <p className="text-sm text-destructive font-mono">{error}</p>
        </div>
      )}

      {!isSearching ? (
        <Button 
          size="lg" 
          onClick={() => startSearch()}
          className="h-16 px-12 text-lg font-headline font-bold bg-primary text-background hover:bg-primary/90 rounded-none transform transition-transform hover:scale-105 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          ENTER MATCHMAKING
        </Button>
      ) : (
        <Card className="w-full max-w-lg border-primary/50 bg-primary/5 neon-border animate-in fade-in zoom-in duration-300">
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-primary font-headline font-bold uppercase tracking-widest text-sm">Searching...</p>
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

function ModeCard({ icon, title, desc, active = false }: { icon: React.ReactNode; title: string; desc: string; active?: boolean }) {
  return (
    <Card className={cn(
      "border-border transition-all hover:border-primary/50 cursor-pointer group",
      active ? "bg-primary/5 border-primary/50" : "bg-card/50"
    )}>
      <CardContent className="p-6 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center transition-transform group-hover:scale-110">
          {icon}
        </div>
        <div>
          <h3 className="font-headline font-bold text-lg uppercase">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}
