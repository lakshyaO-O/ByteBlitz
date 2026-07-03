'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type {
  StudyRoomConfig,
  ParticipantProgress,
} from '@/app/arena/custom-study/page-client';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Code2,
  Copy,
  LogOut,
  MessageCircle,
  Send,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  Users,
  X,
  Zap,
  ChevronDown,
  ChevronUp,
  Brain,
  Play,
  RotateCcw,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';

/* ─── Static problem data (mirrors StudyRoomPanel) ─── */

const PROBLEM_DATA: Record<
  string,
  {
    title: string;
    difficulty: string;
    category: string;
    description: string;
    examples: { input: string; output: string; explanation?: string }[];
    starterCode: string;
  }
> = {
  'two-sum': {
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
    starterCode: 'function twoSum(nums, target) {\n  // your code here\n}',
  },
  'reverse-linked-list': {
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    category: 'Linked Lists',
    description:
      'Given the head of a singly linked list, reverse the list and return the reversed list.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' },
    ],
    starterCode: 'function reverseList(head) {\n  // your code here\n}',
  },
  'valid-parentheses': {
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stacks',
    description:
      'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    starterCode: 'function isValid(s) {\n  // your code here\n}',
  },
  'merge-sorted-arrays': {
    title: 'Merge Sorted Arrays',
    difficulty: 'Medium',
    category: 'Arrays',
    description:
      'Merge two sorted arrays into one sorted array.',
    examples: [
      { input: 'nums1 = [1,2,3], nums2 = [2,5,6]', output: '[1,2,2,3,5,6]' },
    ],
    starterCode: 'function merge(nums1, nums2) {\n  // your code here\n}',
  },
  'lru-cache': {
    title: 'LRU Cache',
    difficulty: 'Medium',
    category: 'Design',
    description:
      'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
    examples: [
      { input: 'LRUCache lRUCache = new LRUCache(2); lRUCache.put(1,1); lRUCache.put(2,2); lRUCache.get(1);', output: '1' },
    ],
    starterCode: 'class LRUCache {\n  constructor(capacity) {\n    // your code here\n  }\n}',
  },
  'course-schedule': {
    title: 'Course Schedule',
    difficulty: 'Medium',
    category: 'Graphs',
    description:
      'There are a total of numCourses courses you have to take. Given the prerequisites pairs, determine if you can finish all courses.',
    examples: [
      { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true' },
      { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false' },
    ],
    starterCode: 'function canFinish(numCourses, prerequisites) {\n  // your code here\n}',
  },
  'word-ladder': {
    title: 'Word Ladder',
    difficulty: 'Hard',
    category: 'Graphs',
    description:
      'Given two words and a dictionary, find the length of the shortest transformation sequence from beginWord to endWord.',
    examples: [
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '5' },
    ],
    starterCode: 'function ladderLength(beginWord, endWord, wordList) {\n  // your code here\n}',
  },
  'median-stream': {
    title: 'Find Median from Data Stream',
    difficulty: 'Hard',
    category: 'Heaps',
    description:
      'Design a data structure that supports adding numbers and finding the median of all added numbers.',
    examples: [
      { input: 'addNum(1), addNum(2), findMedian()', output: '1.5' },
      { input: 'addNum(3), findMedian()', output: '2.0' },
    ],
    starterCode: 'class MedianFinder {\n  constructor() {\n    // your code here\n  }\n}',
  },
};

/* ─── Mock participants ─── */

const MOCK_PARTICIPANTS: ParticipantProgress[] = [
  { userId: 'current-user', username: 'You', problemId: 'two-sum', solved: false, attempts: 0 },
  { userId: 'p1', username: 'Alex', photoURL: '', problemId: 'two-sum', solved: true, attempts: 3 },
  { userId: 'p2', username: 'Sam', problemId: 'reverse-linked-list', solved: false, attempts: 1 },
  { userId: 'p3', username: 'Jordan', problemId: 'two-sum', solved: false, attempts: 0 },
];

/* ─── Participant card ─── */

function ParticipantCard({
  participant,
  isHost,
}: {
  participant: ParticipantProgress;
  isHost?: boolean;
}) {
  const initials = participant.username.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/10 border border-border/30">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={participant.photoURL || ''} />
        <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary/70">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium truncate">{participant.username}</span>
          {isHost && (
            <Star className="w-2.5 h-2.5 text-yellow-400 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
          {participant.solved ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400/70">Solved</span>
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 text-muted-foreground/40" />
              <span>{participant.attempts > 0 ? `${participant.attempts} attempt${participant.attempts !== 1 ? 's' : ''}` : 'Not started'}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Chat area ─── */

function StudyChat() {
  const [messages, setMessages] = useState<
    { id: string; user: string; text: string; time: Date }[]
  >([
    { id: '1', user: 'Alex', text: 'Anyone want to work on Two Sum together?', time: new Date(Date.now() - 120000) },
    { id: '2', user: 'You', text: 'Sure! I just started it.', time: new Date(Date.now() - 60000) },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, user: 'You', text: input.trim(), time: new Date() },
    ]);
    setInput('');
  };

  return (
    <Card className="bg-card/40 border-border/40 flex flex-col h-full">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-xs font-headline font-bold flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5 text-primary" />
          Room Chat
        </CardTitle>
      </CardHeader>
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea ref={scrollRef} className="flex-1 px-4">
          <div className="space-y-2.5 pb-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2',
                  msg.user === 'You' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed',
                    msg.user === 'You'
                      ? 'bg-primary/15 text-primary-foreground/90 rounded-tr-sm'
                      : 'bg-muted/20 text-foreground/80 rounded-tl-sm'
                  )}
                >
                  {msg.user !== 'You' && (
                    <p className="text-[9px] font-bold text-primary/60 mb-0.5">{msg.user}</p>
                  )}
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="shrink-0 p-3 border-t border-border/30">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 h-9 px-3 rounded-lg bg-muted/10 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 transition-colors"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 text-primary/60 hover:text-primary"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Code editor ─── */

function CodeEditor({
  starterCode,
  onCodeChange,
}: {
  starterCode: string;
  onCodeChange?: (code: string) => void;
}) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    onCodeChange?.(e.target.value);
  };

  const handleRun = () => {
    setOutput('Tests passed: 3/3\nAll test cases passed!');
    setShowOutput(true);
  };

  const handleReset = () => {
    setCode(starterCode);
    setOutput('');
    setShowOutput(false);
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-border/40 bg-[#0d1117] overflow-hidden">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-[#161b22]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-[11px] text-muted-foreground/40 font-mono ml-3">solution.js</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            className="px-2 py-1 rounded text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/20 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold hover:bg-primary/25 transition-colors"
          >
            <Play className="w-3 h-3" /> Run
          </button>
        </div>
      </div>

      {/* Code area */}
      <textarea
        value={code}
        onChange={handleChange}
        className="flex-1 w-full bg-transparent text-sm font-mono text-[#e6edf3] p-4 outline-none resize-none leading-relaxed tab-size-2"
        spellCheck={false}
        style={{ minHeight: 200 }}
      />

      {/* Output panel */}
      {showOutput && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-border/30 bg-[#161b22]"
        >
          <div className="flex items-center justify-between px-4 py-1.5">
            <span className="text-[10px] font-mono text-muted-foreground/50">Output</span>
            <button onClick={() => setShowOutput(false)} className="text-muted-foreground/30 hover:text-muted-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
          <pre className="px-4 pb-3 text-xs font-mono text-emerald-400/80 leading-relaxed whitespace-pre-wrap">
            {output}
          </pre>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Main workbench ─── */

interface StudyRoomWorkbenchProps {
  config: StudyRoomConfig;
  isHost: boolean;
  onLeave: () => void;
}

export function StudyRoomWorkbench({ config, isHost, onLeave }: StudyRoomWorkbenchProps) {
  const { toast } = useToast();
  const [activeProblemId, setActiveProblemId] = useState(config.problemIds[0]);
  const [participants] = useState<ParticipantProgress[]>(MOCK_PARTICIPANTS);
  const [showChat, setShowChat] = useState(true);

  const problem = activeProblemId ? PROBLEM_DATA[activeProblemId] : null;
  const availableProblems = config.problemIds
    .map((id) => PROBLEM_DATA[id])
    .filter(Boolean);

  const handleCopyCode = () => {
    if (config.joinCode) {
      navigator.clipboard.writeText(config.joinCode);
      toast({ title: 'Copied!', description: 'Room code copied to clipboard.' });
    }
  };

  const solvedCount = participants.filter((p) => p.solved).length;
  const totalParticipants = participants.length;

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground/60 hover:text-foreground"
            onClick={onLeave}
          >
            <ArrowLeft className="w-4 h-4" />
            Leave
          </Button>
          <div className="hidden sm:block w-px h-6 bg-border/40" />
          <div>
            <h2 className="text-lg font-headline font-bold">{config.name}</h2>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {totalParticipants} participants
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-orange-400/60" /> {solvedCount} solved
              </span>
              {isHost && (
                <Badge
                  variant="outline"
                  className="bg-yellow-500/5 text-yellow-400 border-yellow-500/20 text-[9px] px-1.5 py-0"
                >
                  <Star className="w-2.5 h-2.5 mr-0.5" /> Host
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {config.joinCode && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-mono"
              onClick={handleCopyCode}
            >
              <Copy className="w-3 h-3" /> {config.joinCode}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-xs text-muted-foreground/60"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {showChat ? 'Hide Chat' : 'Show Chat'}
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className={cn('grid gap-5', showChat ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1')}>
        {/* Left: Problem + Editor */}
        <div className={cn('space-y-4', showChat ? 'lg:col-span-3' : 'lg:col-span-1')}>
          {/* Problem selector tabs */}
          {availableProblems.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {availableProblems.map((p) => (
                <button
                  key={p.title}
                  onClick={() => setActiveProblemId(
                    config.problemIds.find((id) => PROBLEM_DATA[id]?.title === p.title) || activeProblemId
                  )}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border',
                    p.title === problem?.title
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-muted/10 text-muted-foreground/50 border-border/30 hover:border-border/60'
                  )}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}

          {/* Problem card */}
          {problem && (
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg font-headline font-bold">{problem.title}</h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] font-bold px-2 py-0',
                          problem.difficulty === 'Easy'
                            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                            : problem.difficulty === 'Medium'
                              ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                              : 'text-red-400 border-red-500/30 bg-red-500/10'
                        )}
                      >
                        {problem.difficulty}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/50 font-mono">{problem.category}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-[10px] text-primary/60 hover:text-primary"
                    asChild
                  >
                    <a href="/ai-mentor" target="_blank" rel="noopener noreferrer">
                      <Brain className="w-3 h-3" /> Ask AI
                    </a>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground/80 leading-relaxed">{problem.description}</p>

                {/* Examples */}
                <div className="space-y-2">
                  {problem.examples.map((ex, i) => (
                    <div key={i} className="rounded-lg bg-muted/10 border border-border/30 p-3 space-y-1.5">
                      <p className="text-[10px] font-mono text-muted-foreground/50">
                        <span className="font-bold text-foreground/60">Example {i + 1}:</span>
                      </p>
                      <p className="text-xs font-mono text-muted-foreground/80">
                        <span className="text-muted-foreground/50">Input: </span>{ex.input}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground/80">
                        <span className="text-muted-foreground/50">Output: </span>{ex.output}
                      </p>
                      {ex.explanation && (
                        <p className="text-[11px] text-muted-foreground/60 mt-1">{ex.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Hint button */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-400/60" />
                  <span>Need help? Ask AI Mentor or discuss in chat.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Code editor */}
          {problem && (
            <div className="min-h-[400px]">
              <CodeEditor starterCode={problem.starterCode} />
            </div>
          )}
        </div>

        {/* Right sidebar: participants + chat */}
        {showChat && (
          <div className="space-y-4 lg:col-span-1">
            {/* Participants */}
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-headline font-bold flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Participants
                  <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono">
                    {totalParticipants}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {participants.map((p) => (
                  <ParticipantCard
                    key={p.userId}
                    participant={p}
                    isHost={p.userId === config.hostId}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs mt-1"
                >
                  <UserPlus className="w-3 h-3" /> Invite
                </Button>
              </CardContent>
            </Card>

            {/* Progress summary */}
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground/60">Room Progress</span>
                  <span className="font-mono font-bold text-primary">
                    {solvedCount}/{totalProblems}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(solvedCount / Math.max(totalProblems, 1)) * 100}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <div className="flex-1 min-h-[300px] lg:min-h-0">
              <StudyChat />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const totalProblems = Object.keys(PROBLEM_DATA).length;
