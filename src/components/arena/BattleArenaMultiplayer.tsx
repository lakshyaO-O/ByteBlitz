"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Terminal, Play, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { initializeFirebase } from '@/firebase';
import { doc, onSnapshot, runTransaction, serverTimestamp, increment, collection, addDoc } from 'firebase/firestore';

interface Opponent {
  id: string;
  username: string;
  rating: number;
  tier: string;
}

interface BattleArenaMultiplayerProps {
  opponent: Opponent;
  battleId: string;
  onBattleEnd: () => void;
}

export function BattleArena({ opponent, battleId, onBattleEnd }: BattleArenaMultiplayerProps) {
  const { user } = useUser();
  const [timeLeft, setTimeLeft] = useState(1200);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<string[]>(['Arena established.', 'Waiting for opponent...']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [yourScore, setYourScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [battleEnded, setBattleEnded] = useState(false);
  const [battleStatus, setBattleStatus] = useState<'countdown' | 'in-progress' | 'finished'>('countdown');
  const [countdown, setCountdown] = useState(5);
  const [battleResult, setBattleResult] = useState<'WIN' | 'LOSS' | 'DRAW' | null>(null);
  const [eloChange, setEloChange] = useState(0);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [problem, setProblem] = useState<any>(null);
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const codeRef = useRef(code);
  codeRef.current = code;
  const battleEndedRef = useRef(battleEnded);
  battleEndedRef.current = battleEnded;
  const isSubmittingRef = useRef(false);

  // Listen to battle doc for real-time sync
  useEffect(() => {
    if (!battleId || !user) return;
    const { firestore: db } = initializeFirebase();
    if (!db) return;
    const battleRef = doc(db, 'battles', battleId);

    let lastOnline = Date.now();
    const unsub = onSnapshot(battleRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      // Verify ownership
      const isPlayer1 = data.player1?.uid === user.uid;
      const isPlayer2 = data.player2?.uid === user.uid;
      if (!isPlayer1 && !isPlayer2) return;

      const myData = isPlayer1 ? data.player1 : data.player2;
      const enemyData = isPlayer1 ? data.player2 : data.player1;

      setProblem(data.problem);

      if (myData) {
        setCode(myData.code || data.problem?.starterCode || '');
        setYourScore(myData.score || 0);
        setOpponentSubmitted(enemyData?.submitted || false);
        setOpponentScore(enemyData?.score || 0);
      }

      setBattleStatus(data.status);

      // Detect opponent disconnect (no update in >15s)
      const now = Date.now();
      if (data.status === 'in-progress' && lastOnline > 0) {
        if (now - lastOnline > 15000) {
          setOpponentDisconnected(true);
        }
      }
      lastOnline = now;

      if (data.status === 'countdown' && data.countdownEndsAt) {
        const endTime = new Date(data.countdownEndsAt).getTime();
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setCountdown(remaining);
      }

      if (data.status === 'in-progress' && data.startedAt) {
        const startTime = data.startedAt?.toMillis ? data.startedAt.toMillis() : Date.now() - 30000;
        const duration = data.duration || 1200;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setTimeLeft(Math.max(0, duration - elapsed));
      }

      if (data.status === 'in-progress' && !data.finished && !battleEndedRef.current) {
        setOutput(prev => {
          if (prev.includes('Battle in progress!')) return prev;
          return [...prev, 'Battle in progress!'];
        });
      }

      if (data.finished && !battleEndedRef.current) {
        const winnerIds = data.winnerIds || [];
        let result: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
        if (winnerIds.includes(user.uid)) result = 'WIN';
        else if (winnerIds.length > 0) result = 'LOSS';
        setBattleResult(result);
        setBattleEnded(true);
      }
    });

    return () => unsub();
  }, [battleId, user]);

  // Handle countdown -> in-progress transition
  useEffect(() => {
    if (battleStatus !== 'countdown' || !battleId) return;
    const { firestore: db } = initializeFirebase();
    if (!db) return;
    const battleRef = doc(db, 'battles', battleId);

    const checkCountdown = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(checkCountdown);
          runTransaction(db, async (transaction) => {
            const snap = await transaction.get(battleRef);
            if (snap.exists() && snap.data().status === 'countdown') {
              transaction.update(battleRef, { status: 'in-progress' });
            }
          }).catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(checkCountdown);
  }, [battleStatus, battleId]);

  // Sync timer when in-progress
  useEffect(() => {
    if (battleStatus !== 'in-progress' || battleEnded) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [battleStatus, battleEnded]);

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

  const getFunction = (sourceCode: string, fnName: string) => {
    try {
      const wrappedCode = `${sourceCode}\nreturn typeof ${fnName} !== 'undefined' ? ${fnName} : undefined;`;
      const runUserCode = new Function(wrappedCode);
      return runUserCode();
    } catch {
      return undefined;
    }
  };

  const runTests = useCallback((sourceCode: string) => {
    if (!problem?.testCases) return { passed: 0, total: 0, logs: [] as string[] };
    const logs: string[] = [];
    let passed = 0;
    const total = problem.testCases.length;

    const fnName = problem.id === 'valid-parentheses' ? 'isValid' : problem.id === 'two-sum' ? 'twoSum' : 'reverseString';
    const userFn = getFunction(sourceCode, fnName);

    if (!userFn || typeof userFn !== 'function') {
      logs.push('[ERROR] Could not find a valid function in your code.');
      return { passed: 0, total, logs };
    }

    problem.testCases.forEach((testCase: any, index: number) => {
      try {
        const inputs = { ...testCase };
        delete inputs.expected;
        const result = userFn(...Object.values(inputs));
        const expected = testCase.expected;
        const passedTest = JSON.stringify(result) === JSON.stringify(expected);
        if (passedTest) passed++;
        logs.push(`Test ${index + 1}: ${passedTest ? 'PASSED' : 'FAILED'}`);
      } catch {
        logs.push(`Test ${index + 1}: ERROR`);
      }
    });

    return { passed, total, logs };
  }, [problem]);

  const handleRun = () => {
    const timestamp = new Date().toLocaleTimeString();
    const logs = [`[${timestamp}] Running tests...`];

    const result = runTests(codeRef.current);
    logs.push(...result.logs);
    logs.push(`Result: ${result.passed}/${result.total} passed`);

    setOutput(prev => [...prev, ...logs]);
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current || battleEndedRef.current || !battleId || !user) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const timestamp = new Date().toLocaleTimeString();
    const logs = [`[${timestamp}] Submitting solution...`];

    const result = runTests(codeRef.current);
    logs.push(...result.logs);

    const score = result.passed > 0 ? Math.round((result.passed / result.total) * 100) : 0;
    setYourScore(score);
    logs.push(`Your Score: ${score}/${result.total * 100 > 0 ? result.total * 100 : 100}`);

    setOutput(prev => [...prev, ...logs]);

    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setIsSubmitting(false); isSubmittingRef.current = false; return; }
      const battleRef = doc(db, 'battles', battleId);

      let matchResult: { result: string; change: number; enemyScore: number } | null = null;

      await runTransaction(db, async (transaction) => {
        const battleSnap = await transaction.get(battleRef);
        if (!battleSnap.exists()) return;
        const battleData = battleSnap.data();

        if (battleData.finished) {
          logs.push('Battle already ended.');
          return;
        }

        const isPlayer1 = battleData.player1?.uid === user.uid;
        const playerKey = isPlayer1 ? 'player1' : 'player2';
        const enemyKey = isPlayer1 ? 'player2' : 'player1';

        transaction.update(battleRef, {
          [`${playerKey}.score`]: score,
          [`${playerKey}.submitted`]: true,
          [`${playerKey}.code`]: codeRef.current,
        });

        const enemyData = battleData[enemyKey];
        const enemySubmitted = enemyData?.submitted;
        const eScore = enemyData?.score || 0;

        setOpponentScore(eScore);

        if (enemySubmitted) {
          let result: 'WIN' | 'LOSS' | 'DRAW';
          let change = 0;

          if (score > eScore) {
            result = 'WIN';
            change = 25;
          } else if (eScore > score) {
            result = 'LOSS';
            change = -20;
          } else {
            result = 'DRAW';
            change = 0;
          }

          const winnerIds = result === 'WIN' ? [user.uid] : result === 'LOSS' ? [opponent.id] : [];

          transaction.update(battleRef, {
            status: 'finished',
            finished: true,
            finishedAt: serverTimestamp(),
            winnerIds,
          });

          matchResult = { result, change, enemyScore: eScore };
        } else {
          logs.push('Waiting for opponent to submit...');
        }
      });

      if (matchResult) {
        const { result, change, enemyScore: eScore } = matchResult;
        setBattleResult(result as any);
        setEloChange(change);
        setBattleEnded(true);

        logs.push('');
        logs.push(result === 'WIN' ? 'VICTORY!' : result === 'LOSS' ? 'DEFEAT' : 'DRAW');
        logs.push(`${result === 'WIN' ? '+' : ''}${change} ELO`);

        // Save match history and ELO updates (best-effort, outside transaction)
        try {
          const matchPayload = {
            players: [
              { uid: user.uid, username: user.displayName || 'Player', score, result, eloChange: change },
              { uid: opponent.id, username: opponent.username, score: eScore, result: result === 'WIN' ? 'LOSS' : result === 'LOSS' ? 'WIN' : 'DRAW', eloChange: -change },
            ],
            winnerIds: result === 'WIN' ? [user.uid] : result === 'LOSS' ? [opponent.id] : [],
            problem: { id: problem?.id, title: problem?.title },
            duration: 1200 - timeLeft,
            gameMode: 'rated',
            timestamp: serverTimestamp(),
          };

          addDoc(collection(db, 'matches'), matchPayload).catch(() => {});
          addDoc(collection(db, 'users', user.uid, 'gameHistory'), {
            ...matchPayload,
            matchId: battleId,
            opponentId: opponent.id,
            opponentName: opponent.username,
          }).catch(() => {});

          // Update user stats
          const userRef = doc(db, 'users', user.uid);
          const updates: Record<string, any> = {
            rating: increment(change),
            wins: increment(result === 'WIN' ? 1 : 0),
            losses: increment(result === 'LOSS' ? 1 : 0),
            draws: increment(result === 'DRAW' ? 1 : 0),
            xp: increment(Math.max(10, Math.floor(score / 2))),
            lastActive: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          runTransaction(db, async (tx) => {
            tx.update(userRef, updates);
          }).catch(() => {});
        } catch {
          // Best-effort match history save
        }
      }
    } catch {
      logs.push('ERROR: Submission failed. Please try again.');
    }

    setOutput(prev => [...prev, ...logs]);
    setIsSubmitting(false);
    isSubmittingRef.current = false;
  };

  const handleTimeExpired = () => {
    if (battleEndedRef.current || !battleId) return;
    setOutput(prev => [...prev, '[TIME EXPIRED] Battle ended!']);
    setBattleResult('LOSS');
    setBattleEnded(true);
    setEloChange(-20);

    const { firestore: db } = initializeFirebase();
    if (!db) return;
    const battleRef = doc(db, 'battles', battleId);

    runTransaction(db, async (transaction) => {
      const snap = await transaction.get(battleRef);
      if (snap.exists() && !snap.data().finished) {
        transaction.update(battleRef, {
          status: 'finished',
          finished: true,
          finishedAt: serverTimestamp(),
          winnerIds: [opponent.id],
        });
      }
    }).catch(() => {});
  };

  const handleBackToArena = () => {
    onBattleEnd();
  };

  const resultColors = {
    WIN: 'text-emerald-400',
    LOSS: 'text-destructive',
    DRAW: 'text-yellow-400'
  };

  if (battleStatus === 'countdown') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-6">
          <div className="text-8xl font-headline font-black text-primary neon-text animate-pulse">
            {countdown}
          </div>
          <p className="text-muted-foreground uppercase tracking-widest text-sm font-bold">
            Preparing Battle Arena
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold">{user?.displayName || 'You'}</span>
            </div>
            <span className="text-primary font-bold">VS</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/50 flex items-center justify-center">
                <User className="w-4 h-4 text-secondary" />
              </div>
              <span className="font-bold">{opponent.username}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-full max-h-[85vh]">
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">
        <Card className="flex-1 bg-card/50 border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-headline font-bold text-xl uppercase tracking-tighter">{problem?.title || 'Battle'}</h2>
            {problem?.difficulty && (
              <Badge className={cn(
                problem.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                'bg-destructive/20 text-destructive border-destructive/30'
              )}>
                {problem.difficulty}
              </Badge>
            )}
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 text-sm">
              <p>{problem?.description}</p>
              {problem?.testCases && (
                <div>
                  <h3 className="font-bold text-primary uppercase text-xs mb-2">Examples:</h3>
                  {problem.testCases.slice(0, 2).map((tc: any, i: number) => (
                    <div key={i} className="bg-muted p-3 rounded-md font-mono text-xs space-y-1 mb-2">
                      {Object.entries(tc).filter(([k]) => k !== 'expected').map(([key, val]) => (
                        <p key={key}>{key}: {JSON.stringify(val)}</p>
                      ))}
                      <p>Output: {JSON.stringify(tc.expected)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="bg-card/50 border-border overflow-hidden">
          <div className="p-3 border-b border-border bg-secondary/10 flex items-center gap-2">
            <User className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold uppercase tracking-widest">Opponent</span>
            {opponentSubmitted && !battleEnded && (
              <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                Submitted
              </Badge>
            )}
            {opponentDisconnected && !battleEnded && (
              <Badge className="ml-auto bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-[10px]">
                Disconnected
              </Badge>
            )}
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
            {battleEnded ? (
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{opponentScore}</p>
                <p className="text-xs text-muted-foreground">Final Score</p>
              </div>
            ) : opponentSubmitted ? (
              <div className="text-center">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground mt-1">Evaluating...</p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-yellow-400">{opponentDisconnected ? 'Disconnected' : 'Solving'}</span>
                </div>
                {!opponentDisconnected && (
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 w-[50%] animate-pulse" />
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-hidden">
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
                <div className="text-3xl font-bold text-secondary">{opponentSubmitted ? opponentScore : 'VS'}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Opponent</div>
              </>
            )}
          </Card>
        </div>

        <Card className="flex-1 bg-[#011627] border-border overflow-hidden flex flex-col">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={battleEnded}
            className="flex-1 p-6 font-code text-sm bg-transparent outline-none resize-none text-cyan-50 caret-primary disabled:opacity-50"
            spellCheck={false}
          />
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={handleRun}
            disabled={battleEnded || isSubmitting || battleStatus !== 'in-progress'}
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4" /> RUN TESTS
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={battleEnded || isSubmitting || battleStatus !== 'in-progress'}
            className="flex-1 gap-2 bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            SUBMIT
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
