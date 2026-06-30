'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, Target, BarChart3, Activity, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { CodingHeatmap } from './CodingHeatmap';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  weeklyCodingTime?: number;
  problemsSolvedByDifficulty?: { Easy: number; Medium: number; Hard: number };
  languageStats?: Record<string, number>;
  winLossHistory?: { wins: number; losses: number; draws: number };
  accuracy?: number;
  totalProblems?: number;
  totalCodingTime?: number;
  performanceTrend?: 'up' | 'down' | 'stable';
  codingHeatmapData?: Record<string, number>;
  winRate?: number;
}

export function AnalyticsDashboard({
  weeklyCodingTime = 0,
  problemsSolvedByDifficulty = { Easy: 0, Medium: 0, Hard: 0 },
  languageStats = {},
  winLossHistory = { wins: 0, losses: 0, draws: 0 },
  accuracy = 0,
  totalProblems = 0,
  totalCodingTime = 0,
  performanceTrend = 'stable',
  codingHeatmapData = {},
  winRate = 0,
}: AnalyticsDashboardProps) {
  const totalSolved = problemsSolvedByDifficulty.Easy + problemsSolvedByDifficulty.Medium + problemsSolvedByDifficulty.Hard;
  const totalGames = winLossHistory.wins + winLossHistory.losses + winLossHistory.draws;
  const winRateValue = totalGames > 0 ? Math.round((winLossHistory.wins / totalGames) * 100) : 0;
  const totalHours = Math.floor(totalCodingTime / 3600);
  const totalMinutes = Math.floor((totalCodingTime % 3600) / 60);

  const topLanguages = Object.entries(languageStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxLangCount = Math.max(...topLanguages.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Weekly Coding</p>
                <p className="text-2xl font-bold font-headline mt-1">{weeklyCodingTime}m</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Solved</p>
                <p className="text-2xl font-bold font-headline mt-1">{totalSolved}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Accuracy</p>
                <p className="text-2xl font-bold font-headline mt-1">{accuracy}%</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Win Rate</p>
                <p className="text-2xl font-bold font-headline mt-1">{winRateValue}%</p>
              </div>
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                performanceTrend === 'up' ? 'bg-emerald-500/10' : performanceTrend === 'down' ? 'bg-destructive/10' : 'bg-muted'
              )}>
                {performanceTrend === 'up' ? <TrendingUp className="w-5 h-5 text-emerald-400" /> :
                 performanceTrend === 'down' ? <TrendingDown className="w-5 h-5 text-destructive" /> :
                 <Activity className="w-5 h-5 text-muted-foreground" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CodingHeatmap data={codingHeatmapData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-headline font-bold uppercase tracking-wider">Problems by Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(['Easy', 'Medium', 'Hard'] as const).map(diff => {
                const count = problemsSolvedByDifficulty[diff];
                const percentage = totalSolved > 0 ? (count / totalSolved) * 100 : 0;
                return (
                  <div key={diff}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={cn(
                        'font-medium',
                        diff === 'Easy' ? 'text-emerald-400' : diff === 'Medium' ? 'text-yellow-400' : 'text-destructive'
                      )}>{diff}</span>
                      <span className="text-muted-foreground">{count} ({Math.round(percentage)}%)</span>
                    </div>
                    <Progress value={percentage} className={cn(
                      'h-2',
                      diff === 'Easy' ? '[&>div]:bg-emerald-500' : diff === 'Medium' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-destructive'
                    )} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-headline font-bold uppercase tracking-wider">Language Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {topLanguages.length > 0 ? (
              <div className="space-y-3">
                {topLanguages.map(([lang, count]) => (
                  <div key={lang}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium capitalize">{lang}</span>
                      <span className="text-muted-foreground">{count} sessions</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(count / maxLangCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No language data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-headline font-bold uppercase tracking-wider">Win/Loss History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-400">{winLossHistory.wins}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-destructive">{winLossHistory.losses}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Losses</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400">{winLossHistory.draws}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Draws</div>
              </div>
            </div>
            {totalGames > 0 && (
              <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${(winLossHistory.wins / totalGames) * 100}%` }} />
                <div className="h-full bg-destructive" style={{ width: `${(winLossHistory.losses / totalGames) * 100}%` }} />
                <div className="h-full bg-yellow-500" style={{ width: `${(winLossHistory.draws / totalGames) * 100}%` }} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-headline font-bold uppercase tracking-wider">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Coding Time</span>
                <span className="text-sm font-bold">{totalHours}h {totalMinutes}m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Problems Solved</span>
                <span className="text-sm font-bold">{totalProblems}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Win Rate</span>
                <span className="text-sm font-bold">{winRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Accuracy</span>
                <span className="text-sm font-bold">{accuracy}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trend</span>
                <span className={cn(
                  'text-sm font-bold flex items-center gap-1',
                  performanceTrend === 'up' ? 'text-emerald-400' : performanceTrend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  {performanceTrend === 'up' ? <TrendingUp className="w-4 h-4" /> : performanceTrend === 'down' ? <TrendingDown className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                  {performanceTrend === 'up' ? 'Improving' : performanceTrend === 'down' ? 'Declining' : 'Stable'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
