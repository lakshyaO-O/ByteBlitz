'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, BookOpen, Lightbulb, TrendingUp, TrendingDown, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LearningGoal, LearningPath } from '@/app/lib/types';

interface LearningRoadmapProps {
  learningPath?: LearningPath;
  goals?: LearningGoal[];
  isLoading?: boolean;
}

const GOAL_LABELS: Record<LearningGoal, string> = {
  'DSA': 'Data Structures & Algorithms',
  'Competitive Programming': 'Competitive Programming',
  'Interviews': 'Technical Interviews',
  'Web Development': 'Web Development',
  'AI/ML': 'AI / Machine Learning',
};

const GOAL_COLORS: Record<LearningGoal, string> = {
  'DSA': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'Competitive Programming': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'Interviews': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'Web Development': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  'AI/ML': 'bg-pink-500/10 text-pink-400 border-pink-500/30',
};

export function LearningRoadmap({ learningPath, goals = [], isLoading }: LearningRoadmapProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Learning Roadmap
          </CardTitle>
          {learningPath && (
            <span className="text-sm text-muted-foreground">{Math.round(learningPath.progress)}% complete</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 && !learningPath ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Select your learning goals to get a personalized roadmap</p>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(GOAL_LABELS).map(([key, label]) => (
                <Badge key={key} variant="outline" className="text-xs cursor-pointer hover:bg-muted transition-colors">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {goals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {goals.map(goal => (
                  <Badge key={goal} className={cn('text-xs', GOAL_COLORS[goal])}>
                    {GOAL_LABELS[goal]}
                  </Badge>
                ))}
              </div>
            )}

            {learningPath ? (
              <>
                <Progress value={learningPath.progress} className="h-2" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Strong Topics</span>
                    </div>
                    {learningPath.strongTopics.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {learningPath.strongTopics.map(topic => (
                          <span key={topic} className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded-md flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {topic}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Complete more challenges to identify strengths</p>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="w-4 h-4 text-destructive" />
                      <span className="text-xs font-bold uppercase tracking-widest text-destructive">Needs Work</span>
                    </div>
                    {learningPath.weakTopics.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {learningPath.weakTopics.map(topic => (
                          <span key={topic} className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-md flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {topic}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Keep practicing to identify areas for growth</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Recommended Focus</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{learningPath.recommendedFocus}</p>
                </div>

                {learningPath.nextChallenges.length > 0 && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Next Challenges</span>
                    <div className="space-y-2">
                      {learningPath.nextChallenges.slice(0, 3).map((challenge, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">{i + 1}</span>
                            </div>
                            <span className="text-sm">{challenge}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Select goals above and start coding to generate your personalized roadmap</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
