'use client';

import { Users, MessageSquare, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommunityHeaderProps {
  onNewPost: () => void;
  memberCount?: number;
  postsToday?: number;
  className?: string;
}

function AnimatedNumber({ value, label, icon: Icon }: { value?: number; label: string; icon: any }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50">
      <Icon className="w-3.5 h-3.5 text-primary" />
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-bold tabular-nums text-foreground">
          {value ?? '—'}
        </span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export function CommunityHeader({ onNewPost, memberCount, postsToday, className }: CommunityHeaderProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-background', className)}>
      <div className="absolute inset-0 bg-ambient-alt pointer-events-none" />
      <div className="relative p-6 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-xl font-headline font-bold text-foreground">
                Developer Community
              </h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              Share code, showcase projects, discuss programming topics, and connect with fellow developers.
              Learn together and grow your skills.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <AnimatedNumber value={memberCount} label="members" icon={Users} />
              <AnimatedNumber value={postsToday} label="posts today" icon={MessageSquare} />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Active</span>
              </div>
            </div>
          </div>
          <Button
            onClick={onNewPost}
            size="sm"
            className="gap-1.5 shrink-0 press-effect"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            New Post
          </Button>
        </div>
      </div>
    </div>
  );
}
