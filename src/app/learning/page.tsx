'use client';

import React, { useState, useEffect } from 'react';
import { LearningRoadmap } from '@/components/learning/LearningRoadmap';
import { WeeklyStats } from '@/components/analytics/WeeklyStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/premium/EmptyState';
import { BookOpen, Target, TrendingUp, CheckCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { LearningGoal, LearningPath } from '@/app/lib/types';
import { cn } from '@/lib/utils';

const AVAILABLE_GOALS: { key: LearningGoal; label: string; description: string; color: string }[] = [
  { key: 'DSA', label: 'Data Structures & Algorithms', description: 'Master arrays, trees, graphs, DP', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { key: 'Competitive Programming', label: 'Competitive Programming', description: 'Speed, optimization, contest strategy', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { key: 'Interviews', label: 'Technical Interviews', description: 'FAANG-style coding interview prep', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { key: 'Web Development', label: 'Web Development', description: 'Full-stack, frameworks, APIs', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { key: 'AI/ML', label: 'AI / Machine Learning', description: 'Neural networks, models, data science', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
];

export default function LearningPage() {
  const { user } = useUser();
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return; }
      const userDoc = await getDoc(doc(db, 'users', user!.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setGoals(data.learningGoals || []);
        setLearningPath(data.learningPath || null);
      }
    } catch (e) { console.warn('[Learning] Failed to load goals:', e); }
    setLoading(false);
  };

  const toggleGoal = async (goal: LearningGoal) => {
    const newGoals = goals.includes(goal) ? goals.filter(g => g !== goal) : [...goals, goal];
    setGoals(newGoals);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db || !user) return;
      const { doc: fireDoc, updateDoc } = await import('firebase/firestore');
      await updateDoc(fireDoc(db, 'users', user.uid), { learningGoals: newGoals });
    } catch (e) { console.warn('[Learning] Failed to save goal:', e); }
    if (newGoals.length > 0 && !learningPath) {
      setLearningPath({
        goals: newGoals,
        currentTopic: newGoals[0] === 'DSA' ? 'Arrays' : newGoals[0] === 'Competitive Programming' ? 'Time Complexity' : newGoals[0] === 'Interviews' ? 'Two Pointers' : newGoals[0] === 'Web Development' ? 'HTML/CSS' : 'Python Basics',
        nextChallenges: ['Two Sum', 'Valid Parentheses', 'Reverse String'],
        weakTopics: ['Dynamic Programming', 'Graphs'],
        strongTopics: ['Arrays', 'Strings'],
        recommendedFocus: 'Focus on Dynamic Programming - it appears in 40% of problems you struggle with.',
        progress: 25,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-headline font-bold">Learning Path</h1>
      </div>

      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Select Your Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AVAILABLE_GOALS.map(({ key, label, description, color }) => {
              const isSelected = goals.includes(key);
              return (
                <div
                  key={key}
                  onClick={() => toggleGoal(key)}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-all',
                    isSelected ? 'ring-2 ring-primary border-primary/50 bg-primary/5' : 'border-border/50 hover:border-border hover:bg-muted/20',
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={cn('text-xs', color)}>{key}</Badge>
                    {isSelected && <CheckCircle className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-sm font-bold mb-1">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <LearningRoadmap learningPath={learningPath || undefined} goals={goals} isLoading={loading} />

      {goals.length > 0 && (
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              Recommended Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <TrendingUp className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm font-bold">Next Recommended Challenge</p>
                  <p className="text-xs text-muted-foreground">Based on your goals and performance, try "Two Sum" to build your foundation.</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-1">
                  Start <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
