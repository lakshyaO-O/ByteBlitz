'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Users, UserPlus, UserCheck, Search, Loader2, Clock, CheckCircle2, XCircle, MessageCircle, Swords, Ban, Trash2, UserMinus, ShieldOff, Copy,
} from 'lucide-react';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { useFriends, useBlockedUsers, useSendFriendRequest, useAcceptFriendRequest, useRemoveFriend, useBlockUser, useUnblockUser } from '@/hooks/use-friends';
import { useActiveRoom, useSendRoomInvite } from '@/hooks/use-rooms';
import { createOrGetChat } from '@/services/chat';
import { useToast } from '@/hooks/use-toast';
import { GuestGate } from '@/components/auth/GuestGate';
import { EmptyState } from '@/components/premium/EmptyState';
import { collection, query, where, getDocs, limit, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export default function FriendsPage() {
  const { user, loading: userLoading } = useUser();
  const db = initializeFirebase().firestore;
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearching, setUserSearching] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const { friends, loading: friendsLoading } = useFriends(user?.uid || null);
  const { blocked, loading: blockedLoading } = useBlockedUsers(user?.uid || null);
  const { sendRequest, loading: sendingRequest } = useSendFriendRequest();
  const { acceptRequest, rejectRequest } = useAcceptFriendRequest();
  const { removeFriend } = useRemoveFriend();
  const { blockUser } = useBlockUser();
  const { unblockUser } = useUnblockUser();
  const { room: activeRoom } = useActiveRoom(user?.uid || null);
  const { sendInvite } = useSendRoomInvite();

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  React.useEffect(() => {
    if (!user || !db) { setPendingLoading(false); return; }
    const q = query(collection(db, 'users', user.uid, 'friendRequests'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snapshot: any) => {
      setPendingRequests(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      setPendingLoading(false);
    }, () => { setPendingLoading(false); });
    return () => unsub();
  }, [user, db]);

  const friendsList = friends || [];
  const pendingList = pendingRequests || [];
  const onlineFriends = friendsList.filter((f: any) => f.onlineStatus === 'online');
  const inGameFriends = friendsList.filter((f: any) => f.onlineStatus === 'in-game');

  const handleSearchUsers = async () => {
    if (!user || userSearchQuery.trim().length < 2) return;
    setUserSearching(true);
    setUserSearchResults([]);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      const q = query(collection(db, 'usernames'), where('name', '>=', userSearchQuery.toLowerCase()), where('name', '<=', userSearchQuery.toLowerCase() + '\uf8ff'), limit(10));
      const snap = await getDocs(q);
      const results: any[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        if (data.userId === user.uid) continue;
        const userDoc = await getDoc(doc(db, 'users', data.userId));
        if (userDoc.exists()) {
          const u = userDoc.data();
          results.push({ uid: data.userId, username: u.username, photoURL: u.photoURL, rating: u.rating || 1200, tier: u.tier || 'Beginner', onlineStatus: u.onlineStatus || 'offline', publicId: u.publicId });
        }
      }
      setUserSearchResults(results);
    } catch { toast({ variant: 'destructive', title: 'Search failed' }); }
    finally { setUserSearching(false); }
  };

  const handleSendRequest = async (targetUser: any) => {
    if (!user) return;
    const success = await sendRequest({
      fromUserId: user.uid, fromUsername: user.displayName || 'Player', fromPhotoURL: user.photoURL || '',
      toUserId: targetUser.uid, toUsername: targetUser.username || 'Player',
    });
    if (success) {
      toast({ title: 'Friend request sent!', description: `Request sent to ${targetUser.username}` });
      setUserSearchResults(prev => prev.filter(u => u.uid !== targetUser.uid));
    } else {
      toast({ variant: 'destructive', title: 'Failed to send request' });
    }
  };

  const handleAcceptRequest = async (req: any) => {
    const success = await acceptRequest({
      requestId: req.id, toUserId: user?.uid || '', fromUser: { uid: req.fromUserId, username: req.fromUsername, photoURL: req.fromPhotoURL },
    });
    if (success) toast({ title: 'Friend request accepted!' });
    else toast({ variant: 'destructive', title: 'Failed to accept' });
  };

  const handleDeclineRequest = async (req: any) => {
    const success = await rejectRequest(req.id, user?.uid || '');
    if (success) toast({ title: 'Request declined' });
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    const success = await removeFriend(user.uid, friendId);
    if (success) toast({ title: 'Friend removed' });
    else toast({ variant: 'destructive', title: 'Failed to remove' });
  };

  const handleBlockUser = async (targetId: string, username: string) => {
    if (!user) return;
    const success = await blockUser(user.uid, targetId, username);
    if (success) toast({ title: 'User blocked', description: `${username} has been blocked.` });
  };

  const handleUnblockUser = async (targetId: string) => {
    if (!user) return;
    const success = await unblockUser(user.uid, targetId);
    if (success) toast({ title: 'User unblocked' });
  };

  const handleInviteToRoom = async (targetId: string, username: string) => {
    if (!user) return;
    if (!activeRoom) {
      toast({ variant: 'destructive', title: 'No active room', description: 'Create or join a room first.' });
      return;
    }
    const success = await sendInvite({
      roomId: activeRoom.id, roomCode: activeRoom.roomCode,
      fromUserId: user.uid, fromUsername: user.displayName || 'Player', toUserId: targetId,
    });
    if (success) toast({ title: 'Invite sent!', description: `${username} has been invited to your room.` });
  };

  const handleMessage = async (targetId: string) => {
    if (!user) return;
    const chatId = await createOrGetChat(user.uid, targetId);
    if (chatId) router.push('/chats');
  };

  const FriendActions = ({ friend }: { friend: any }) => (
    <div className="flex gap-1">
      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={() => handleMessage(friend.friendId)} title="Message">
        <MessageCircle className="w-4 h-4" />
      </Button>
      {activeRoom && (
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={() => handleInviteToRoom(friend.friendId, friend.username)} title="Invite to room">
          <Copy className="w-4 h-4" />
        </Button>
      )}
      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveFriend(friend.friendId)} title="Remove friend">
        <UserMinus className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleBlockUser(friend.friendId, friend.username)} title="Block user">
        <Ban className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              FRIENDS
            </h1>
            <p className="text-muted-foreground">Connect with other architects and challenge them to battles.</p>
          </div>
          <GuestGate feature="Search Players" redirectPath="/friends">
            <Button className="gap-2" onClick={() => setSearchDialogOpen(true)}>
              <UserPlus className="w-4 h-4" /> Add Friend
            </Button>
          </GuestGate>
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

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All Friends</TabsTrigger>
              <TabsTrigger value="online">Online</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingList.length})</TabsTrigger>
              <TabsTrigger value="blocked">Blocked ({blocked.length})</TabsTrigger>
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
              {friendsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : friendsList.length > 0 ? (
                friendsList.filter((f: any) => f.username?.toLowerCase().includes(searchQuery.toLowerCase())).map((friend: any) => (
                  <FriendCard key={friend.friendId || friend.id} friend={friend} actions={<FriendActions friend={friend} />} />
                ))
              ) : (
                <EmptyState icon={Users} title="No friends yet" description="Search for other players and send them a friend request!" actionLabel="Find Players" onAction={() => setSearchDialogOpen(true)} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="online">
            <div className="grid gap-4">
              {friendsList.filter((f: any) => f.onlineStatus !== 'offline').length > 0 ? (
                friendsList.filter((f: any) => f.onlineStatus !== 'offline').filter((f: any) => f.username?.toLowerCase().includes(searchQuery.toLowerCase())).map((friend: any) => (
                  <FriendCard key={friend.friendId || friend.id} friend={friend} actions={<FriendActions friend={friend} />} />
                ))
              ) : (
                <EmptyState icon={UserCheck} title="No friends online" description="No friends are currently online." />
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="grid gap-4">
              {pendingLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : pendingList.length > 0 ? (
                pendingList.map((req: any) => (
                  <Card key={req.id} className="bg-card/50 border-border">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-muted">
                          <AvatarImage src={req.fromPhotoURL} />
                          <AvatarFallback className="bg-muted text-xs">{(req.fromUsername || '?')[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{req.fromUsername}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Pending friend request</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1 text-emerald-400 hover:text-emerald-300" onClick={() => handleAcceptRequest(req)}><CheckCircle2 className="w-4 h-4" /> Accept</Button>
                        <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => handleDeclineRequest(req)}><XCircle className="w-4 h-4" /> Decline</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState icon={UserCheck} title="No pending requests" description="Search for players to send friend requests!" actionLabel="Find Players" onAction={() => setSearchDialogOpen(true)} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="blocked">
            <div className="grid gap-4">
              {blockedLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : blocked.length > 0 ? (
                blocked.filter((b: any) => b.username?.toLowerCase().includes(searchQuery.toLowerCase())).map((b: any) => (
                  <Card key={b.blockedUserId} className="bg-card/50 border-border">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                          <Ban className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-bold">{b.username}</p>
                          <p className="text-xs text-muted-foreground">Blocked</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => handleUnblockUser(b.blockedUserId)}>
                        <ShieldOff className="w-4 h-4" /> Unblock
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState icon={Ban} title="No blocked users" description="Blocked users will appear here." />
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Add Friend</DialogTitle>
              <DialogDescription>Search by username to find and add friends.</DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Input
                placeholder="Search by username..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                className="flex-1"
              />
              <Button onClick={handleSearchUsers} disabled={userSearching || userSearchQuery.trim().length < 2}>
                {userSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {userSearchResults.length > 0 ? userSearchResults.map((u) => (
                <div key={u.uid} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-muted">
                      <AvatarImage src={u.photoURL} />
                      <AvatarFallback className="bg-muted text-xs">{(u.username || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-sm">{u.username}</p>
                      <p className="text-[10px] text-muted-foreground">{u.tier} &middot; {u.rating} ELO</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleSendRequest(u)} disabled={sendingRequest}>Add Friend</Button>
                </div>
              )) : userSearchQuery.trim().length >= 2 && !userSearching ? (
                <p className="text-center text-sm text-muted-foreground py-4">No users found</p>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}

function FriendCard({ friend, actions }: { friend: any; actions: React.ReactNode }) {
  const statusColors: Record<string, string> = { online: 'bg-emerald-400', offline: 'bg-muted-foreground', 'in-game': 'bg-secondary' };
  const statusLabels: Record<string, string> = { online: 'Online', offline: 'Offline', 'in-game': 'In Game' };

  return (
    <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border border-muted">
              <AvatarImage src={friend.photoURL} />
              <AvatarFallback className="bg-muted text-sm">{(friend.username || '?')[0]}</AvatarFallback>
            </Avatar>
            <div className={cn('absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background', statusColors[friend.onlineStatus] || 'bg-muted-foreground')} />
          </div>
          <div>
            <p className="font-bold">{friend.username}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn('font-bold uppercase tracking-widest', getTierColor(getTier(friend.rating || 1200)))}>{friend.tier || getTier(friend.rating || 1200)}</span>
              <span>&bull;</span>
              <span>{friend.rating || 1200} ELO</span>
              <span>&bull;</span>
              <span>{statusLabels[friend.onlineStatus] || 'Unknown'}</span>
            </div>
          </div>
        </div>
        {actions}
      </CardContent>
    </Card>
  );
}
