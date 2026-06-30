'use client';

import { useState, useEffect, useCallback } from 'react';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { DailyReward } from '@/app/lib/types';

const DAILY_REWARDS: DailyReward[] = [
  { day: 1, coins: 50, xp: 25, claimed: false },
  { day: 2, coins: 75, xp: 40, claimed: false },
  { day: 3, coins: 100, xp: 60, claimed: false },
  { day: 4, coins: 125, xp: 80, claimed: false },
  { day: 5, coins: 150, xp: 100, claimed: false },
  { day: 6, coins: 200, xp: 130, claimed: false },
  { day: 7, coins: 500, xp: 250, claimed: false },
];

export function useDailyLogin(userId: string | null) {
  const [canClaim, setCanClaim] = useState(false);
  const [streak, setStreak] = useState(0);
  const [currentDay, setCurrentDay] = useState(0);
  const [claimedToday, setClaimedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<DailyReward[]>(DAILY_REWARDS);

  useEffect(() => {
    if (!userId) return;
    checkDailyStatus(userId);
  }, [userId]);

  const checkDailyStatus = async (uid: string) => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return; }
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) { setLoading(false); return; }
      const data = userDoc.data();
      const lastLogin = data.lastLoginDate || '';
      const today = new Date().toDateString();
      const lastLoginDate = lastLogin ? new Date(lastLogin).toDateString() : '';
      const currentStreak = data.dailyLoginStreak || 0;
      setStreak(currentStreak);

      if (lastLoginDate === today) {
        setCanClaim(false);
        setClaimedToday(true);
        setCurrentDay(data.lastRewardDay || 0);
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastLoginDate === yesterday.toDateString()) {
          const nextDay = (data.lastRewardDay || 0) % 7;
          setCurrentDay(nextDay);
          setCanClaim(true);
        } else {
          setStreak(0);
          setCurrentDay(0);
          setCanClaim(true);
        }
      }
      setLoading(false);
    } catch { setLoading(false); }
  };

  const claimReward = useCallback(async () => {
    if (!userId || !canClaim || claimedToday) return false;
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return false;
      const day = currentDay;
      const reward = DAILY_REWARDS[day];
      if (!reward) return false;

      const newStreak = streak + 1;
      const newDay = (day + 1) % 7;

      await updateDoc(doc(db, 'users', userId), {
        coins: increment(reward.coins),
        xp: increment(reward.xp),
        dailyLoginStreak: newStreak,
        lastLoginDate: new Date().toISOString(),
        lastRewardDay: newDay,
        lastActive: serverTimestamp(),
      });

      if (newStreak === 7) {
        await addDoc(collection(db, 'users', userId, 'notifications'), {
          userId,
          type: 'achievement_unlock',
          title: 'Week Warrior!',
          message: 'You claimed a full week of daily rewards!',
          data: { reward: 'weekly_bonus' },
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setStreak(newStreak);
      setCurrentDay(newDay);
      setCanClaim(false);
      setClaimedToday(true);
      return true;
    } catch { return false; }
  }, [userId, canClaim, claimedToday, currentDay, streak]);

  return { canClaim, streak, currentDay, claimedToday, loading, rewards, claimReward };
}
