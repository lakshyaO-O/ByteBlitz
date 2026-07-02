'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, serverTimestamp, increment, Timestamp,
} from 'firebase/firestore';
import type { AIUsage, UserProfile } from '@/types';

const DAILY_LIMITS: Record<string, { free: number; pro: number; elite: number }> = {
  mentor: { free: 5, pro: 20, elite: 50 },
  codeReview: { free: 3, pro: 15, elite: 40 },
  debugger: { free: 5, pro: 25, elite: 60 },
  interviewer: { free: 1, pro: 5, elite: 15 },
  roadmap: { free: 2, pro: 10, elite: 30 },
  resumeReview: { free: 1, pro: 5, elite: 20 },
};

function getDailyLimit(feature: string, subscriptionTier: string): number {
  const limits = DAILY_LIMITS[feature];
  if (!limits) return 0;
  return limits[subscriptionTier as keyof typeof limits] || limits.free;
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getAIUsage(userId: string): Promise<AIUsage | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;

  const snap = await getDoc(doc(db, 'users', userId, 'aiUsage', 'stats'));
  if (!snap.exists()) return null;

  return snap.data() as AIUsage;
}

export async function checkAILimit(
  userId: string, feature: string,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { allowed: false, remaining: 0, limit: 0 };

  const userSnap = await getDoc(doc(db, 'users', userId));
  if (!userSnap.exists()) return { allowed: false, remaining: 0, limit: 0 };

  const userData = userSnap.data() as UserProfile;
  const tier = userData.subscriptionTier || 'free';

  const featureLimit = getDailyLimit(feature, tier);

  const today = getTodayDateString();
  const usageRef = doc(db, 'users', userId, 'aiUsage', 'stats');
  const usageSnap = await getDoc(usageRef);

  let dailyUsed = 0;
  if (usageSnap.exists()) {
    const data = usageSnap.data() as AIUsage;
    const featureData = data[feature as keyof AIUsage];
    if (featureData && (featureData as any).lastUsed?.startsWith?.(today)) {
      dailyUsed = (featureData as any).daily || 0;
    }
  }

  const remaining = Math.max(0, featureLimit - dailyUsed);
  return {
    allowed: remaining > 0,
    remaining,
    limit: featureLimit,
  };
}

export async function incrementAILimit(userId: string, feature: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  const ref = doc(db, 'users', userId, 'aiUsage', 'stats');
  const snap = await getDoc(ref);

  const today = getTodayDateString();

  if (snap.exists()) {
    const data = snap.data() as AIUsage;
    const current = data[feature as keyof AIUsage] || { daily: 0, total: 0, lastUsed: '' };
    const isNewDay = !(current as any).lastUsed?.startsWith?.(today);

    await updateDoc(ref, {
      [`${feature}.daily`]: isNewDay ? 1 : increment(1),
      [`${feature}.total`]: increment(1),
      [`${feature}.lastUsed`]: new Date().toISOString(),
    });
  } else {
    const initialUsage: AIUsage = {
      mentor: { daily: 0, total: 0, lastUsed: '' },
      codeReview: { daily: 0, total: 0, lastUsed: '' },
      debugger: { daily: 0, total: 0, lastUsed: '' },
      interviewer: { daily: 0, total: 0, lastUsed: '' },
      roadmap: { daily: 0, total: 0, lastUsed: '' },
      resumeReview: { daily: 0, total: 0, lastUsed: '' },
    };
    initialUsage[feature as keyof AIUsage] = {
      daily: 1,
      total: 1,
      lastUsed: new Date().toISOString(),
    };
    await setDoc(ref, initialUsage);
  }
}

export async function getRemainingCredits(userId: string, feature: string): Promise<number> {
  const result = await checkAILimit(userId, feature);
  return result.remaining;
}
