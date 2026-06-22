
'use client';
import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, ChevronUp, ChevronDown, User, Zap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function LeaderboardPage() {
  const db = useFirestore();

  const leadersQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'users'), orderBy('rating', 'desc'), limit(50));
  }, [db]);

  const { data: leaders, loading } = useCollection(leadersQuery);

  return (
    <Shell>
      <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/5 text-secondary text-xs font-headline font-bold uppercase tracking-widest">
            <Trophy className="w-3.5 h-3.5" />
            Hall of Legends
          </div>
          <h1 className="text-5xl font-headline font-black uppercase tracking-tighter text-foreground">
            GLOBAL <span className="text-primary neon-text">RANKINGS</span>
          </h1>
          <p className="text-muted-foreground">The top architects currently dominating the arena.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {leaders && leaders.length > 1 && <TopPlayerCard rank={2} name={leaders[1].username} rating={leaders[1].rating} />}
              {leaders && leaders.length > 0 && <TopPlayerCard rank={1} name={leaders[0].username} rating={leaders[0].rating} />}
              {leaders && leaders.length > 2 && <TopPlayerCard rank={3} name={leaders[2].username} rating={leaders[2].rating} />}
            </div>

            <Card className="bg-card/50 border-border overflow-hidden">
              <div className="bg-muted/50 p-4 border-b border-border grid grid-cols-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5 px-4">Architect</div>
                <div className="col-span-3 text-center">Elo Rating</div>
                <div className="col-span-3 text-right px-4">Wins</div>
              </div>
              <div className="divide-y divide-border">
                {leaders?.map((player: any, index: number) => (
                  <LeaderRow key={player.id} rank={index + 1} name={player.username} rating={player.rating} wins={player.wins} games={player.wins + player.losses} />
                ))}
                {!leaders?.length && (
                  <div className="p-20 text-center text-muted-foreground uppercase text-xs font-bold tracking-widest">
                    No legends registered yet.
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </Shell>
  );
}

function TopPlayerCard({ rank, name, rating }: { rank: number; name: string; rating: number }) {
  const isFirst = rank === 1;
  const tier = getTier(rating);

  return (
    <Card className={cn(
      "relative border-border bg-card/50 overflow-hidden group",
      isFirst ? "order-first md:order-none scale-110 z-10 border-primary/40 bg-primary/5 neon-border shadow-2xl" : "scale-95 opacity-80"
    )}>
      <CardContent className="p-8 text-center space-y-4">
        <div className="absolute top-4 left-4 font-headline font-black text-2xl opacity-10 italic">#0{rank}</div>
        <div className="relative mx-auto w-24 h-24">
          <div className={cn(
            "w-full h-full rounded-full border-4 p-1",
            isFirst ? "border-primary neon-glow" : "border-secondary"
          )}>
            <div className="w-full h-full rounded-full bg-muted overflow-hidden">
               <img src={`https://picsum.photos/seed/${name}/100/100`} alt={name} />
            </div>
          </div>
          {isFirst && <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-primary animate-bounce"><Trophy className="w-8 h-8 fill-primary" /></div>}
        </div>
        <div>
          <h3 className="text-xl font-headline font-bold uppercase tracking-tight">{name}</h3>
          <p className={cn("text-xs font-bold uppercase tracking-widest mt-1", getTierColor(tier))}>{tier}</p>
        </div>
        <div className="text-3xl font-headline font-black text-foreground tracking-tighter">
          {rating} <span className="text-sm font-mono text-muted-foreground align-middle">ELO</span>
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderRow({ rank, name, rating, wins, games }: { rank: number; name: string; rating: number; wins: number; games: number }) {
  const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;
  const tier = getTier(rating);

  return (
    <div className="grid grid-cols-12 p-4 items-center hover:bg-muted/30 transition-colors group cursor-pointer">
      <div className="col-span-1 flex items-center gap-2">
        <span className="font-headline font-black text-xl italic opacity-30 group-hover:opacity-100 transition-opacity">#{rank.toString().padStart(2, '0')}</span>
      </div>
      <div className="col-span-5 px-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden">
          <img src={`https://picsum.photos/seed/${name}/50/50`} alt={name} />
        </div>
        <div>
          <p className="font-bold uppercase tracking-tight">{name}</p>
          <p className={cn("text-[10px] font-bold uppercase tracking-widest", getTierColor(tier))}>{tier}</p>
        </div>
      </div>
      <div className="col-span-3 text-center">
        <span className="text-xl font-headline font-bold text-foreground">{rating}</span>
      </div>
      <div className="col-span-3 text-right px-4">
         <span className="text-sm font-bold text-primary">{wins} WINS</span>
      </div>
    </div>
  );
}
