'use client';

import { useEffect, useState } from 'react';
import { X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  xp: number;
}

interface AchievementPopupProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export function AchievementPopup({ achievement, onDismiss }: AchievementPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 transition-all duration-300 max-w-sm',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
    >
      <div className="bg-gradient-to-br from-yellow-500/20 via-primary/10 to-purple-500/20 border border-yellow-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-start gap-3">
          <div className="text-2xl">{achievement.icon}</div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">
              Achievement Unlocked!
            </p>
            <p className="text-sm font-bold text-foreground">{achievement.title}</p>
            <p className="text-xs text-muted-foreground">{achievement.desc}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-yellow-400">
              <Zap className="w-3 h-3" /> +{achievement.xp} XP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AchievementPopupContainer({
  achievements,
  onDismiss,
}: {
  achievements: Achievement[];
  onDismiss: (id: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (achievements.length === 0) setActiveIndex(0);
  }, [achievements.length]);

  if (achievements.length === 0 || activeIndex >= achievements.length) return null;

  return (
    <AchievementPopup
      achievement={achievements[activeIndex]}
      onDismiss={() => {
        if (activeIndex < achievements.length - 1) {
          setActiveIndex(i => i + 1);
        } else {
          onDismiss(achievements[activeIndex].id);
          setActiveIndex(0);
        }
      }}
    />
  );
}
