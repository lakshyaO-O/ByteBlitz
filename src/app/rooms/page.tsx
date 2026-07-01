'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Gamepad2, Users, Plus, Search, ChevronRight, Crown, Loader2, Swords, Clock, Shield, CheckCircle2, Copy, DoorOpen, UserMinus, UserX, UserCheck, Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useRooms, useCreateRoom, useJoinRoom, useLeaveRoom, useKickPlayer, useBlockPlayerFromRoom, useActiveRoom, usePresence,
} from '@/hooks/use-rooms';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { GuestGate } from '@/components/auth/GuestGate';
import { EmptyState } from '@/components/premium/EmptyState';
import type { GameMode, GameRoom } from '@/app/lib/types';

export default function RoomsPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('rated');
  const { rooms, loading } = useRooms();
  const { room: activeRoom, loading: activeLoading, subscribeToRoom, clearRoom } = useActiveRoom(user?.uid || null);
  const { createRoom, loading: creating } = useCreateRoom();
  const { joinRoom, loading: joining } = useJoinRoom();
  const { leaveRoom, loading: leaving } = useLeaveRoom();
  const { kickPlayer } = useKickPlayer();
  const { blockPlayer } = useBlockPlayerFromRoom();

  usePresence(user?.uid || null);

  const waitingRooms = rooms.filter(r => r.status === 'waiting');

  const handleCreateRoom = async () => {
    if (!user) return;
    const room = await createRoom({ hostId: user.uid, hostName: user.displayName || user.email?.split('@')[0] || 'Player', gameMode });
    if (room) {
      setCreateDialogOpen(false);
      toast({ title: 'Room created!', description: `Code: ${room.roomCode}` });
    } else {
      toast({ variant: 'destructive', title: 'Failed to create room' });
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!user) return;
    const result = await joinRoom({ roomId, userId: user.uid, username: user.displayName || user.email?.split('@')[0] || 'Player' });
    if (result) {
      toast({ title: 'Joined room!' });
    } else {
      toast({ variant: 'destructive', title: 'Failed to join room' });
    }
  };

  const handleJoinByCode = async () => {
    if (!user || roomCode.length < 6) return;
    const room = rooms.find(r => r.roomCode === roomCode.toUpperCase() && r.status === 'waiting');
    if (room) {
      await handleJoinRoom(room.id);
    } else {
      toast({ variant: 'destructive', title: 'Room not found', description: 'No open room with that code.' });
    }
  };

  const handleLeaveRoom = async () => {
    if (!user || !activeRoom) return;
    await leaveRoom(activeRoom.id, user.uid);
    clearRoom();
    toast({ title: 'Left room' });
  };

  const handleKick = async (targetId: string) => {
    if (!activeRoom) return;
    await kickPlayer(activeRoom.id, targetId);
  };

  const handleBlock = async (targetId: string) => {
    if (!activeRoom) return;
    await blockPlayer(activeRoom.id, targetId);
  };

  const copyRoomCode = () => {
    if (!activeRoom?.roomCode) return;
    navigator.clipboard.writeText(activeRoom.roomCode);
    toast({ title: 'Room code copied!' });
  };

  if (activeLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  if (activeRoom) {
    const isHost = activeRoom.hostId === user?.uid;
    const playerList = (activeRoom.players || []).map((pid: string) => ({
      id: pid,
      name: activeRoom.playerNames?.[pid] || pid,
      isHost: pid === activeRoom.hostId,
    }));

    return (
      <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-headline font-bold uppercase tracking-widest">
            <Gamepad2 className="w-3.5 h-3.5" />
            {activeRoom.gameMode === 'rated' ? 'Rated' : activeRoom.gameMode === 'practice' ? 'Practice' : 'Sprint'} Room
          </div>
          <h1 className="text-4xl font-headline font-bold tracking-tighter">GAME ROOM</h1>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-lg font-mono tracking-[0.3em] px-4 py-1.5">
              {activeRoom.roomCode}
            </Badge>
            <Button size="sm" variant="ghost" onClick={copyRoomCode}><Copy className="w-4 h-4" /></Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Share the code with friends to invite them
          </p>
        </div>

        <Card className="bg-card/60 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest">
              <Users className="w-4 h-4 text-primary" /> Players ({playerList.length}/{activeRoom.maxPlayers || 2})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {playerList.map((player: any) => (
              <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{player.name[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="font-bold text-sm">{player.name}</span>
                    {player.isHost && (
                      <Badge variant="outline" className="ml-2 text-[10px] text-secondary border-secondary/30">
                        <Crown className="w-3 h-3 mr-1" /> Host
                      </Badge>
                    )}
                  </div>
                </div>
                {isHost && player.id !== user?.uid && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleKick(player.id)} title="Kick player">
                      <UserMinus className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleBlock(player.id)} title="Block from room">
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          {isHost && activeRoom.status === 'waiting' && (
            <Button
              className="gap-2"
              disabled={(activeRoom.players?.length || 0) < 2}
              onClick={() => router.push(`/arena?roomId=${activeRoom.id}`)}
            >
              <Swords className="w-4 h-4" /> Start Match
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={handleLeaveRoom} disabled={leaving}>
            <DoorOpen className="w-4 h-4" /> Leave Room
          </Button>
        </div>
      </div>
      </Shell>
    );
  }

  return (
      <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              GAME <span className="text-primary neon-text">ROOMS</span>
            </h1>
            <p className="text-muted-foreground">Create or join custom game rooms for private matches.</p>
          </div>
          <div className="flex items-center gap-3">
            <GuestGate feature="Create a Room" redirectPath="/rooms">
              <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4" /> Create Room
              </Button>
            </GuestGate>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Available Rooms ({waitingRooms.length})
              </h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : waitingRooms.length > 0 ? (
              waitingRooms.map((room) => (
                <Card key={room.id} className="bg-card/50 border-border hover:border-primary/30 transition-all group cursor-pointer">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Gamepad2 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold truncate">{room.hostName}&apos;s Room</h3>
                          <Badge variant="outline" className="text-[10px] font-mono shrink-0">{room.roomCode}</Badge>
                          <Badge className={cn(
                            'text-[10px] uppercase tracking-widest shrink-0',
                            room.gameMode === 'rated' ? 'bg-primary/10 text-primary border-primary/30' :
                            room.gameMode === 'practice' ? 'bg-secondary/10 text-secondary border-secondary/30' :
                            'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          )}>{room.gameMode}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" /> {room.players?.length || 1}/{room.maxPlayers || 2} players
                        </p>
                      </div>
                    </div>
                    <GuestGate feature="Join a Room" redirectPath="/rooms">
                      <Button size="sm" className="gap-1 shrink-0 ml-4" onClick={() => handleJoinRoom(room.id)} disabled={joining}>
                        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Join <ChevronRight className="w-4 h-4" /></>}
                      </Button>
                    </GuestGate>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={Gamepad2}
                title="No Open Rooms"
                description="Create a room or join by code to start a private match."
              />
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-headline font-bold uppercase tracking-widest flex items-center gap-2">
                  <Search className="w-4 h-4" /> Join by Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter 6-character code"
                  className="bg-muted/50 border-border font-mono uppercase text-center text-lg tracking-[0.5em]"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <GuestGate feature="Join a Room by Code" redirectPath="/rooms">
                  <Button className="w-full" disabled={roomCode.length < 6} onClick={handleJoinByCode}>
                    Join Room
                  </Button>
                </GuestGate>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 text-center space-y-3">
                <Crown className="w-8 h-8 text-secondary mx-auto" />
                <p className="text-sm font-bold">Create a Private Room</p>
                <p className="text-xs text-muted-foreground">Set up a custom match with specific rules and invite friends.</p>
                <GuestGate feature="Create a Room" redirectPath="/rooms">
                  <Button variant="outline" className="w-full gap-2" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4" /> New Room
                  </Button>
                </GuestGate>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-primary" /> Create Game Room
              </DialogTitle>
              <DialogDescription>Configure your room settings before inviting opponents.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-widest">Game Mode</Label>
                <RadioGroup value={gameMode} onValueChange={(v: GameMode) => setGameMode(v)} className="grid gap-3">
                  {[
                    { value: 'rated' as GameMode, label: 'Rated', desc: 'ELO ranking on the line', icon: Shield },
                    { value: 'practice' as GameMode, label: 'Practice', desc: 'No rating impact, just practice', icon: Swords },
                    { value: 'sprint' as GameMode, label: 'Sprint', desc: 'Race against the clock', icon: Clock },
                  ].map(({ value, label, desc, icon: Icon }) => (
                    <Label key={value} htmlFor={value} className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all',
                      gameMode === value ? 'border-primary/50 bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-border/80 hover:bg-muted/20'
                    )}>
                      <RadioGroupItem value={value} id={value} className="sr-only" />
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', gameMode === value ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      {gameMode === value && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateRoom} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Room
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </Shell>
  );
}
