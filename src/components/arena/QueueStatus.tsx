"use client"
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Search, X, Clock, Swords, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuestGate } from '@/components/auth/GuestGate';

interface QueueStatusProps {
  isSearching: boolean;
  queueTime: number;
  eloRange: number;
  onCancel: () => void;
  onStartSearch: () => void;
  error?: string | null;
  className?: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export function QueueStatus({
  isSearching,
  queueTime,
  eloRange,
  onCancel,
  onStartSearch,
  error,
  className,
}: QueueStatusProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-8 py-12', className)}>
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

      {!isSearching ? (
        <GuestGate feature="Join Arena Matchmaking" redirectPath="/arena">
          <Button
            size="lg"
            onClick={onStartSearch}
            className="h-16 px-12 text-lg font-headline font-bold bg-primary text-background hover:bg-primary/90 rounded-none transform transition-transform hover:scale-105 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            ENTER MATCHMAKING
          </Button>
        </GuestGate>
      ) : (
        <Card className="w-full max-w-lg border-primary/30 bg-primary/5 animate-in fade-in zoom-in duration-300">
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-primary font-headline font-bold uppercase tracking-widest text-sm">
                  Searching for opponent...
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-mono font-bold">{formatTime(queueTime)}</span>
                  <span className="text-muted-foreground">ELAPSED</span>
                </div>
              </div>
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-mono uppercase text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  ELO Range: &plusmn;{eloRange}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Queue Time: {formatTime(queueTime)}
                </span>
              </div>
              <div className="h-2 bg-muted overflow-hidden rounded-full">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${Math.min((queueTime / 30) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Scanning for opponents in your ELO range...
            </div>

            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={onCancel}
            >
              <X className="w-4 h-4" />
              CANCEL SEARCH
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
