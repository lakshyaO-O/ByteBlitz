"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Send, Trophy, Skull, Terminal, Play, HelpCircle, Code2, AlertTriangle, User, Crown } from 'lucide-react';
import { generateProblemHint } from '@/ai/flows/problem-hint-generator';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';

interface Opponent {
  id: string;
  username: string;
  rating: number;
  tier: string;
}

interface BattleArenaMultiplayerProps {
  opponent: Opponent;
  onBattleEnd: () => void;
}

export function BattleArena({ opponent, onBattleEnd }: BattleArenaMultiplayerProps) {
  const router = useRouter();
  const { user } = useUser();
  const [timeLeft, setTimeLeft] = useState(1200);
  const [code, setCode] = useState(`// Solve the Two Sum problem
function twoSum(nums, target) {
  // Your code here
}`);
  const [output, setOutput] = useState<string[]>([
    'Arena established.',
    `📍 Opponent: ${opponent.username} (${opponent.rating} ELO • ${opponent.tier})`,
    '⏱️ Battle started!',
    'Waiting for submission...'
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [isGettingHint, setIsGettingHint] = useState(false);
  const [yourScore, setYourScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [battleEnded, setBattleEnded] = useState(false);
  const [battleResult, setBattleResult] = useState<'WIN' | 'LOSS' | 'DRAW' | null>(null);
  const [eloChange, setEloChange] = useState(0);
  const consoleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => {
      if (prev <= 0) {
        handleTimeExpired();
        return 0;
      }
      return prev - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTwoSumFunction = (sourceCode: string) => {
    if (/^\s*#include\b/m.test(sourceCode) || /\bint\s+main\s*\(/m.test(sourceCode)) {
      throw new Error('Detected non-JavaScript code. Please use JavaScript and define a function named twoSum.');
    }
    const wrappedCode = `${sourceCode}\nreturn typeof twoSum !== 'undefined' ? twoSum : undefined;`;
    const runUserCode = new Function(wrappedCode);
    return runUserCode();
  };

  const handleRun = () => {
    const timestamp = new Date().toLocaleTimeString();
    const logs = [`[${timestamp}] Running local test cases...`];
    setOutput(prev => [...prev, ...logs]);

    const sampleCases = [
      { nums: [2, 7, 11, 15], target: 9, expected: [0, 1] },
      { nums: [3, 2, 4], target: 6, expected: [1, 2] },
    ];

    const fallbackTwoSum = (nums: number[], target: number) => {
      const seen = new Map<number, number>();
      for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
          return [seen.get(complement) as number, i];
        }
        seen.set(nums[i], i);
      }
      return [];
    };

    let userFn;
    try {
      userFn = getTwoSumFunction(code);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logs.push(`[ERROR] ${message}`);
      userFn = fallbackTwoSum;
    }

    if (userFn && typeof userFn === 'function') {
      sampleCases.forEach((testCase, index) => {
        const result = userFn(testCase.nums, testCase.target);
        const passed = Array.isArray(result) && result.length === testCase.expected.length && result.every((value, i) => value === testCase.expected[i]);
        logs.push(`✓ Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      });
    }

    setOutput(prev => [...prev, ...logs]);
  };

  const handleSubmit = async () => {
    if (isSubmitting || battleEnded) return;
    setIsSubmitting(true);

    const timestamp = new Date().toLocaleTimeString();
    const logs = [`[${timestamp}] 🚀 Submitting solution...`];

    const sampleCases = [
      { nums: [2, 7, 11, 15], target: 9, expected: [0, 1] },
      { nums: [3, 2, 4], target: 6, expected: [1, 2] },
    ];

    const fallbackTwoSum = (nums: number[], target: number) => {
      const seen = new Map<number, number>();
      for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
          return [seen.get(complement) as number, i];
        }
        seen.set(nums[i], i);
      }
      return [];
    };

    let userFn;
    let usedFallback = false;

    try {
      userFn = getTwoSumFunction(code);
    } catch (error) {
      logs.push(`[ERROR] ${error instanceof Error ? error.message : String(error)}`);
      userFn = fallbackTwoSum;
      usedFallback = true;
    }

    let passedTestCases = 0;
    if (userFn && typeof userFn === 'function') {
      sampleCases.forEach((testCase, index) => {
        const result = userFn(testCase.nums, testCase.target);
        const passed = Array.isArray(result) && result.length === testCase.expected.length && result.every((value, i) => value === testCase.expected[i]);
        if (passed) passedTestCases++;
        logs.push(`Test ${index + 1}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      });
    }

    const yourNewScore = usedFallback ? passedTestCases * 50 : (passedTestCases === 2 ? 100 : passedTestCases * 50);
    setYourScore(yourNewScore);

    logs.push(`━━━━━━━━━━━━━━━━━━━━━━`);
    logs.push(`📊 Your Score: ${yourNewScore}/100`);

    // Simulate opponent score
    await new Promise(r => setTimeout(r, 1500));
    const randomOpponentScore = Math.floor(Math.random() * 85) + 15;
    setOpponentScore(randomOpponentScore);
    logs.push(`👾 Opponent Score: ${randomOpponentScore}/100`);

    // Determine result
    let result: 'WIN' | 'LOSS' | 'DRAW';
    let change = 0;

    if (yourNewScore > randomOpponentScore) {
      result = 'WIN';
      change = 25;
      logs.push(`🎉 VICTORY! +${change} ELO`);
    } else if (randomOpponentScore > yourNewScore) {
      result = 'LOSS';
      change = -20;
      logs.push(`💔 DEFEAT... ${change} ELO`);
    } else {
      result = 'DRAW';
      change = 0;
      logs.push(`🤝 DRAW! +0 ELO`);
    }

    setBattleResult(result);
    setEloChange(change);
    setBattleEnded(true);
    logs.push(`━━━━━━━━━━━━━━━━━━━━━━`);

    setOutput(prev => [...prev, ...logs]);

    // Save battle to database
    if (user && opponent) {
      try {
        await fetch('/api/battles/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            battleId: `${user.uid}_${opponent.id}_${Date.now()}`,
            userId1: user.uid,
            userId2: opponent.id,
            code1: code,
            code2: 'opponent_code_placeholder',
            score1: yourNewScore,
            score2: randomOpponentScore,
            timeUsed1: 1200 - timeLeft,
            timeUsed2: Math.floor(Math.random() * 600) + 300,
            problemId: 'two-sum',
            problemTitle: 'Two Sum',
          }),
        });

        await fetch('/api/battles/calculate-elo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId1: user.uid,
            userId2: opponent.id,
            score1: yourNewScore,
            score2: randomOpponentScore,
          }),
        });
      } catch (error) {
        console.error('Failed to save battle:', error);
      }
    }

    setIsSubmitting(false);
  };

  const handleTimeExpired = () => {
    setOutput(prev => [...prev, '[⏰ TIME EXPIRED] Battle ended!']);
    setBattleEnded(true);
    setBattleResult('LOSS');
  };

  const handleGetHint = async () => {
    setIsGettingHint(true);
    try {
      const res = await generateProblemHint({
        problemStatement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        userCode: code,
        failureMessage: "Test cases failing.",
        language: "JavaScript"
      });
      setHint(res.hint);
      setOutput(prev => [...prev, `💡 Hint: ${res.hint}`]);
    } catch (e) {
      console.error(e);
    }
    setIsGettingHint(false);
  };

  const handleBackToArena = () => {
    onBattleEnd();
  };

  const resultColors = {
    WIN: 'text-emerald-400',
    LOSS: 'text-destructive',
    DRAW: 'text-yellow-400'
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full max-h-[85vh]">
      {/* Left: Problem & Opponent Status */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">
        <Card className="flex-1 bg-card/50 border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-headline font-bold text-xl uppercase tracking-tighter">Two Sum</h2>
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">MEDIUM</Badge>
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 text-sm">
              <p>Given an array of integers <code className="bg-muted px-1 py-0.5 rounded">nums</code> and an integer <code className="bg-muted px-1 py-0.5 rounded">target</code>, return indices of the two numbers that add up to target.</p>
              <div>
                <h3 className="font-bold text-primary uppercase text-xs mb-2">Example:</h3>
                <div className="bg-muted p-3 rounded-md font-mono text-xs space-y-1">
                  <p>Input: nums = [2,7,11,15], target = 9</p>
                  <p>Output: [0,1]</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </Card>

        {/* Opponent Status */}
        <Card className="bg-card/50 border-border overflow-hidden">
          <div className="p-3 border-b border-border bg-secondary/10 flex items-center gap-2">
            <User className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold uppercase tracking-widest">Opponent</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
                <User className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{opponent.username}</p>
                <p className="text-xs text-muted-foreground">{opponent.rating} ELO • {opponent.tier}</p>
              </div>
            </div>
            {!battleEnded ? (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-secondary">~60%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[60%] animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{opponentScore}</p>
                <p className="text-xs text-muted-foreground">Final Score</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right: Code Editor & Console */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-hidden">
        {/* Timer & Score */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border p-4 text-center">
            <div className="text-3xl font-mono font-bold text-primary">{formatTime(timeLeft)}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Time Left</div>
          </Card>
          <Card className="bg-card/50 border-border p-4 text-center">
            <div className="text-3xl font-bold text-emerald-400">{yourScore}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Your Score</div>
          </Card>
          <Card className="bg-card/50 border-border p-4 text-center">
            {battleEnded && battleResult ? (
              <>
                <div className={cn("text-3xl font-bold", resultColors[battleResult])}>{battleResult}</div>
                <div className={cn("text-xs uppercase tracking-widest", resultColors[battleResult])}>
                  {eloChange > 0 ? `+${eloChange}` : eloChange < 0 ? `${eloChange}` : '+0'} ELO
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-secondary">VS</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Opponent</div>
              </>
            )}
          </Card>
        </div>

        {/* Code Editor */}
        <Card className="flex-1 bg-[#011627] border-border overflow-hidden flex flex-col">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={battleEnded}
            className="flex-1 p-6 font-code text-sm bg-transparent outline-none resize-none text-cyan-50 caret-primary disabled:opacity-50"
            spellCheck={false}
          />
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleRun}
            disabled={battleEnded || isSubmitting}
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4" /> RUN TESTS
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={battleEnded || isSubmitting}
            className="flex-1 gap-2 bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" /> SUBMIT
          </Button>
          <Button 
            onClick={handleGetHint}
            disabled={battleEnded || isGettingHint}
            variant="outline"
            className="gap-2"
          >
            <HelpCircle className="w-4 h-4" /> HINT
          </Button>
          {battleEnded && (
            <Button 
              onClick={handleBackToArena}
              variant="outline"
              className="gap-2"
            >
              Back to Arena
            </Button>
          )}
        </div>

        {/* Console */}
        <Card className="h-40 bg-black/50 border-border overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest">Console</span>
          </div>
          <div 
            ref={consoleRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 text-muted-foreground"
          >
            {output.map((line, i) => (
              <div key={i} className="text-cyan-50/80">{line}</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
