'use client';

import { useEffect, useRef } from 'react';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function usePresence(userId: string | null) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const setOnline = async () => {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      try {
        await setDoc(doc(db, 'users', userId), {
          onlineStatus: 'online',
          lastActive: serverTimestamp(),
        }, { merge: true });
      } catch { /* ignore */ }
    };

    const setOffline = async () => {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      try {
        await setDoc(doc(db, 'users', userId), {
          onlineStatus: 'offline',
          lastActive: serverTimestamp(),
        }, { merge: true });
      } catch { /* ignore */ }
    };

    setOnline();
    intervalRef.current = setInterval(setOnline, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') setOnline();
      else setOffline();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handleBeforeUnload = () => {
      setOffline();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
    };
  }, [userId]);
}
