'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { initializeFirebase } from '@/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { ActivityEvent } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { Zap, Trophy, Flame, Crown, Users, Star, Swords, Target, TrendingUp } from 'lucide-react';

const ACTIVITY_ICONS: Record<string, any> = {
  match_won: Trophy,
  match_lost: Swords,
  match_draw: Swords,
  achievement_unlocked: Star,
  level_up: TrendingUp,
  challenge_completed: Target,
  login_streak: Flame,
  friend_added: Users,
  rank_up: Crown,
};

const ACTIVITY_COLORS: Record<string, string> = {
  match_won: 'text-emerald-400',
  match_lost: 'text-destructive',
  match_draw: 'text-yellow-400',
  achievement_unlocked: 'text-yellow-400',
  level_up: 'text-primary',
  challenge_completed: 'text-emerald-400',
  login_streak: 'text-orange-400',
  friend_added: 'text-blue-400',
  rank_up: 'text-purple-400',
};

interface ActivityFeedProps {
  userId?: string;
  global?: boolean;
}

export function ActivityFeed({ userId, global = false }: ActivityFeedProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { firestore: db } = initializeFirebase();
    if (!db) { setLoading(false); return; }

    let q;
    if (global) {
      q = query(collection(db, 'activity'), orderBy('timestamp', 'desc'), limit(20));
    } else if (userId) {
      q = query(collection(db, 'users', userId, 'activity'), orderBy('timestamp', 'desc'), limit(20));
    } else {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(q, (snapshot: any) => {
      setActivities(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [userId, global]);

  const timeAgo = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const seconds = Math.floor((now - then) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-headline font-bold">
          {global ? 'Global Activity' : 'Your Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type] || Zap;
              const color = ACTIVITY_COLORS[activity.type] || 'text-muted-foreground';
              return (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                  <Avatar className="w-8 h-8 border border-border">
                    <AvatarImage src={activity.photoURL || ''} />
                    <AvatarFallback className="text-xs bg-primary/10">
                      {(activity.username || '?')[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-bold">{activity.username}</span>
                      {' '}{activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Icon className={cn('w-3 h-3', color)} />
                      <span className="text-[10px] text-muted-foreground">{timeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
