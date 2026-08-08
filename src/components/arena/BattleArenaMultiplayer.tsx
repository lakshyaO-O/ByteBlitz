'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useArenaBattle } from '@/hooks/use-arena-battle'
import { PlayerStatsCard } from './PlayerStatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Send,
  Terminal,
  Play,
  User,
  Loader2,
  Trophy,
  TrendingUp,
  Zap,
  Flame,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Code2,
} from 'lucide-react'
import { useUser } from '@/firebase/auth/use-user'

interface BattleArenaMultiplayerProps {
  opponent: { id: string; username: string; rating: number; tier: string }
  battleId: string
  onBattleEnd: () => void
}

interface ConsoleLine {
  type: 'pass' | 'fail' | 'warning' | 'info' | 'system'
  text: string
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function runTests(code: string, testCases: { input: string; expected: string }[]): ConsoleLine[] {
  const lines: ConsoleLine[] = []
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i]
    lines.push({
      type: 'info',
      text: `Test ${i + 1}: Run via /api/judge/execute — check console for results.`,
    })
  }
  return lines
}

export function BattleArenaMultiplayer({
  opponent,
  battleId,
  onBattleEnd,
}: BattleArenaMultiplayerProps) {
  const {
    battle,
    loading,
    error,
    code,
    language,
    submitting,
    result,
    setLanguage,
    setCode,
    startCoding,
    handleSubmit: submitSolution,
  } = useArenaBattle(battleId)

  const { user } = useUser()
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([
    { type: 'system', text: 'System ready. Waiting for battle to start...' },
  ])
  const [runningTests, setRunningTests] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const consoleRef = useRef<HTMLDivElement>(null)

  const currentPlayer = battle?.players?.find((p: any) => p.userId === user?.uid)
  const opponentPlayer = battle?.players?.find((p: any) => p.userId === opponent.id)

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [consoleLines])

  useEffect(() => {
    if (battle?.phase === 'countdown' && battle.countdownStartedAt) {
      setCountdown(5)
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            startCoding()
            return null
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [battle?.phase, battle?.countdownStartedAt, startCoding])

  useEffect(() => {
    if (battle?.phase === 'coding' && battle.codingStartedAt && battle.totalTimeMs) {
      const update = () => {
        const elapsed = Date.now() - new Date(battle.codingStartedAt).getTime()
        setTimeLeft(battle.totalTimeMs - elapsed)
      }
      update()
      const interval = setInterval(update, 1000)
      return () => clearInterval(interval)
    }
  }, [battle?.phase, battle?.codingStartedAt, battle?.totalTimeMs])

  useEffect(() => {
    if (battle?.phase === 'coding') {
      setConsoleLines((prev) => [
        ...prev,
        { type: 'system', text: 'Coding phase started. Good luck!' },
      ])
    }
  }, [battle?.phase])

  const handleRunTests = useCallback(async () => {
    if (!battle?.problem?.testCases || runningTests) return
    setRunningTests(true)
    setConsoleLines((prev) => [...prev, { type: 'info', text: 'Running tests...' }])

    await new Promise((r) => setTimeout(r, 300))

    const results = runTests(code, battle.problem.testCases)
    setConsoleLines((prev) => [...prev, ...results])
    setRunningTests(false)
  }, [battle?.problem?.testCases, code, runningTests])

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setConsoleLines((prev) => [...prev, { type: 'info', text: 'Submitting solution...' }])
    await submitSolution()
  }, [submitting, submitSolution])

  useEffect(() => {
    if (result) {
      if (result.passed) {
        setConsoleLines((prev) => [
          ...prev,
          { type: 'pass', text: `Submission passed! Verdict: ${result.verdict}` },
        ])
      } else {
        setConsoleLines((prev) => [
          ...prev,
          { type: 'fail', text: `Submission failed. Verdict: ${result.verdict}` },
        ])
      }
    }
  }, [result])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="bg-red-900/20 border-red-500/50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-300 font-headline uppercase tracking-wider">Error loading battle</p>
            <p className="text-red-400/70 text-sm mt-2">{error}</p>
            <Button variant="outline" className="mt-4" onClick={onBattleEnd}>
              Back to Arena
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!battle) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (battle.phase === 'countdown') {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="bg-gray-900/80 border-primary/30 w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <User className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-white font-headline uppercase tracking-wider">
                  {currentPlayer?.username || 'You'}
                </p>
                <p className="text-sm text-gray-400">Rating: {currentPlayer?.rating || '-'}</p>
              </div>
              <div className="text-4xl font-bold text-primary font-headline">VS</div>
              <div className="text-center">
                <User className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-xl font-bold text-white font-headline uppercase tracking-wider">
                  {opponentPlayer?.username || opponent.username}
                </p>
                <p className="text-sm text-gray-400">Rating: {opponentPlayer?.rating || opponent.rating}</p>
              </div>
            </div>
            <Separator className="bg-primary/20 mb-8" />
            <div className="text-8xl font-bold text-primary font-headline animate-pulse">
              {countdown}
            </div>
            <p className="text-gray-400 mt-4 font-headline uppercase tracking-widest text-sm">
              Get Ready
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (battle.phase === 'finished') {
    const isVictory =
      result?.passed ||
      (currentPlayer?.passedTestCases || 0) > (opponentPlayer?.passedTestCases || 0) ||
      battle.winnerIds?.includes(user?.uid || '')
    const isDraw = (battle.winnerIds?.length || 0) !== 1 || currentPlayer?.passedTestCases === opponentPlayer?.passedTestCases
    const currentResult: 'win' | 'loss' | 'draw' = isDraw ? 'draw' : isVictory ? 'win' : 'loss'
    const opponentResult: 'win' | 'loss' | 'draw' = isDraw ? 'draw' : isVictory ? 'loss' : 'win'
    const eloChange = currentPlayer?.eloChange

    return (
      <div className="space-y-6">
        <Card
          className={cn(
            'border-2 overflow-hidden',
            isDraw
              ? 'border-yellow-500/50 bg-yellow-900/10'
              : isVictory
                ? 'border-green-500/50 bg-green-900/10'
                : 'border-red-500/50 bg-red-900/10'
          )}
        >
          <CardContent className="p-12 text-center">
            {isDraw ? (
              <>
                <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                <p className="text-4xl font-bold text-yellow-400 font-headline uppercase tracking-wider">
                  Draw
                </p>
              </>
            ) : isVictory ? (
              <>
                <Flame className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <p className="text-4xl font-bold text-green-400 font-headline uppercase tracking-wider">
                  Victory
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <p className="text-4xl font-bold text-red-400 font-headline uppercase tracking-wider">
                  Defeat
                </p>
              </>
            )}
            {eloChange !== undefined && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <TrendingUp
                  className={cn(
                    'h-5 w-5',
                    eloChange >= 0 ? 'text-green-400' : 'text-red-400'
                  )}
                />
                <span
                  className={cn(
                    'text-xl font-bold font-headline',
                    eloChange >= 0 ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {eloChange >= 0 ? '+' : ''}
                  {eloChange} ELO
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentPlayer && (
            <PlayerStatsCard
              username={currentPlayer.username}
              rating={currentPlayer.rating}
              tier={currentPlayer.tier || ''}
              language={currentPlayer.language}
              passedTestCases={currentPlayer.passedTestCases}
              totalTestCases={currentPlayer.totalTestCases}
              submissionCount={currentPlayer.submissionCount}
              result={currentResult}
              isCurrentUser
            />
          )}
          {opponentPlayer && (
            <PlayerStatsCard
              username={opponentPlayer.username}
              rating={opponentPlayer.rating}
              tier={opponentPlayer.tier || ''}
              language={opponentPlayer.language}
              passedTestCases={opponentPlayer.passedTestCases}
              totalTestCases={opponentPlayer.totalTestCases}
              submissionCount={opponentPlayer.submissionCount}
              result={opponentResult}
              isOpponent
            />
          )}
        </div>

        <div className="text-center">
          <Button
            onClick={onBattleEnd}
            className="bg-primary hover:bg-primary/90 text-white font-headline uppercase tracking-wider"
          >
            Back to Arena
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-4 min-h-[600px]">
      <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
        <Card className="bg-gray-900/80 border-primary/20 h-full">
          <CardHeader>
            <CardTitle className="text-primary font-headline uppercase tracking-wider text-sm flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Problem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-4 pr-4">
                <div>
                  <h3 className="text-white font-headline uppercase tracking-wider text-sm mb-2">
                    {battle.problem?.title || 'Untitled'}
                  </h3>
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    {battle.problem?.difficulty || 'N/A'}
                  </Badge>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed">
                  {battle.problem?.description || 'No description available.'}
                </p>

                {battle.problem?.examples && battle.problem.examples.length > 0 && (
                  <div>
                    <h4 className="text-primary font-headline uppercase tracking-wider text-xs mb-2">
                      Examples
                    </h4>
                    {battle.problem.examples.map((ex: any, i: number) => (
                      <div key={i} className="bg-gray-800/50 rounded p-3 mb-2 text-sm font-mono">
                        <p className="text-gray-400">
                          Input: <span className="text-gray-200">{ex.input}</span>
                        </p>
                        <p className="text-gray-400">
                          Output: <span className="text-green-300">{ex.output}</span>
                        </p>
                        {ex.explanation && (
                          <p className="text-muted-foreground/70 mt-1 text-xs">{ex.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {battle.problem?.constraints && (
                  <div>
                    <h4 className="text-primary font-headline uppercase tracking-wider text-xs mb-2">
                      Constraints
                    </h4>
                    <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
                      {battle.problem.constraints.map((c: string, i: number) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {battle.problem?.testCases && (
                  <div>
                    <h4 className="text-primary font-headline uppercase tracking-wider text-xs mb-2">
                      Test Cases ({battle.problem.testCases.length})
                    </h4>
                    <p className="text-muted-foreground/70 text-xs">
                      Use &quot;Run Tests&quot; to validate your solution locally before submitting.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-4">
        <Card className="bg-gray-900/80 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span
                    className={cn(
                      'font-headline text-lg font-bold font-mono',
                      timeLeft < 30000 ? 'text-red-400 animate-pulse' : 'text-white'
                    )}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6 bg-gray-700" />
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">
                    Tests:{' '}
                    {currentPlayer?.passedTestCases ?? 0}/{battle.problem?.testCases?.length ?? 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="h-4 w-4" />
                  <span>{opponentPlayer?.username || opponent.username}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      (opponentPlayer?.submissionCount || 0) > 0
                        ? 'border-green-500/50 text-green-400'
                        : 'border-yellow-500/50 text-yellow-400'
                    )}
                  >
                    {(opponentPlayer?.submissionCount || 0) > 0 ? 'Submitted' : 'Coding...'}
                  </Badge>
                </div>
                <Separator orientation="vertical" className="h-6 bg-gray-700" />
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Submissions: {currentPlayer?.submissionCount || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/80 border-primary/20 flex-1">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-primary/10">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-xs text-gray-400 font-headline uppercase tracking-wider">
                  Solution
                </span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-gray-800 text-gray-300 text-xs border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-primary/50"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-[300px] bg-gray-950 text-gray-100 font-mono text-sm p-4 resize-none focus:outline-none border-none placeholder-gray-600"
              placeholder="// Write your solution here..."
              spellCheck={false}
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunTests}
            disabled={runningTests || !code.trim()}
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 font-headline uppercase tracking-wider"
          >
            {runningTests ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Tests
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !code.trim()}
            className="bg-primary hover:bg-primary/90 text-white font-headline uppercase tracking-wider"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit
          </Button>
        </div>

        <Card className="bg-gray-950 border-gray-800">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border-b border-gray-800">
              <Terminal className="h-4 w-4 text-muted-foreground/70" />
              <span className="text-xs text-muted-foreground/70 font-headline uppercase tracking-wider">
                Console Output
              </span>
            </div>
            <ScrollArea className="h-[180px]">
              <div ref={consoleRef} className="p-4 space-y-1 font-mono text-xs">
                {consoleLines.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      'leading-relaxed',
                      line.type === 'pass' && 'text-green-400',
                      line.type === 'fail' && 'text-red-400',
                      line.type === 'warning' && 'text-yellow-400',
                      line.type === 'info' && 'text-cyan-400',
                      line.type === 'system' && 'text-muted-foreground/70'
                    )}
                  >
                    {line.type === 'pass' && <CheckCircle2 className="inline h-3 w-3 mr-1.5 -mt-0.5" />}
                    {line.type === 'fail' && <XCircle className="inline h-3 w-3 mr-1.5 -mt-0.5" />}
                    {line.type === 'warning' && <AlertCircle className="inline h-3 w-3 mr-1.5 -mt-0.5" />}
                    {line.type === 'info' && <AlertCircle className="inline h-3 w-3 mr-1.5 -mt-0.5" />}
                    {line.type === 'system' && <Terminal className="inline h-3 w-3 mr-1.5 -mt-0.5" />}
                    {line.text}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
