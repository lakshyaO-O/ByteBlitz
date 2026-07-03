'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AiFeature } from '@/config/ai-limits';
import {
  checkAiUsage, incrementAiUsage,
  getAiUsageState,
} from '@/services/ai-usage';
import type { AiUsageState } from '@/services/ai-usage';

interface UseAiUsageReturn extends AiUsageState {
  loading: boolean;
  refresh: () => Promise<void>;
  consume: () => Promise<boolean>;
  error: string | null;
  countdown: string;
}

export function useAiUsage(userId: string | null, feature: AiFeature | null): UseAiUsageReturn {
  const [state, setState] = useState<AiUsageState>({
    remaining: null, limit: null, used: 0,
    percentage: 0, resetAt: null, isPremium: false,
    isExhausted: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || !feature) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await getAiUsageState(userId, feature);
      setState(result);
      setError(null);
    } catch (e) {
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  }, [userId, feature]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const computeCountdown = useCallback(() => {
    if (!state.resetAt) {
      setCountdown('');
      return;
    }
    const now = Date.now();
    const diff = state.resetAt.getTime() - now;
    if (diff <= 0) {
      setCountdown('Resetting soon');
      refresh();
      return;
    }
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (hours > 0) {
      setCountdown(`${hours}h ${minutes}m`);
    } else if (minutes > 0) {
      setCountdown(`${minutes}m ${secs}s`);
    } else {
      setCountdown(`${secs}s`);
    }
  }, [state.resetAt, refresh]);

  useEffect(() => {
    computeCountdown();
    intervalRef.current = setInterval(computeCountdown, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [computeCountdown]);

  const consume = useCallback(async (): Promise<boolean> => {
    if (!userId || !feature) return false;
    if (state.isPremium) {
      await incrementAiUsage(userId, feature);
      return true;
    }
    if (state.isExhausted) return false;

    await incrementAiUsage(userId, feature);
    const updated = await getAiUsageState(userId, feature);
    setState(updated);
    return true;
  }, [userId, feature, state.isPremium, state.isExhausted]);

  return {
    ...state,
    loading,
    refresh,
    consume,
    error,
    countdown,
  };
}
