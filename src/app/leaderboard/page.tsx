import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, ChevronUp, ChevronDown, User, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, getTier, getTierColor } from '@/lib/utils';

export default function LeaderboardPage() {
  const leaderData = [
    { rank: 1, name: "BinaryWizard", rating: 2842, change: "up", wins: 842, games: 1200 },
    { rank: 2, name: "LogicLords", rating: 2715, change: "none", wins: 765, games: 1050 },
    { rank: 3, name: "NullPointer_Ex", rating: 2698, change: "down", wins: 712, games: 980 },
    { rank: 4, name: "AsyncLegend", rating: 2542, change: "up", wins: 532, games: 740 },
    { rank: 5, name: "CodeRunnerX", rating: 2431, change: "up", wins: 412, games: 620 },
    { rank: 6, name: "GitGud_007", rating: 2315, change: "down", wins: 389, games: 590 },
    { rank: 7, name: "RustEnthusiast", rating: 2284, change: "up", wins: 342, games: 510 },
    { rank: 8, name: "Pythonista", rating: 2156, change: "none", wins: 312, games: 480 },
  ];

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
          <p className="text-muted-foreground">The top 0.1% of architects currently dominating the arena.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TopPlayerCard rank={2} name="LogicLords" rating={2715} avatar="2" />
          <TopPlayerCard rank={1} name="BinaryWizard" rating={2842} avatar="1" />
          <TopPlayerCard rank={3} name="NullPointer_Ex" rating={2698} avatar="3" />
        </div>

        <Card className="bg-card/50 border-border overflow-hidden">
          <div className="bg-muted/50 p-4 border-b border-border grid grid-cols-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5 px-4">Architect</div>
            <div className="col-span-2 text-center">Elo Rating</div>
            <div className="col-span-2 text-center">Wins</div>
            <div className="col-span-2 text-right">Win Rate</div>
          </div>
          <div className="divide-y divide-border">
            {leaderData.map((player) => (
              <LeaderRow key={player.rank} {...player} />
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  );
}

function TopPlayerCard({ rank, name, rating, avatar }: { rank: number; name: string; rating: number; avatar: string }) {
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
        <Button variant={isFirst ? "default" : "outline"} size="sm" className={cn("w-full uppercase font-bold text-xs tracking-widest", isFirst ? "bg-primary text-background" : "")}>
          View Profile
        </Button>
      </CardContent>
    </Card>
  );
}

function LeaderRow({ rank, name, rating, change, wins, games }: { rank: number; name: string; rating: number; change: string; wins: number; games: number }) {
  const winRate = Math.round((wins / games) * 100);
  const tier = getTier(rating);

  return (
    <div className="grid grid-cols-12 p-4 items-center hover:bg-muted/30 transition-colors group cursor-pointer">
      <div className="col-span-1 flex items-center gap-2">
        <span className="font-headline font-black text-xl italic opacity-30 group-hover:opacity-100 transition-opacity">#{rank.toString().padStart(2, '0')}</span>
        {change === 'up' && <ChevronUp className="w-3 h-3 text-emerald-500" />}
        {change === 'down' && <ChevronDown className="w-3 h-3 text-destructive" />}
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
      <div className="col-span-2 text-center">
        <span className="text-xl font-headline font-bold text-foreground">{rating}</span>
      </div>
      <div className="col-span-2 text-center text-sm font-bold text-muted-foreground">{wins}</div>
      <div className="col-span-2 text-right">
        <div className="inline-flex items-center gap-2">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
            <div className="h-full bg-primary" style={{ width: `${winRate}%` }} />
          </div>
          <span className="text-sm font-bold text-primary">{winRate}%</span>
        </div>
      </div>
    </div>
  );
}
