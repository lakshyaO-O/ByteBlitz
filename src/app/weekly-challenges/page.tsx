'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Target, Trophy, Sparkles, Star, Loader2,
} from 'lucide-react';

export default function WeeklyChallengesPage() {
  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            WEEKLY <span className="text-primary neon-text">CHALLENGES</span>
          </h1>
          <p className="text-muted-foreground">Compete in weekly challenges, earn XP, and climb the leaderboard.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="w-12 h-12 text-muted-foreground/30 mb-4 animate-spin" />
          <p className="text-muted-foreground font-bold">No active challenges</p>
          <p className="text-xs text-muted-foreground mt-1">Check back when the next weekly challenge starts.</p>
        </div>
      </div>
    </Shell>
  );
}
