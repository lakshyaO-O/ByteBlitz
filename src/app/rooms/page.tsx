'use client';

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Gamepad2,
  Users,
  Lock,
  Plus,
  Search,
  ChevronRight,
  Crown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MOCK_ROOMS = [
  { id: 'r1', roomCode: 'ABC123', hostName: 'SyntaxSamurai', players: ['u1', 'u2'], playerNames: { u1: 'SyntaxSamurai', u2: 'BinaryBoss' }, status: 'waiting', gameMode: 'rated', maxPlayers: 2 },
  { id: 'r2', roomCode: 'DEF456', hostName: 'RecursionQueen', players: ['u3'], playerNames: { u3: 'RecursionQueen' }, status: 'waiting', gameMode: 'practice', maxPlayers: 2 },
  { id: 'r3', roomCode: 'GHI789', hostName: 'NullPointer', players: ['u4', 'u5', 'u6'], playerNames: { u4: 'NullPointer', u5: 'CodeWizard', u6: 'AlgoMaster' }, status: 'in-progress', gameMode: 'sprint', maxPlayers: 4 },
];

export default function RoomsPage() {
  const [roomCode, setRoomCode] = useState('');

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
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Create Room
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Available Rooms</h2>
            {MOCK_ROOMS.filter(r => r.status === 'waiting').length > 0 ? (
              MOCK_ROOMS.filter(r => r.status === 'waiting').map((room) => (
                <Card key={room.id} className="bg-card/50 border-border hover:border-primary/30 transition-all group cursor-pointer">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{room.hostName}'s Room</h3>
                          <Badge variant="outline" className="text-[10px] font-mono">{room.roomCode}</Badge>
                          <Badge className={cn(
                            'text-[10px] uppercase tracking-widest',
                            room.gameMode === 'rated' ? 'bg-primary/10 text-primary border-primary/30' :
                            room.gameMode === 'practice' ? 'bg-secondary/10 text-secondary border-secondary/30' :
                            'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          )}>
                            {room.gameMode}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" /> {room.players.length}/{room.maxPlayers} players
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="gap-1">
                      Join <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-bold uppercase tracking-widest text-sm">No open rooms</p>
                <p className="text-xs mt-2">Create a room or join by code.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
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
                <Button className="w-full" disabled={roomCode.length < 6}>
                  Join Room
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 text-center space-y-3">
                <Crown className="w-8 h-8 text-secondary mx-auto" />
                <p className="text-sm font-bold">Create a Private Room</p>
                <p className="text-xs text-muted-foreground">Set up a custom match with specific rules and invite friends.</p>
                <Button variant="outline" className="w-full gap-2">
                  <Plus className="w-4 h-4" /> New Room
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
