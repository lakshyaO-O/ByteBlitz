"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DoorOpen, Copy, Check, UserPlus, Hash, Users, LogIn, X, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { useCreateRoom, useJoinRoom, useActiveRoom, useLeaveRoom, useRoomByCode, useStartMatch } from '@/hooks/use-rooms';
import { FriendInviteDialog } from './FriendInviteDialog';

interface PrivateRoomPanelProps {
  className?: string;
}

export function PrivateRoomPanel({ className }: PrivateRoomPanelProps) {
  const { user } = useUser();
  const { room: activeRoom, loading: activeRoomLoading, subscribeToRoom, clearRoom } = useActiveRoom(user?.uid || null);
  const { createRoom, loading: creating, error: createError } = useCreateRoom();
  const { joinRoom, loading: joining, error: joinError } = useJoinRoom();
  const { leaveRoom, loading: leaving } = useLeaveRoom();
  const { startMatch, loading: starting } = useStartMatch();
  const [joinCode, setJoinCode] = useState('');
  const [lookupCode, setLookupCode] = useState<string | null>(null);
  const { room: lookedUpRoom, loading: lookingUp } = useRoomByCode(lookupCode);
  const [newRoomCode, setNewRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = useCallback(async () => {
    if (!user) return;
    setError(null);
    const room = await createRoom({
      hostId: user.uid,
      hostName: user.displayName || 'Player',
    });
    if (room) {
      setNewRoomCode(room.roomCode);
      subscribeToRoom(room.id);
    }
  }, [user, createRoom, subscribeToRoom]);

  const handleJoinRoom = useCallback(async () => {
    if (!user || !lookedUpRoom) return;
    setError(null);
    const result = await joinRoom({
      roomId: lookedUpRoom.id,
      userId: user.uid,
      username: user.displayName || 'Player',
    });
    if (result) {
      subscribeToRoom(lookedUpRoom.id);
      setJoinCode('');
      setLookupCode(null);
    }
  }, [user, lookedUpRoom, joinRoom, subscribeToRoom]);

  const handleLeaveRoom = useCallback(async () => {
    if (!user || !activeRoom) return;
    setError(null);
    await leaveRoom(activeRoom.id, user.uid);
    clearRoom();
    setNewRoomCode(null);
  }, [user, activeRoom, leaveRoom, clearRoom]);

  const handleStartMatch = useCallback(async () => {
    if (!activeRoom) return;
    setError(null);
    await startMatch(activeRoom.id);
  }, [activeRoom, startMatch]);

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const handleLookupCode = useCallback(() => {
    setError(null);
    setLookupCode(joinCode.trim().toUpperCase() || null);
  }, [joinCode]);

  useEffect(() => {
    if (lookedUpRoom === null && lookupCode) {
      setError('No room found with that code');
    } else if (lookedUpRoom) {
      setError(null);
    }
  }, [lookedUpRoom, lookupCode]);

  const currentError = error || createError || joinError;

  const players = activeRoom?.players || [];
  const playerNames = activeRoom?.playerNames || {};
  const isHost = activeRoom?.hostId === user?.uid;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DoorOpen className="w-5 h-5" />
          Private Room
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeRoomLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {currentError && (
          <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg">
            <p className="text-xs text-destructive font-mono">{currentError}</p>
          </div>
        )}

        {!activeRoomLoading && !activeRoom && (
          <div className="space-y-4">
            <Button
              className="w-full gap-2"
              onClick={handleCreateRoom}
              disabled={creating || !user}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create Private Room
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or join existing</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-code">Room Code</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="room-code"
                    placeholder="Enter room code..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="pl-9"
                    onKeyDown={(e) => e.key === 'Enter' && handleLookupCode()}
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={handleLookupCode}
                  disabled={!joinCode.trim() || lookingUp}
                >
                  {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  Lookup
                </Button>
              </div>
            </div>

            {lookedUpRoom && (
              <div className="p-3 border border-primary/30 bg-primary/5 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-primary" />
                    <span className="font-mono font-bold text-sm">{lookedUpRoom.roomCode}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {lookedUpRoom.players?.length || 0}/{lookedUpRoom.maxPlayers}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hosted by {lookedUpRoom.hostName}
                </p>
                <Button
                  className="w-full gap-2 mt-2"
                  size="sm"
                  onClick={handleJoinRoom}
                  disabled={joining || !user}
                >
                  {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  Join Room
                </Button>
              </div>
            )}
          </div>
        )}

        {!activeRoomLoading && activeRoom && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={activeRoom.status === 'in-progress' ? 'default' : 'secondary'} className="capitalize">
                  {activeRoom.status === 'in-progress' ? 'In Progress' : 'Waiting'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {activeRoom.gameMode}
                </Badge>
              </div>
              {isHost && activeRoom.status === 'waiting' && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleStartMatch}
                  disabled={starting}
                  className="gap-1"
                >
                  {starting ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                  Start
                </Button>
              )}
            </div>

            <div className="p-3 border border-primary/30 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <span className="font-mono font-bold text-lg tracking-wider">
                    {activeRoom.roomCode}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopyCode(activeRoom.roomCode)}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4 text-muted-foreground" />
                Players ({players.length}/{activeRoom.maxPlayers})
              </div>
              <div className="space-y-1">
                {players.map((playerId) => (
                  <div
                    key={playerId}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-md text-sm',
                      playerId === activeRoom.hostId
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        playerId === user?.uid ? 'bg-green-500' : 'bg-muted-foreground'
                      )} />
                      <span>
                        {playerNames[playerId] || 'Unknown'}
                        {playerId === user?.uid && ' (you)'}
                      </span>
                    </div>
                    {playerId === activeRoom.hostId && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        Host
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              {activeRoom.status === 'waiting' && (
                <FriendInviteDialog
                  roomId={activeRoom.id}
                  roomCode={activeRoom.roomCode}
                />
              )}

              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleLeaveRoom}
                disabled={leaving}
              >
                {leaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Leave Room
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
