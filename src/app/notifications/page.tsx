'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, UserPlus, Swords, Trophy, Zap, Loader2, Clock, Star, TrendingUp, Calendar, Gift, Crown, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useNotifications } from '@/hooks/use-notifications';

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  friend_request: <UserPlus className="w-5 h-5 text-primary" />,
  match_finished: <Trophy className="w-5 h-5 text-secondary" />,
  match_invitation: <Swords className="w-5 h-5 text-orange-400" />,
  friend_online: <Zap className="w-5 h-5 text-emerald-400" />,
  match_started: <Bell className="w-5 h-5 text-yellow-400" />,
  contest_reminder: <Calendar className="w-5 h-5 text-purple-400" />,
  challenge_invitation: <Swords className="w-5 h-5 text-blue-400" />,
  achievement_unlock: <Star className="w-5 h-5 text-yellow-400" />,
  rank_change: <TrendingUp className="w-5 h-5 text-orange-400" />,
  announcement: <Megaphone className="w-5 h-5 text-primary" />,
};

export default function NotificationsPage() {
  const { user } = useUser();
  const { notifications, loading, unreadCount, markAsRead } = useNotifications(user?.uid || null);

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              NOTIFICATIONS
            </h1>
            <p className="text-muted-foreground">Stay updated with your arena activity.</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Badge className="bg-primary/10 text-primary border-primary/30">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notif: any) => (
              <Card
                key={notif.id}
                className={cn(
                  'border-border transition-all hover:border-primary/30 cursor-pointer',
                  !notif.read && 'border-l-2 border-l-primary bg-primary/[0.02]'
                )}
                onClick={() => markAsRead(notif.id)}
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {NOTIFICATION_ICONS[notif.type] || <Bell className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{notif.title}</p>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-lg">No notifications</p>
            <p className="text-sm mt-2">You&apos;ll see match invites, friend requests, and battle results here.</p>
          </div>
        )}
      </div>
    </Shell>
  );
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
