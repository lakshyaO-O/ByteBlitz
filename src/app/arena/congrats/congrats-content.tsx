'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Zap, ArrowLeft, Sparkles, Loader2, Swords, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchBattle } from '@/services/arena';
import type { BattleDocument } from '@/types';

function CongratsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const battleId = searchParams.get('battleId');
  const [battle, setBattle] = useState<BattleDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!battleId) { setLoading(false); return; }
    fetchBattle(battleId)
      .then((b) => { if (b) setBattle(b); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [battleId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const result = searchParams.get('result') || (battle ? (battle.winnerIds.length === 1 ? 'WIN' : 'DRAW') : 'WIN');
  const eloChange = searchParams.get('elo') || (battle && battle.players.length > 0 ? String(battle.players[0].eloChange) : '+25');
  const isWin = result === 'WIN';
  const isDraw = result === 'DRAW';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <Card className="max-w-lg w-full p-10 text-center bg-card/70 border-primary/20 shadow-xl">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Trophy className={cn("w-20 h-20", isWin ? 'text-yellow-400' : isDraw ? 'text-blue-400' : 'text-muted-foreground')} />
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>

          <Badge className={cn(
            "text-xs uppercase tracking-widest px-4 py-1",
            isWin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
            isDraw ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
            'bg-red-500/10 text-red-400 border-red-500/30',
          )}>
            {isWin ? 'Victory' : isDraw ? 'Draw' : 'Defeat'}
          </Badge>

          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter">
            {isWin ? 'Congratulations!' : isDraw ? 'Well Fought!' : 'Good Effort!'}
          </h1>
          <p className="text-muted-foreground">
            {isWin
              ? 'Your solution outperformed your opponent. ELO gained!'
              : isDraw
              ? 'You matched your opponent skill for skill. A hard-fought draw.'
              : 'A tough loss, but every battle makes you stronger. Keep pushing!'}
          </p>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className={cn("p-4 rounded-lg border", isWin ? 'bg-emerald-500/10 border-emerald-500/20' : isDraw ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20')}>
              <div className={cn("text-3xl font-headline font-bold", isWin ? 'text-emerald-400' : isDraw ? 'text-blue-400' : 'text-red-400')}>
                {eloChange.startsWith('-') ? eloChange : `+${eloChange}`}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">ELO</div>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-3xl font-headline font-bold text-primary">+{isWin ? '100' : isDraw ? '50' : '20'}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">XP Earned</div>
            </div>
          </div>

          {battle && (
            <div className="space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Problem</span>
                <span className="font-medium">{battle.problem.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-mono">{Math.floor(battle.totalTimeMs / 60000)} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rated</span>
                <Badge variant="outline" className="text-[10px]">{battle.rated ? 'Yes' : 'No'}</Badge>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link href="/arena">
              <Button className="w-full h-12 gap-2">
                <Zap className="w-4 h-4" /> Enter Next Battle
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full h-12 gap-2">
                <ArrowLeft className="w-4 h-4" /> View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function CongratsContentWrapper() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <CongratsContent />
    </Suspense>
  );
}
