import { getAdminFirestore } from '@/firebase/admin';
import {
  DEFAULT_AI_LIMITS, getPeriodKey, getCurrentPeriodKey, getNextResetTime,
  isPremiumTier, AI_QUOTAS_CONFIG_DOC,
} from '@/config/ai-limits';
import type { AiFeature, SubscriptionTier } from '@/config/ai-limits';

export interface AiQuotaResult {
  allowed: boolean;
  retryAfterMs?: number;
  remaining: number | null;
  limit: number | null;
}

interface UsageSnapshot {
  count: number;
  period: string;
}

/**
 * Server-side AI quota enforcement using the Admin SDK.
 * The client-side counters (services/ai-usage.ts) remain for UI display only;
 * this check is authoritative and cannot be spoofed by calling the API directly.
 */
export async function enforceAiQuota(uid: string, feature: AiFeature): Promise<AiQuotaResult> {
  const db = getAdminFirestore();
  if (!db) return { allowed: false, remaining: null, limit: null, retryAfterMs: 60_000 };

  const [userSnap, configSnap] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('config').doc('aiQuotas').get().catch(() => null),
  ]);

  const tier = (userSnap.exists ? userSnap.data()?.subscriptionTier : 'free') || 'free';
  if (isPremiumTier(tier as SubscriptionTier)) {
    return { allowed: true, remaining: null, limit: null };
  }

  const override = configSnap?.exists ? (configSnap.data()?.features as any) : null;
  const configured = override?.[feature];
  const fallback = DEFAULT_AI_LIMITS[feature];
  const limitCfg = configured || fallback || null;
  if (!limitCfg) {
    return { allowed: true, remaining: null, limit: null };
  }

  const maxCount = (limitCfg.daily ?? limitCfg.monthly ?? null) as number | null;
  if (maxCount === null) {
    return { allowed: true, remaining: null, limit: null };
  }

  const ref = db.collection('users').doc(uid).collection('aiUsage').doc(feature);
  const expectedPeriod = getCurrentPeriodKey(feature);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? (snap.data() as Partial<UsageSnapshot>) : null;
    const used = data && data.period === expectedPeriod ? (data.count || 0) : 0;
    const remaining = Math.max(0, maxCount - used);

    if (remaining <= 0) {
      return { allowed: false, used, remaining: 0, limit: maxCount };
    }

    // Reset period keys when rolling over.
    tx.set(ref, {
      count: used + 1,
      period: expectedPeriod,
      periodType: getPeriodKey(feature),
      resetAt: data && data.period === expectedPeriod
        ? (data as any).resetAt
        : getNextResetTime(feature),
      lastUsedAt: new Date(),
      updatedAt: new Date(),
      uid,
      feature,
    }, { merge: true });

    return { allowed: true, used: used + 1, remaining: remaining - 1, limit: maxCount };
  });

  if (!result.allowed) {
    // Conservative retry hint: the period resets either at midnight UTC or the
    // 1st of next month; clients mostly show "limit reached".
    return { allowed: false, remaining: 0, limit: maxCount, retryAfterMs: 3600_000 };
  }

  return { allowed: true, remaining: result.remaining, limit: result.limit };
}

export function aiQuotaResponse(result: AiQuotaResult, feature: string): { message: string } {
  return { message: `Daily limit reached for ${feature}. Try again later.` };
}
