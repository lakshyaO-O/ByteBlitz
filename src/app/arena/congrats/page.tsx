'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Zap, ArrowLeft, Sparkles } from 'lucide-react';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CongratsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eloChange = searchParams.get('elo') || '+25';
  const result = searchParams.get('result') || 'WIN';

  return (
    <Shell>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <Card className="max-w-lg w-full p-10 text-center bg-card/70 border-primary/30 shadow-2xl neon-border">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Trophy className="w-20 h-20 text-yellow-400" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>

            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs uppercase tracking-widest px-4 py-1">
              Victory
            </Badge>

            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter neon-text">
              Congratulations!
            </h1>
            <p className="text-muted-foreground">
              Your solution passed all test cases and you defeated your opponent.
            </p>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-3xl font-headline font-bold text-emerald-400">+25</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">ELO Gained</div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-3xl font-headline font-bold text-primary">+50</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">XP Earned</div>
              </div>
            </div>

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
    </Shell>
  );
}
