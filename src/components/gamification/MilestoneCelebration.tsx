'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Star, Gift, Flame, Crown, TrendingUp, Medal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { AppNotification } from '@/app/lib/types';

interface MilestoneCelebrationProps {
  userId: string | null;
  onDismiss?: () => void;
}

const MILESTONE_ICONS: Record<string, any> = {
  level_up: TrendingUp,
  achievement: Trophy,
  streak: Flame,
  rank_up: Crown,
  win_streak: Medal,
};

const MILESTONE_COLORS: Record<string, string> = {
  level_up: 'text-primary',
  achievement: 'text-yellow-400',
  streak: 'text-orange-400',
  rank_up: 'text-purple-400',
  win_streak: 'text-emerald-400',
};

export function MilestoneCelebration({ userId, onDismiss }: MilestoneCelebrationProps) {
  const [milestones, setMilestones] = useState<AppNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const { firestore: db } = initializeFirebase();
    if (!db) return;

    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('type', 'in', ['achievement_unlock', 'rank_change']),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const newMilestones = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as AppNotification))
        .filter(n => !n.read);
      if (newMilestones.length > 0) {
        setMilestones(newMilestones);
      }
    });

    return () => unsub();
  }, [userId]);

  const handleDismiss = async (notificationId: string) => {
    if (!userId) return;
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { read: true });
    } catch (e) { console.warn('[Milestone] Failed to dismiss notification:', e); }
    if (currentIndex < milestones.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsVisible(false);
      onDismiss?.();
    }
  };

  if (milestones.length === 0 || !isVisible) return null;

  const milestone = milestones[currentIndex];
  const IconComponent = MILESTONE_ICONS[milestone.type] || Sparkles;
  const colorClass = MILESTONE_COLORS[milestone.type] || 'text-primary';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      >
        <Card className="bg-card border-border max-w-sm mx-4 overflow-hidden">
          <div className="p-8 text-center">
            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="mb-4"
            >
              <div className={cn('w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto', colorClass.replace('text-', 'bg-').replace('400', '500/10'))}>
                <IconComponent className={cn('w-10 h-10', colorClass)} />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-headline font-bold mb-2">{milestone.title}</h3>
              <p className="text-sm text-muted-foreground mb-6">{milestone.message}</p>
              <Button onClick={() => handleDismiss(milestone.id || '')} className="w-full">
                Awesome!
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
