'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { Transaction } from 'firebase/firestore';

export function useUsernameAvailability() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const checkUsername = useCallback((name: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (name.length < 3) { setAvailable(null); return; }
    setChecking(true);
    timerRef.current = setTimeout(async () => {
      try {
        const { firestore: db } = initializeFirebase();
        if (!db) return;
        const q = query(collection(db, 'usernames'), where('name', '==', name.toLowerCase()));
        const snap = await getDocs(q);
        setAvailable(snap.empty);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 400);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { available, checking, checkUsername };
}

export function useClaimUsername() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimUsername = useCallback(async (userId: string, username: string, previousUsername?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return false; }
      const normalized = username.toLowerCase();
      await runTransaction(db, async (transaction: Transaction) => {
        const usernameRef = doc(db, 'usernames', normalized);
        const usernameSnap = await transaction.get(usernameRef);
        if (usernameSnap.exists() && usernameSnap.data()?.userId !== userId) {
          throw new Error('Username already taken');
        }
        transaction.set(usernameRef, { name: normalized, userId, claimedAt: serverTimestamp() }, { merge: true });
        if (previousUsername && previousUsername.toLowerCase() !== normalized) {
          const prevRef = doc(db, 'usernames', previousUsername.toLowerCase());
          transaction.delete(prevRef);
        }
      });
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to claim username');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { claimUsername, loading, error };
}
