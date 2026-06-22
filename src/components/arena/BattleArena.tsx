"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Send, Trophy, Skull, Terminal, Play, HelpCircle, Code2, AlertTriangle } from 'lucide-react';
import { generateProblemHint } from '@/ai/flows/problem-hint-generator';

export function BattleArena() {
  const [timeLeft, setTimeLeft] = useState(1200); // 20 mins
  const [code, setCode] = useState(`// Solve the Two Sum problem
function twoSum(nums, target) {
  // Your code here
}`);
  const [output, setOutput] = useState<string[]>(['Arena established.', 'Waiting for submission...']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [isGettingHint, setIsGettingHint] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRun = () => {
    setOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] Running local test cases...`, '>> Sample 1: PASSED', '>> Sample 2: PASSED']);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate complex judge
    await new Promise(r => setTimeout(r, 1500));
    setOutput(prev => [...prev, `[SYSTEM] VALIDATING SUBMISSION...`, `[ERROR] TEST CASE #4 FAILED: Expected [3,4], Got [4,3].`]);
    setIsSubmitting(false);
  };

  const handleGetHint = async () => {
    setIsGettingHint(true);
    try {
      const res = await generateProblemHint({
        problemStatement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        userCode: code,
        failureMessage: "Wrong Answer on test case 4. Expected order preservation.",
        language: "JavaScript"
      });
      setHint(res.hint);
    } catch (e) {
      console.error(e);
    }
    setIsGettingHint(false);
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full max-h-[85vh]">
      {/* Left Column: Problem & Progress */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">
        <Card className="flex-1 bg-card/50 border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-headline font-bold text-xl uppercase tracking-tighter">Two Sum</h2>
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">MEDIUM</Badge>
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 font-body">
              <div className="prose prose-invert prose-sm">
                <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to target.</p>
                <p>You may assume that each input would have exactly one solution, and you may not use the same element twice.</p>
                <p>You can return the answer in any order.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-primary">Example 1:</h3>
                <div className="bg-muted p-3 rounded-md font-mono text-xs">
                  <p className="text-muted-foreground">Input: nums = [2,7,11,15], target = 9</p>
                  <p>Output: [0,1]</p>
                  <p className="text-muted-foreground mt-1">Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-primary">Constraints:</h3>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  <li>2 &le; nums.length &le; 10⁴</li>
                  <li>-10⁹ &le; nums[i] &le; 10⁹</li>
                  <li>Only one valid answer exists.</li>
                </ul>
              </div>
            </div>
          </ScrollArea>
        </Card>

        {/* Live Battle Feed */}
        <Card className="h-48 bg-card/50 border-border overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold uppercase tracking-widest">Opponent Status</span>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/30">
                <img src="https://picsum.photos/seed/rival123/100/100" className="rounded-full" alt="Rival" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold">ByteKiller99</span>
                  <span className="text-primary">85% COMPLETE</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[85%] animate-pulse" />
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground bg-muted/20 p-2 rounded">
              &gt; ByteKiller99 submitted test case validation...
              <br/>
              &gt; VALIDATION FAILED on Test Case #2.
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column: Code Editor & Console */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 bg-muted/50 p-2 rounded-lg border border-border">
          <div className="flex items-center gap-4 px-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-mono text-xl font-bold tracking-tighter text-foreground">{formatTime(timeLeft)}</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase">JavaScript (V8)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" className="gap-2" onClick={handleRun}>
              <Play className="w-4 h-4" /> RUN
            </Button>
            <Button size="sm" className="gap-2 bg-primary text-background font-bold" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <span className="animate-spin">⌛</span> : <Send className="w-4 h-4" />} SUBMIT
            </Button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 min-h-0 flex flex-col gap-6">
          <Card className="flex-1 bg-[#011627] border-border overflow-hidden flex flex-col neon-border">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-6 font-code text-sm bg-transparent outline-none resize-none text-cyan-50 caret-primary"
              spellCheck={false}
            />
          </Card>

          {/* Console & AI Help */}
          <div className="h-1/3 flex gap-6 min-h-0">
            <Card className="flex-1 bg-black/90 border-border overflow-hidden flex flex-col">
              <Tabs defaultValue="console" className="flex-1 flex flex-col">
                <TabsList className="bg-muted/50 rounded-none h-10 px-4 justify-start gap-4">
                  <TabsTrigger value="console" className="h-full bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 text-xs font-bold uppercase">Console</TabsTrigger>
                  <TabsTrigger value="hint" className="h-full bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-secondary border-b-2 border-transparent data-[state=active]:border-secondary rounded-none px-0 text-xs font-bold uppercase">AI Debugger</TabsTrigger>
                </TabsList>
                <TabsContent value="console" className="flex-1 m-0 p-4 font-code text-xs overflow-y-auto">
                  {output.map((line, i) => (
                    <div key={i} className={cn(
                      "mb-1",
                      line.includes('[ERROR]') ? "text-destructive" : "text-emerald-400"
                    )}>
                      {line}
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="hint" className="flex-1 m-0 p-4 font-body text-sm">
                  {hint ? (
                    <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-lg animate-in fade-in duration-500">
                      <div className="flex items-center gap-2 text-secondary font-bold uppercase text-xs mb-2">
                        <Zap className="w-4 h-4" /> AI Suggestion
                      </div>
                      <p className="text-muted-foreground italic">&quot;{hint}&quot;</p>
                      <Button variant="ghost" size="sm" className="mt-4 text-xs text-muted-foreground hover:text-foreground" onClick={() => setHint(null)}>Clear</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                      <HelpCircle className="w-10 h-10 text-muted-foreground opacity-50" />
                      <div>
                        <p className="text-muted-foreground text-xs uppercase font-bold">Stuck on a test case?</p>
                        <p className="text-[10px] text-muted-foreground/60 max-w-[200px]">Our AI Debugger can provide a subtle logic hint (Non-rated only).</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="bg-secondary/20 border border-secondary/30 text-secondary hover:bg-secondary/30"
                        onClick={handleGetHint}
                        disabled={isGettingHint}
                      >
                        {isGettingHint ? "CALCULATING..." : "REQUEST LOGIC HINT"}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
