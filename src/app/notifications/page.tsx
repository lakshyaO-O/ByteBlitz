'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, UserPlus, Swords, Trophy, Zap, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'friend_request', title: 'New Friend Request', message: 'SyntaxSamurai sent you a friend request', read: false, createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: 'n2', type: 'match_finished', title: 'Battle Result', message: 'You won against BinaryBoss! +25 ELO', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'n3', type: 'match_invitation', title: 'Match Invitation', message: 'RecursionQueen challenged you to a battle', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'n4', type: 'friend_online', title: 'Friend Online', message: 'NullPointer is now online', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'n5', type: 'match_started', title: 'Contest Starting', message: 'Weekly Contest #42 starts in 10 minutes!', read: false, createdAt: new Date(Date.now() - 600000).toISOString() },
];

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  friend_request: <UserPlus className="w-5 h-5 text-primary" />,
  match_finished: <Trophy className="w-5 h-5 text-secondary" />,
  match_invitation: <Swords className="w-5 h-5 text-orange-400" />,
  friend_online: <Zap className="w-5 h-5 text-emerald-400" />,
  match_started: <Bell className="w-5 h-5 text-yellow-400" />,
};

export default function NotificationsPage() {
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
            <Badge className="bg-primary/10 text-primary border-primary/30">
              {MOCK_NOTIFICATIONS.filter(n => !n.read).length} unread
            </Badge>
            <Button variant="outline" size="sm">Mark all read</Button>
          </div>
        </div>

        <div className="space-y-2">
          {MOCK_NOTIFICATIONS.map((notif) => (
            <Card key={notif.id} className={cn(
              'border-border transition-all hover:border-primary/30 cursor-pointer',
              !notif.read && 'border-l-2 border-l-primary bg-primary/[0.02]'
            )}>
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
