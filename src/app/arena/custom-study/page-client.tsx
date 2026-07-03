'use client';

import React, { useState, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { StudyRoomPanel } from '@/components/arena/StudyRoomPanel';
import { StudyRoomWorkbench } from '@/components/arena/StudyRoomWorkbench';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StudyView = 'lobby' | 'workbench';

export interface StudyRoomConfig {
  id: string;
  name: string;
  description?: string;
  hostId: string;
  hostName: string;
  problemIds: string[];
  maxParticipants: number;
  joinCode?: string;
}

export interface ParticipantProgress {
  userId: string;
  username: string;
  photoURL?: string;
  problemId: string;
  solved: boolean;
  attempts: number;
}

export default function CustomStudyPageClient() {
  const [view, setView] = useState<StudyView>('lobby');
  const [roomConfig, setRoomConfig] = useState<StudyRoomConfig | null>(null);

  const handleRoomReady = useCallback((config: StudyRoomConfig) => {
    setRoomConfig(config);
    setView('workbench');
  }, []);

  const handleLeave = useCallback(() => {
    setRoomConfig(null);
    setView('lobby');
  }, []);

  const isHost = roomConfig
    ? roomConfig.hostId === 'current-user'
    : false;

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {view === 'lobby' && (
          <>
            {/* Back link */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground/60 hover:text-foreground"
                onClick={() => (window.location.href = '/arena')}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Arena
              </Button>
              <Badge
                variant="outline"
                className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20 text-[10px] uppercase tracking-widest font-bold"
              >
                No ELO Impact
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-headline font-black uppercase tracking-tighter">
                Custom <span className="text-primary neon-text">Study Room</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Create collaborative coding rooms for study groups, interview prep, and classrooms.
                Solve problems together, share progress, and learn as a team — ranked ELO is never affected.
              </p>
            </div>

            <StudyRoomPanel onRoomReady={handleRoomReady} />
          </>
        )}

        {view === 'workbench' && roomConfig && (
          <StudyRoomWorkbench
            config={roomConfig}
            isHost={isHost}
            onLeave={handleLeave}
          />
        )}
      </div>
    </Shell>
  );
}
