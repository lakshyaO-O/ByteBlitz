"use client"

import React from 'react';
import { Swords, Trophy, Users, Zap, Activity, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArenaHeaderProps {
  activeBattles?: number;
  onlinePlayers?: number;
  userRating?: number;
  userTier?: string;
  className?: string;
}

export function ArenaHeader({
  activeBattles = 0,
  onlinePlayers = 0,
  userRating = 0,
  userTier = '',
  className,
}: ArenaHeaderProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center text-center space-y-8 py-16">
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-primary/30 bg-primary/5">
            <Swords className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Zap className="w-4 h-4 text-primary fill-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tighter uppercase neon-text">
            THE ARENA
          </h1>
          <p className="text-muted-foreground font-headline text-sm uppercase tracking-[0.25em] flex items-center justify-center gap-2">
            <Zap className="w-3 h-3 text-primary/50" />
            Compete. Conquer. Climb the Ranks.
            <Zap className="w-3 h-3 text-primary/50" />
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-headline font-bold uppercase tracking-wider text-primary">
            <Activity className="w-3.5 h-3.5" />
            <span>{activeBattles}</span>
            <span className="text-primary/70">Active Battles</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-headline font-bold uppercase tracking-wider text-primary">
            <Users className="w-3.5 h-3.5" />
            <span>{onlinePlayers}</span>
            <span className="text-primary/70">Online</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-headline font-bold uppercase tracking-wider text-primary">
            <Trophy className="w-3.5 h-3.5" />
            <span>{userRating}</span>
            <span className="text-primary/70">Rating</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-headline font-bold uppercase tracking-wider text-primary">
            <Shield className="w-3.5 h-3.5" />
            {userTier ? <span>{userTier}</span> : <span className="text-primary/50">&mdash;</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
