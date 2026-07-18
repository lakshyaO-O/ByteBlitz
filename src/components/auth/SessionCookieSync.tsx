'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';

export function SessionCookieSync() {
  const auth = useAuth();

  async function setSessionCookie(token: string) {
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async function clearSessionCookie() {
    await fetch('/api/auth/session', { method: 'DELETE' });
  }

  useEffect(() => {
    if (!auth) return;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          await setSessionCookie(token);
        } catch {
          await clearSessionCookie();
        }
      } else {
        await clearSessionCookie();
      }
    });

    return () => unsub();
  }, [auth]);

  return null;
}
