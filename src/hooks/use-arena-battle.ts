'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import {
  subscribeBattle, updateBattlePhase, submitBattleCode, updatePlayerProgress,
} from '@/services/arena';
import type { BattleDocument, CodingLanguage } from '@/types';

export function useArenaBattle(battleId: string | null) {
  const { user } = useUser();
  const [battle, setBattle] = useState<BattleDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<CodingLanguage>('python');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ passed: number; total: number; verdict: string } | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!battleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const unsub = subscribeBattle(battleId, (b) => {
      setBattle(b);
      setLoading(false);
      if (b.phase === 'countdown' && b.players.length > 0) {
        const me = b.players.find(p => p.userId === user?.uid);
        if (me) {
          setCode(me.code || '');
          setLanguage(me.language as CodingLanguage);
        }
      }
      if (b.phase === 'finished') {
        const me = b.players.find(p => p.userId === user?.uid);
        if (me && me.result !== 'pending') {
          const isWin = me.result === 'win';
          const isDraw = me.result === 'draw';
          setResult({
            passed: me.passedTestCases,
            total: me.totalTestCases,
            verdict: isWin ? 'Victory' : isDraw ? 'Draw' : 'Defeat',
          });
        }
      }
    });

    unsubscribeRef.current = unsub || null;
    return () => { if (unsub) unsub(); };
  }, [battleId, user?.uid]);

  const startCoding = useCallback(async () => {
    if (!battleId) return;
    await updateBattlePhase(battleId, 'coding');
  }, [battleId]);

  const handleSubmit = useCallback(async () => {
    if (!battleId || !user?.uid || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const battle = await subscribeBattle(battleId, () => {});
      const testCases = (await import('@/services/arena')).fetchBattle;
      const res = await submitBattleCode(
        battleId, user.uid, code, language,
        [{ input: 'test', expected: 'test' }],
      );
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }, [battleId, user?.uid, code, language, submitting]);

  const updateCode = useCallback(async (newCode: string) => {
    setCode(newCode);
    if (!battleId || !user?.uid) return;
    try {
      await updatePlayerProgress(battleId, user.uid, { code: newCode });
    } catch { /* debounced write, tolerate error */ }
  }, [battleId, user?.uid]);

  return {
    battle, loading, error, code, language, submitting, result,
    setLanguage, setCode: updateCode, startCoding, handleSubmit,
  };
}
