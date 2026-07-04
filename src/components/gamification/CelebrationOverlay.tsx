'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Trophy, Star, Flame, CheckCircle2, Medal, PartyPopper, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';

interface CelebrationEvent {
  id: string;
  type: 'first_program' | 'first_accepted' | 'level_up' | 'streak' | 'lesson_complete' | 'xp_milestone' | 'arena_unlock' | 'daily_goal';
  title: string;
  message: string;
  icon: any;
  color: string;
  xpGained?: number;
}

export function CelebrationOverlay() {
  const { state } = useAppStore();
  const { beginner } = state;
  const [events, setEvents] = useState<CelebrationEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<CelebrationEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const triggerEvent = useCallback((event: CelebrationEvent) => {
    setEvents(prev => [...prev, event]);
  }, []);

  useEffect(() => {
    if (events.length > 0 && !isVisible) {
      setCurrentEvent(events[0]);
      setIsVisible(true);
    }
  }, [events, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setEvents(prev => prev.slice(1));
      setCurrentEvent(null);
    }, 200);
  };

  // Expose triggerEvent globally
  useEffect(() => {
    (window as any).__celebrate = triggerEvent;
    return () => { (window as any).__celebrate = undefined; };
  }, [triggerEvent]);

  return (
    <>
      <AnimatePresence>
        {isVisible && currentEvent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-4 z-50 flex justify-center px-2 sm:inset-x-0 sm:bottom-6"
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className="w-full max-w-md rounded-3xl border border-primary/20 bg-background/95 p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30">
                  <currentEvent.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">{currentEvent.title}</h2>
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">{currentEvent.message}</p>
                  {currentEvent.xpGained && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                      <Zap className="h-4 w-4" />
                      +{currentEvent.xpGained} XP
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <Button onClick={handleDismiss} className="gap-2 rounded-full">
                  Awesome! <PartyPopper className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Helper to trigger celebrations from anywhere
export function celebrate(event: Omit<CelebrationEvent, 'id'>) {
  if ((window as any).__celebrate) {
    (window as any).__celebrate({ ...event, id: Math.random().toString() });
  }
}
