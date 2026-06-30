'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Zap, Star, Flame, Lock, Check, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDailyLogin } from '@/hooks/use-daily-login';
import { DailyReward } from '@/app/lib/types';

interface DailyLoginRewardsProps {
  userId: string | null;
}

export function DailyLoginRewards({ userId }: DailyLoginRewardsProps) {
  const { canClaim, streak, currentDay, claimedToday, loading, rewards, claimReward } = useDailyLogin(userId);
  const [claiming, setClaiming] = React.useState(false);
  const [claimedReward, setClaimedReward] = React.useState<DailyReward | null>(null);

  const handleClaim = async () => {
    setClaiming(true);
    const reward = rewards[currentDay];
    const success = await claimReward();
    if (success && reward) {
      setClaimedReward(reward);
      setTimeout(() => setClaimedReward(null), 3000);
    }
    setClaiming(false);
  };

  if (loading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-20 w-full bg-muted rounded animate-pulse" />
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
            <Gift className="w-5 h-5 text-primary" />
            Daily Rewards
          </CardTitle>
          {streak > 0 && (
            <div className="flex items-center gap-1.5">
              <Flame className={cn('w-4 h-4', streak >= 3 ? 'text-orange-400' : 'text-muted-foreground')} />
              <span className={cn('text-sm font-bold', streak >= 3 ? 'text-orange-400' : 'text-muted-foreground')}>
                {streak} day streak
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {rewards.map((reward, i) => {
            const isCurrentDay = i === currentDay && canClaim;
            const isClaimed = i < currentDay || (i === currentDay && claimedToday);
            const isLocked = i > currentDay || (i === currentDay && !canClaim && !claimedToday);
            const isSpecial = i === 6;

            return (
              <div
                key={i}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-lg border transition-all',
                  isClaimed && 'bg-emerald-500/10 border-emerald-500/30 opacity-60',
                  isCurrentDay && 'bg-primary/10 border-primary/50 animate-pulse',
                  isLocked && 'bg-muted/20 border-border/30 opacity-40',
                  isSpecial && isCurrentDay && 'border-yellow-400/50 bg-yellow-400/10',
                  isSpecial && isClaimed && 'border-yellow-400/30 bg-yellow-400/5'
                )}
              >
                <div className="text-[10px] font-bold text-muted-foreground mb-1">Day {i + 1}</div>
                {isSpecial && <Star className="w-4 h-4 text-yellow-400 mb-1" />}
                <div className="flex items-center gap-0.5 text-xs font-bold">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  {reward.coins}
                </div>
                <div className="flex items-center gap-0.5 text-xs font-bold">
                  <Zap className="w-3 h-3 text-primary" />
                  {reward.xp}
                </div>
                {isClaimed && <Check className="w-3 h-3 text-emerald-400 mt-1" />}
                {isLocked && <Lock className="w-3 h-3 text-muted-foreground mt-1" />}
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {claimedReward && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center"
            >
              <p className="text-emerald-400 font-bold text-sm">
                Claimed! +{claimedReward.coins} coins, +{claimedReward.xp} XP
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleClaim}
          disabled={!canClaim || claiming}
          className="w-full gap-2"
          size="lg"
        >
          <Gift className="w-4 h-4" />
          {claiming ? 'Claiming...' : claimedToday ? 'Claimed Today' : canClaim ? `Claim Day ${currentDay + 1} Reward` : 'Come Back Tomorrow'}
        </Button>
      </CardContent>
    </Card>
  );
}
