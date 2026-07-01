'use client';

import React from 'react';
import { Swords, Search, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchmakingAnimationProps {
  status: 'searching' | 'found' | 'connecting' | 'ready';
  opponentName?: string;
  className?: string;
}

export function MatchmakingAnimation({ status, opponentName, className }: MatchmakingAnimationProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-6', className)}>
      {status === 'searching' && (
        <>
          <div className="relative flex items-center justify-center w-32 h-32">
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            <div className="absolute inset-4 rounded-full border-2 border-primary/40 animate-pulse" />
            <div className="absolute inset-8 rounded-full border-2 border-primary/50" />
            <Search className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <p className="text-primary font-headline font-bold uppercase tracking-widest text-sm">
            Searching for opponent...
          </p>
        </>
      )}

      {status === 'found' && (
        <>
          <div className="relative flex items-center justify-center w-32 h-32">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
            <div className="relative flex items-center gap-2">
              <Swords className="w-14 h-14 text-primary -rotate-45 animate-bounce" />
              <Swords className="w-14 h-14 text-primary rotate-45 animate-bounce delay-75" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-primary font-headline font-bold uppercase tracking-widest text-sm">
              Opponent Found!
            </p>
            {opponentName && (
              <p className="text-foreground font-headline font-bold text-lg">
                {opponentName}
              </p>
            )}
          </div>
        </>
      )}

      {status === 'connecting' && (
        <>
          <div className="relative flex items-center justify-center w-32 h-32">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <Zap className="absolute w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-primary font-headline font-bold uppercase tracking-widest text-sm">
            Connecting to battle...
          </p>
        </>
      )}

      {status === 'ready' && (
        <>
          <div className="relative flex items-center justify-center w-32 h-32">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse" />
            <div className="absolute inset-2 rounded-full border-2 border-green-500/40" />
            <Zap className="w-14 h-14 text-green-400" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-green-400 font-headline font-bold uppercase tracking-widest text-sm">
              Ready to Battle!
            </p>
          </div>
        </>
      )}
    </div>
  );
}
