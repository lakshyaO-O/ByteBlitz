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
  const codeWriteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittingRef = useRef(false);

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
      const me = b.player1?.userId === user?.uid
        ? b.player1
        : b.player2?.userId === user?.uid ? b.player2 : null;
      if (b.phase === 'countdown' && me) {
        setCode(me.code || '');
        setLanguage((me.language as CodingLanguage) || 'python');
      }
      if (b.phase === 'finished' && me && me.result !== 'pending') {
        setResult({
          passed: me.passedTestCases,
          total: me.totalTestCases,
          verdict: me.result === 'win' ? 'Victory' : me.result === 'draw' ? 'Draw' : 'Defeat',
        });
      }
    });

    unsubscribeRef.current = unsub || null;
    return () => { if (unsub) unsub(); };
  }, [battleId, user?.uid]);

  // Flush pending debounced code write on unmount
  useEffect(() => () => {
    if (codeWriteTimerRef.current) clearTimeout(codeWriteTimerRef.current);
  }, []);

  const startCoding = useCallback(async () => {
    if (!battleId) return;
    try {
      await updateBattlePhase(battleId, 'coding');
    } catch { /* both players race this write; first wins, second is a no-op retry */ }
  }, [battleId]);

  const handleSubmit = useCallback(async () => {
    if (!battleId || !user?.uid) return;
    if (submittingRef.current || submitting) return;
    submittingRef.current = true;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await submitBattleCode(battleId, user.uid, code, language, []);
      setResult({ passed: res.passed, total: res.total, verdict: res.verdict });
    } catch (e: any) {
      setError(e?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [battleId, user?.uid, code, language, submitting]);

  const updateCode = useCallback((newCode: string) => {
    setCode(newCode);
    if (!battleId || !user?.uid) return;
    if (codeWriteTimerRef.current) clearTimeout(codeWriteTimerRef.current);
    codeWriteTimerRef.current = setTimeout(() => {
      updatePlayerProgress(battleId, user.uid, { code: newCode }).catch(() => { /* tolerate */ });
    }, 500);
  }, [battleId, user?.uid]);

  return {
    battle, loading, error, code, language, submitting, result,
    setLanguage, setCode: updateCode, startCoding, handleSubmit,
  };
}
