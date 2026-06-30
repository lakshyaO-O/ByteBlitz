'use client';

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Swords,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { useFriends, useSendFriendRequest, useAcceptFriendRequest } from '@/hooks/use-friends';
import { useToast } from '@/hooks/use-toast';
import { getTier, getTierColor } from '@/lib/utils';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

export default function FriendsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const { friends, loading } = useFriends(user?.uid || null);

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  React.useEffect(() => {
    if (!user || !db) {
      setPendingLoading(false);
      return;
    }
    const q = query(
      collection(db, 'users', user.uid, 'friendRequests'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setPendingRequests(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      setPendingLoading(false);
    }, () => {
      setPendingLoading(false);
    });
    return () => unsub();
  }, [user, db]);

  const friendsList = friends || [];
  const pendingList = pendingRequests.filter((r: any) => r.status === 'pending');

  const onlineFriends = friendsList.filter((f: any) => f.onlineStatus === 'online');
  const inGameFriends = friendsList.filter((f: any) => f.onlineStatus === 'in-game');

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              FRIENDS
            </h1>
            <p className="text-muted-foreground">Connect with other architects and challenge them to battles.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6 text-center space-y-2">
              <Users className="w-8 h-8 text-primary mx-auto" />
              <div className="text-3xl font-headline font-bold">{friendsList.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Friends</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6 text-center space-y-2">
              <UserCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-3xl font-headline font-bold">{onlineFriends.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Online</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6 text-center space-y-2">
              <Swords className="w-8 h-8 text-secondary mx-auto" />
              <div className="text-3xl font-headline font-bold">{inGameFriends.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">In Game</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All Friends</TabsTrigger>
              <TabsTrigger value="online">Online</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingList.length})</TabsTrigger>
            </TabsList>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                className="pl-10 bg-muted/50 border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="all">
            <div className="grid gap-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : friendsList.length > 0 ? (
                friendsList
                  .filter((f: any) => f.username?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((friend: any) => (
                    <FriendCard key={friend.friendId || friend.id} friend={friend} />
                  ))
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-bold uppercase tracking-widest text-sm">No friends yet</p>
                  <p className="text-xs mt-2">Search for other players and send them a friend request!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="online">
            <div className="grid gap-4">
              {friendsList.filter((f: any) => f.onlineStatus !== 'offline').length > 0 ? (
                friendsList.filter((f: any) => f.onlineStatus !== 'offline').map((friend: any) => (
                  <FriendCard key={friend.friendId || friend.id} friend={friend} />
                ))
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-bold uppercase tracking-widest text-sm">No friends online</p>
                  <p className="text-xs mt-2">Invite friends to start competing!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="grid gap-4">
              {pendingLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : pendingList.length > 0 ? (
                pendingList.map((req: any) => (
                  <PendingRequestCard key={req.id} request={req} />
                ))
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-bold uppercase tracking-widest text-sm">No pending requests</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}

function FriendCard({ friend }: { friend: any }) {
  const statusColors: Record<string, string> = {
    online: 'bg-emerald-400',
    offline: 'bg-muted-foreground',
    'in-game': 'bg-secondary',
  };

  const statusLabels: Record<string, string> = {
    online: 'Online',
    offline: 'Offline',
    'in-game': 'In Game',
  };

  return (
    <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border border-muted">
              <AvatarImage src={friend.photoURL} />
              <AvatarFallback className="bg-muted text-sm">{(friend.username || '?')[0]}</AvatarFallback>
            </Avatar>
            <div className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background',
              statusColors[friend.onlineStatus] || 'bg-muted-foreground'
            )} />
          </div>
          <div>
            <p className="font-bold">{friend.username}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn('font-bold uppercase tracking-widest', getTierColor(getTier(friend.rating || 1200)))}>
                {friend.tier || getTier(friend.rating || 1200)}
              </span>
              <span>•</span>
              <span>{friend.rating || 1200} ELO</span>
              <span>•</span>
              <span>{statusLabels[friend.onlineStatus] || 'Unknown'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1">
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" className="gap-1">
            <Swords className="w-4 h-4" /> Challenge
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PendingRequestCard({ request }: { request: any }) {
  const { toast } = useToast();
  const { acceptRequest, rejectRequest } = useAcceptFriendRequest();

  const handleAccept = async () => {
    const success = await acceptRequest({
      requestId: request.id,
      toUserId: request.toUserId,
      fromUser: {
        uid: request.fromUserId,
        username: request.fromUsername,
        photoURL: request.fromPhotoURL,
      },
    });
    if (success) {
      toast({ title: 'Friend request accepted!' });
    }
  };

  const handleDecline = async () => {
    const success = await rejectRequest(request.id, request.toUserId);
    if (success) {
      toast({ title: 'Friend request declined' });
    }
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border border-muted">
            <AvatarImage src={request.fromPhotoURL} />
            <AvatarFallback className="bg-muted text-xs">{(request.fromUsername || '?')[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold">{request.fromUsername}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pending friend request
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1 text-emerald-400 hover:text-emerald-300" onClick={handleAccept}>
            <CheckCircle2 className="w-4 h-4" /> Accept
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={handleDecline}>
            <XCircle className="w-4 h-4" /> Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
