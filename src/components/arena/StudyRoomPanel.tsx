'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { StudyRoomConfig } from '@/app/arena/custom-study/page-client';
import {
  Users,
  Plus,
  Copy,
  Check,
  Hash,
  DoorOpen,
  LogIn,
  BookOpen,
  MessageCircle,
  Sparkles,
  Shield,
  Clock,
  ArrowRight,
  Search,
  X,
  UserPlus,
  Star,
} from 'lucide-react';
import Link from 'next/link';

/* ─── Static fallback problems ─── */

const FALLBACK_PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays',
    points: 100,
  },
  {
    id: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    category: 'Linked Lists',
    points: 150,
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stacks',
    points: 100,
  },
  {
    id: 'merge-sorted-arrays',
    title: 'Merge Sorted Arrays',
    difficulty: 'Medium',
    category: 'Arrays',
    points: 250,
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache',
    difficulty: 'Medium',
    category: 'Design',
    points: 300,
  },
  {
    id: 'course-schedule',
    title: 'Course Schedule',
    difficulty: 'Medium',
    category: 'Graphs',
    points: 300,
  },
  {
    id: 'word-ladder',
    title: 'Word Ladder',
    difficulty: 'Hard',
    category: 'Graphs',
    points: 500,
  },
  {
    id: 'median-stream',
    title: 'Find Median from Data Stream',
    difficulty: 'Hard',
    category: 'Heaps',
    points: 500,
  },
];

/* ─── Room card preview ─── */

function RoomPreviewCard({
  title,
  description,
  participantCount,
  maxParticipants,
  problemCount,
  hostName,
  tags,
}: {
  title: string;
  description?: string;
  participantCount: number;
  maxParticipants: number;
  problemCount: number;
  hostName: string;
  tags?: string[];
}) {
  return (
    <Card className="bg-card/40 border-border/40 hover:border-primary/20 transition-all group cursor-pointer">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-headline font-bold truncate">{title}</h3>
              <Badge
                variant="outline"
                className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0"
              >
                Open
              </Badge>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground/60 line-clamp-2">{description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {participantCount}/{maxParticipants}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {problemCount} problem{problemCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1 text-primary/40">
            <Star className="w-3 h-3" />
            {hostName}
          </span>
        </div>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="px-1.5 py-0.5 rounded bg-muted/20 text-[9px] font-mono text-muted-foreground/50"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="pt-1">
          <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
            <DoorOpen className="w-3 h-3" /> Join Room
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Problem selector ─── */

function ProblemSelector({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = FALLBACK_PROBLEMS.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search problems..."
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/10 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <ScrollArea className="max-h-64">
        <div className="space-y-1">
          {filtered.map((problem) => {
            const isSelected = selected.includes(problem.id);
            const diffColor =
              problem.difficulty === 'Easy'
                ? 'text-emerald-400'
                : problem.difficulty === 'Medium'
                  ? 'text-yellow-400'
                  : 'text-red-400';

            return (
              <button
                key={problem.id}
                onClick={() => onToggle(problem.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm',
                  isSelected
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-transparent border border-transparent hover:bg-muted/20'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/30'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{problem.title}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-[10px] font-bold', diffColor)}>
                      {problem.difficulty}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">{problem.category}</span>
                    <span className="text-[10px] text-muted-foreground/30">{problem.points} pts</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between text-xs text-muted-foreground/50">
        <span>{selected.length} of {FALLBACK_PROBLEMS.length} selected</span>
        {selected.length > 0 && (
          <button
            onClick={() => selected.forEach((id) => onToggle(id))}
            className="text-primary/60 hover:text-primary transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main panel ─── */

interface StudyRoomPanelProps {
  onRoomReady: (config: StudyRoomConfig) => void;
}

export function StudyRoomPanel({ onRoomReady }: StudyRoomPanelProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'create' | 'join' | 'browse'>('create');

  /* Create room state */
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);

  /* Join room state */
  const [joinCode, setJoinCode] = useState('');

  const handleToggleProblem = (id: string) => {
    setSelectedProblems((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      toast({ variant: 'destructive', title: 'Room name required', description: 'Give your study room a name.' });
      return;
    }
    if (selectedProblems.length === 0) {
      toast({ variant: 'destructive', title: 'Select problems', description: 'Pick at least one problem for the room.' });
      return;
    }

    const config: StudyRoomConfig = {
      id: `study-${Date.now()}`,
      name: roomName.trim(),
      description: roomDescription.trim() || undefined,
      hostId: 'current-user',
      hostName: 'You',
      problemIds: selectedProblems,
      maxParticipants,
      joinCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    };

    onRoomReady(config);
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) {
      toast({ variant: 'destructive', title: 'Enter a code', description: 'Paste the room code shared by the host.' });
      return;
    }

    const config: StudyRoomConfig = {
      id: `study-${joinCode.trim()}`,
      name: 'Study Room',
      hostId: 'remote-host',
      hostName: 'Host',
      problemIds: FALLBACK_PROBLEMS.slice(0, 3).map((p) => p.id),
      maxParticipants: 5,
      joinCode: joinCode.trim().toUpperCase(),
    };

    onRoomReady(config);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: 'Room code copied to clipboard.' });
  };

  const tabs = [
    { value: 'create', label: 'Create Room', icon: Plus },
    { value: 'join', label: 'Join Room', icon: LogIn },
    { value: 'browse', label: 'Browse Rooms', icon: Search },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Create / Join Tabs */}
      <div className="flex gap-1.5 bg-muted/30 p-1 rounded-lg border border-border/30 w-fit">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all',
              tab === t.value
                ? 'bg-background text-foreground shadow-sm border border-border/50'
                : 'text-muted-foreground/50 hover:text-foreground/70'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Create Tab ─── */}
      {tab === 'create' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6"
        >
          {/* Room details */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Room Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure your study room settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g. Interview Prep Squad"
                    className="w-full h-10 px-3 rounded-lg bg-muted/10 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Description <span className="text-muted-foreground/30">(optional)</span>
                  </label>
                  <textarea
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    placeholder="What will this room focus on?"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-muted/10 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Max Participants
                  </label>
                  <div className="flex items-center gap-2">
                    {[3, 5, 8, 12].map((n) => (
                      <button
                        key={n}
                        onClick={() => setMaxParticipants(n)}
                        className={cn(
                          'flex-1 h-10 rounded-lg text-sm font-bold transition-all border',
                          maxParticipants === n
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'bg-muted/10 text-muted-foreground/50 border-border/30 hover:border-border/60'
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-muted/10 border border-border/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold">No ELO Impact</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                    Study rooms never affect your ranked ELO. You earn normal Practice XP for problems solved.
                  </p>
                </div>

                <Button
                  className="w-full gap-2 h-12"
                  size="lg"
                  onClick={handleCreateRoom}
                  disabled={!roomName.trim() || selectedProblems.length === 0}
                >
                  <Sparkles className="w-4 h-4" />
                  Launch Study Room
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Problem selection */}
          <div className="lg:col-span-3 space-y-5">
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Select Problems
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose problems for the room. Participants can solve them together or pick different ones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProblemSelector
                  selected={selectedProblems}
                  onToggle={handleToggleProblem}
                />
              </CardContent>
            </Card>

            {/* Quick features summary */}
            <Card className="bg-card/20 border-border/30 border-dashed">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  {[
                    { icon: MessageCircle, label: 'Live Chat' },
                    { icon: Users, label: 'Collaborative' },
                    { icon: BookOpen, label: 'Practice XP' },
                    { icon: Sparkles, label: 'AI Mentor Ready' },
                  ].map((f) => (
                    <div key={f.label} className="space-y-1">
                      <f.icon className="w-4 h-4 mx-auto text-primary/50" />
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        {f.label}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ─── Join Tab ─── */}
      {tab === 'join' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-xl mx-auto"
        >
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                <LogIn className="w-4 h-4 text-primary" />
                Join a Study Room
              </CardTitle>
              <CardDescription className="text-xs">
                Enter the room code shared by the host.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    maxLength={8}
                    className="w-full h-12 pl-10 pr-4 rounded-lg bg-muted/10 border border-border/40 text-lg font-mono font-bold tracking-widest text-foreground placeholder:text-muted-foreground/20 outline-none focus:border-primary/40 transition-colors uppercase"
                  />
                </div>
                <Button
                  className="h-12 gap-2 px-6"
                  onClick={handleJoinRoom}
                  disabled={joinCode.trim().length < 4}
                >
                  <DoorOpen className="w-4 h-4" />
                  Join
                </Button>
              </div>

              <div className="rounded-lg bg-muted/10 border border-border/30 p-4 text-center">
                <p className="text-xs text-muted-foreground/60 mb-2">Don&apos;t have a code?</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setTab('create')}
                >
                  <Plus className="w-3.5 h-3.5" /> Create a Room Instead
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview: active rooms list */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
              Active Rooms
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  title: 'LeetCode Grind',
                  desc: 'Daily DSA practice for upcoming interviews',
                  participants: 3,
                  max: 5,
                  problems: 4,
                  host: 'Alex',
                  tags: ['DSA', 'Medium'],
                },
                {
                  title: 'System Design Study',
                  desc: 'Preparing for senior-level system design rounds',
                  participants: 2,
                  max: 8,
                  problems: 2,
                  host: 'Sam',
                  tags: ['Design', 'Advanced'],
                },
              ].map((room) => (
                <RoomPreviewCard
                  key={room.title}
                  title={room.title}
                  description={room.desc}
                  participantCount={room.participants}
                  maxParticipants={room.max}
                  problemCount={room.problems}
                  hostName={room.host}
                  tags={room.tags}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Browse Tab ─── */}
      {tab === 'browse' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="rounded-xl border border-dashed border-border/30 bg-muted/5 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary/50" />
            </div>
            <h3 className="text-lg font-headline font-bold mb-2">Browse Public Rooms</h3>
            <p className="text-sm text-muted-foreground/60 max-w-md mx-auto mb-6">
              Discover study rooms created by the community. Filter by topic, difficulty, or team size.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Input
                placeholder="Search rooms by name, topic, or host..."
                className="max-w-xs bg-muted/20 border-border/40"
              />
              <Button variant="default" className="gap-2">
                <Search className="w-4 h-4" /> Search
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/40 mt-6">
              Public room discovery will be available in an upcoming update.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
