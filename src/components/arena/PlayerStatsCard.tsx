"use client"

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, Trophy, Zap, Code2, Clock, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface PlayerStatsCardProps {
  username: string;
  rating: number;
  tier: string;
  photoURL?: string;
  language?: string;
  passedTestCases?: number;
  totalTestCases?: number;
  submissionCount?: number;
  result?: 'win' | 'loss' | 'draw' | 'pending';
  isOpponent?: boolean;
  isCurrentUser?: boolean;
  className?: string;
}

export function PlayerStatsCard({
  username,
  rating,
  tier,
  photoURL,
  language,
  passedTestCases,
  totalTestCases,
  submissionCount,
  result = 'pending',
  isOpponent,
  isCurrentUser,
  className,
}: PlayerStatsCardProps) {
  const testCaseProgress = passedTestCases !== undefined && totalTestCases !== undefined
    ? passedTestCases / totalTestCases
    : 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {photoURL ? (
              <AvatarImage src={photoURL} alt={username} />
            ) : null}
            <AvatarFallback>
              <User className="h-5 w-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">{username}</span>
              {isCurrentUser ? (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">You</Badge>
              ) : null}
              {isOpponent ? (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Opponent</Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Trophy className="h-3.5 w-3.5" />
              <span>{rating}</span>
              <span className="text-xs">&bull;</span>
              <span>{tier}</span>
            </div>
          </div>
        </div>

        {language ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Code2 className="h-3.5 w-3.5" />
            <span>{language}</span>
          </div>
        ) : null}

        {passedTestCases !== undefined && totalTestCases !== undefined ? (
          <div className="flex items-center gap-2 text-sm">
            {result === 'pending' ? (
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            ) : testCaseProgress === 1 ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={testCaseProgress === 1 ? 'text-green-500' : 'text-muted-foreground'}>
              {passedTestCases}/{totalTestCases} passed
            </span>
          </div>
        ) : null}

        {submissionCount !== undefined ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5" />
            <span>{submissionCount} submission{submissionCount !== 1 ? 's' : ''}</span>
          </div>
        ) : null}

        {result !== 'pending' ? (
          <div>
            {result === 'win' ? (
              <Badge className="bg-green-500/15 text-green-500 border-green-500/30 w-full justify-center">
                Victory
              </Badge>
            ) : result === 'loss' ? (
              <Badge variant="destructive" className="w-full justify-center">
                Defeat
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/15 text-yellow-500 border-yellow-500/30 w-full justify-center">
                Draw
              </Badge>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
