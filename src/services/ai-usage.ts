'use client';

import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, runTransaction } from 'firebase/firestore';
import type { Transaction } from 'firebase/firestore';
import type {
  AiFeature, AiFeatureLimit, AiLimitsConfig, SubscriptionTier,
} from '@/config/ai-limits';
import {
  DEFAULT_AI_LIMITS, getLimitForTier, getCurrentPeriodKey,
  getNextResetTime, isPremiumTier, AI_QUOTAS_CONFIG_DOC,
} from '@/config/ai-limits';

export interface AiUsageDoc {
  count: number;
  period: string;
  resetAt: Timestamp;
  lastUsedAt: Timestamp | null;
}

export interface AiUsageCheck {
  allowed: boolean;
  remaining: number | null;
  limit: number | null;
  used: number;
  percentage: number;
  resetAt: Date | null;
  isPremium: boolean;
  isExhausted: boolean;
}

export interface AiUsageState {
  remaining: number | null;
  limit: number | null;
  used: number;
  percentage: number;
  resetAt: Date | null;
  isPremium: boolean;
  isExhausted: boolean;
}

async function loadConfigOverride(): Promise<Partial<AiLimitsConfig> | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'config', 'aiQuotas'));
    if (snap.exists()) {
      const data = snap.data();
      if (data.features) return data.features as Partial<AiLimitsConfig>;
    }
  } catch { /* fallback to defaults */ }
  return null;
}

export async function fetchUserTier(userId: string): Promise<SubscriptionTier> {
  const { firestore: db } = initializeFirebase();
  if (!db) return 'free';
  const snap = await getDoc(doc(db, 'users', userId));
  return (snap.data()?.subscriptionTier || 'free') as SubscriptionTier;
}

function usageDocRef(userId: string, feature: AiFeature) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  return doc(db, 'users', userId, 'aiUsage', feature);
}

async function getOrCreateUsageDoc(
  userId: string, feature: AiFeature,
): Promise<{ doc: AiUsageDoc; isNew: boolean }> {
  const ref = usageDocRef(userId, feature);
  if (!ref) throw new Error('Firebase not available');

  const snap = await getDoc(ref);
  const expectedPeriod = getCurrentPeriodKey(feature);

  if (snap.exists()) {
    const data = snap.data() as AiUsageDoc;
    if (data.period === expectedPeriod) {
      return { doc: data, isNew: false };
    }
    const resetAt = Timestamp.fromDate(getNextResetTime(feature));
    await setDoc(ref, { count: 0, period: expectedPeriod, resetAt, lastUsedAt: null });
    return { doc: { count: 0, period: expectedPeriod, resetAt, lastUsedAt: null }, isNew: true };
  }

  const resetAt = Timestamp.fromDate(getNextResetTime(feature));
  await setDoc(ref, { count: 0, period: expectedPeriod, resetAt, lastUsedAt: null });
  return { doc: { count: 0, period: expectedPeriod, resetAt, lastUsedAt: null }, isNew: true };
}

export async function checkAiUsage(
  userId: string, feature: AiFeature,
): Promise<AiUsageCheck> {
  const tier = await fetchUserTier(userId);

  if (isPremiumTier(tier)) {
    return {
      allowed: true, remaining: null, limit: null, used: 0,
      percentage: 0, resetAt: null, isPremium: true, isExhausted: false,
    };
  }

  const configOverride = await loadConfigOverride();
  const featureLimit = getLimitForTier(feature, tier, configOverride || undefined);

  if (!featureLimit) {
    return {
      allowed: true, remaining: null, limit: null, used: 0,
      percentage: 0, resetAt: null, isPremium: false, isExhausted: false,
    };
  }

  const maxCount = featureLimit.daily ?? featureLimit.monthly ?? Infinity;
  const { doc: usageDoc } = await getOrCreateUsageDoc(userId, feature);
  const used = usageDoc.count;
  const remaining = Math.max(0, maxCount - used);
  const percentage = maxCount > 0 ? Math.min(100, (used / maxCount) * 100) : 0;

  return {
    allowed: remaining > 0,
    remaining,
    limit: maxCount,
    used,
    percentage,
    resetAt: usageDoc.resetAt?.toDate() || null,
    isPremium: false,
    isExhausted: remaining <= 0,
  };
}

export async function incrementAiUsage(
  userId: string, feature: AiFeature,
): Promise<void> {
  const ref = usageDocRef(userId, feature);
  if (!ref) return;

  const { firestore: db } = initializeFirebase();
  if (!db) return;

  await runTransaction(db, async (tx: Transaction) => {
    const snap = await tx.get(ref);
    const expectedPeriod = getCurrentPeriodKey(feature);
    let newCount = 1;

    if (snap.exists()) {
      const data = snap.data() as AiUsageDoc;
      if (data.period === expectedPeriod) {
        newCount = (data.count || 0) + 1;
      }
    }

    tx.set(ref, {
      count: newCount,
      period: expectedPeriod,
      resetAt: Timestamp.fromDate(getNextResetTime(feature)),
      lastUsedAt: serverTimestamp(),
    }, { merge: true });
  });
}

export async function getAiUsageState(
  userId: string, feature: AiFeature,
): Promise<AiUsageState> {
  const check = await checkAiUsage(userId, feature);
  return {
    remaining: check.remaining,
    limit: check.limit,
    used: check.used,
    percentage: check.percentage,
    resetAt: check.resetAt,
    isPremium: check.isPremium,
    isExhausted: check.isExhausted,
  };
}

export async function resetAiUsage(userId: string, feature: AiFeature): Promise<void> {
  const ref = usageDocRef(userId, feature);
  if (!ref) return;
  const expectedPeriod = getCurrentPeriodKey(feature);
  await setDoc(ref, {
    count: 0,
    period: expectedPeriod,
    resetAt: Timestamp.fromDate(getNextResetTime(feature)),
    lastUsedAt: null,
  });
}

export async function resetAllAiUsage(userId: string): Promise<void> {
  const { AI_FEATURES } = await import('@/config/ai-limits');
  for (const feature of AI_FEATURES) {
    await resetAiUsage(userId, feature as AiFeature);
  }
}

// Backward-compatible aliases for existing AI pages
export async function checkAILimit(userId: string, feature: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const result = await checkAiUsage(userId, feature as AiFeature);
  return { allowed: result.allowed, remaining: result.remaining ?? 0, limit: result.limit ?? 0 };
}
export async function incrementAILimit(userId: string, feature: string): Promise<void> {
  await incrementAiUsage(userId, feature as AiFeature);
}
export async function getRemainingCredits(userId: string, feature: string): Promise<number> {
  const result = await checkAiUsage(userId, feature as AiFeature);
  return result.remaining ?? Infinity;
}

