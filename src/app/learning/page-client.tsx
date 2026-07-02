'use client';

import React, { useState } from 'react';
import { CompleteRoadmap } from '@/components/learning/CompleteRoadmap';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app-store';
import { BookOpen, Zap, Star, Target, Sparkles, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { totalLessons } from '@/data/lessons';

export default function LearningPage() {
  const { state } = useAppStore();
  const { beginner } = state;

  const completedCount = beginner.lessonsCompleted.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-black tracking-tight">
              Learning <span className="text-primary neon-text">Roadmap</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Follow this path from beginner to Arena-ready. Complete each lesson to unlock the next.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">{beginner.xp} XP</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-sm">{beginner.coins}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
              <Flame className={cn('w-4 h-4', beginner.streak >= 3 ? 'text-orange-400' : 'text-muted-foreground')} />
              <span className="font-bold text-sm">{beginner.streak}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Lessons Done" value={`${completedCount}/${totalLessons}`} icon={BookOpen} color="text-primary" />
          <StatCard label="Completion" value={`${Math.round((completedCount / totalLessons) * 100)}%`} icon={Target} color="text-emerald-400" />
          <StatCard label="Current Level" value={`${Math.floor(beginner.xp / 500) + 1}`} icon={Zap} color="text-secondary" />
          <StatCard label="Next Unlock" value={completedCount >= 15 ? 'Arena!' : `Lesson ${completedCount + 2}`} icon={Sparkles} color="text-yellow-400" />
        </div>

        {beginner.isBeginnerMode && completedCount < 1 && (
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg">Welcome to your Learning Journey!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This roadmap will take you from absolute beginner to Arena-ready. Each lesson builds on the previous one.
                    Take your time, practice often, and celebrate every win!
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">16 lessons</Badge>
                    <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">~15 min each</Badge>
                    <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400">2000+ XP total</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* The complete roadmap */}
        <CompleteRoadmap />

      </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <Card className="bg-card/50 border-border/80">
      <CardContent className="p-4 text-center space-y-1">
        <Icon className={cn('w-5 h-5 mx-auto', color)} />
        <div className={cn('text-xl font-headline font-bold', color)}>{value}</div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">{label}</div>
      </CardContent>
    </Card>
  );
}
