'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Send, User, Search, Loader2, Check, X, UserPlus } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { useFriends } from '@/hooks/use-friends';
import { sendRoomInvite } from '@/services/arena.service';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface FriendInviteDialogProps {
  roomId: string;
  roomCode: string;
}

export function FriendInviteDialog({ roomId, roomCode }: FriendInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualUsername, setManualUsername] = useState('');
  const [inviteStates, setInviteStates] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});
  const [manualStatus, setManualStatus] = useState<{ type: 'sending' | 'sent' | 'error' | 'not_found'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { user } = useUser();
  const { friends, loading: friendsLoading } = useFriends(user?.uid ?? null);

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [roomCode]);

  const handleInviteFriend = useCallback(async (friendId: string) => {
    if (!user) return;
    setInviteStates((prev) => ({ ...prev, [friendId]: 'sending' }));
    try {
      await sendRoomInvite(user.uid, user.displayName || 'Player', friendId, roomId, roomCode);
      setInviteStates((prev) => ({ ...prev, [friendId]: 'sent' }));
    } catch {
      setInviteStates((prev) => ({ ...prev, [friendId]: 'error' }));
    }
  }, [user, roomId, roomCode]);

  const handleManualInvite = useCallback(async () => {
    if (!user || !manualUsername.trim()) return;
    setManualStatus({ type: 'sending', message: 'Sending invite...' });
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setManualStatus({ type: 'error', message: 'Firebase unavailable' }); return; }
      const q = query(collection(db, 'users'), where('username', '==', manualUsername.trim()));
      const snap = await getDocs(q);
      const targetUser = snap.docs.find((d) => d.id !== user.uid);
      if (!targetUser) {
        setManualStatus({ type: 'not_found', message: 'User not found' });
        return;
      }
      await sendRoomInvite(user.uid, user.displayName || 'Player', targetUser.id, roomId, roomCode);
      setManualStatus({ type: 'sent', message: `Invite sent to ${manualUsername.trim()}!` });
      setManualUsername('');
    } catch {
      setManualStatus({ type: 'error', message: 'Failed to send invite' });
    }
  }, [user, manualUsername, roomId, roomCode]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <UserPlus className="w-4 h-4 text-primary" /> Invite to Room
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Room Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-lg font-mono font-bold tracking-widest text-center py-2 rounded-md bg-background border border-border">
                {roomCode}
              </code>
              <Button variant="outline" size="sm" className="shrink-0" onClick={handleCopyCode}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">Share this code with friends to invite them</p>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            {friendsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFriends.length > 0 ? (
              <ScrollArea className="h-48 rounded-md border border-border">
                <div className="p-1 space-y-0.5">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.friendId}
                      className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={friend.photoURL} />
                        <AvatarFallback className="text-xs bg-primary/20">
                          {(friend.username || '?')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{friend.username}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-4',
                              friend.onlineStatus === 'online' && 'border-green-500/50 text-green-500',
                              friend.onlineStatus === 'in-game' && 'border-yellow-500/50 text-yellow-500',
                              friend.onlineStatus === 'offline' && 'border-gray-500/50 text-gray-500',
                            )}
                          >
                            {friend.onlineStatus === 'online' ? 'Online' : friend.onlineStatus === 'in-game' ? 'In Game' : 'Offline'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{friend.rating} rating</p>
                      </div>
                      <Button
                        size="sm"
                        variant={inviteStates[friend.friendId] === 'sent' ? 'secondary' : 'default'}
                        className="h-8 shrink-0 gap-1.5 text-xs"
                        disabled={inviteStates[friend.friendId] === 'sending' || inviteStates[friend.friendId] === 'sent'}
                        onClick={() => handleInviteFriend(friend.friendId)}
                      >
                        {inviteStates[friend.friendId] === 'sending' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : inviteStates[friend.friendId] === 'sent' ? (
                          <Check className="w-3 h-3" />
                        ) : inviteStates[friend.friendId] === 'error' ? (
                          <X className="w-3 h-3" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        {inviteStates[friend.friendId] === 'sent' ? 'Invited' : inviteStates[friend.friendId] === 'error' ? 'Failed' : 'Invite'}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-1">
                <User className="w-8 h-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No friends match your search' : 'No friends yet'}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Share the room code above to invite anyone
                </p>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or invite by username</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter username..."
              value={manualUsername}
              onChange={(e) => setManualUsername(e.target.value)}
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleManualInvite()}
            />
            <Button
              size="sm"
              className="h-9 shrink-0 gap-1.5"
              disabled={!manualUsername.trim() || manualStatus?.type === 'sending'}
              onClick={handleManualInvite}
            >
              {manualStatus?.type === 'sending' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </Button>
          </div>
          {manualStatus && (
            <div
              className={cn(
                'flex items-center gap-2 text-xs rounded-md px-3 py-2',
                manualStatus.type === 'sent' && 'bg-green-500/10 text-green-600',
                manualStatus.type === 'error' && 'bg-red-500/10 text-red-500',
                manualStatus.type === 'not_found' && 'bg-yellow-500/10 text-yellow-600',
              )}
            >
              {manualStatus.type === 'sent' ? (
                <Check className="w-3 h-3 shrink-0" />
              ) : manualStatus.type === 'sending' ? (
                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              ) : (
                <X className="w-3 h-3 shrink-0" />
              )}
              {manualStatus.message}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
