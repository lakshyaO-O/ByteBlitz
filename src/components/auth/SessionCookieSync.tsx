'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';

export function SessionCookieSync() {
  const auth = useAuth();

  useEffect(() => {
    if (!auth) return;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          document.cookie = `__session=${token};path=/;max-age=604800;samesite=lax`;
        } catch {
          document.cookie = '__session=;path=/;max-age=0;samesite=lax';
        }
      } else {
        document.cookie = '__session=;path=/;max-age=0;samesite=lax';
      }
    });

    return () => unsub();
  }, [auth]);

  return null;
}
