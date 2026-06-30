'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth } from '../provider';
import { isDemoMode } from '../config';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demo = isDemoMode();

    if (demo) {
      const checkMockUser = () => {
        try {
          const stored = localStorage.getItem('mock_user');
          if (stored) {
            setUser(JSON.parse(stored));
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
        setLoading(false);
      };

      checkMockUser();
      window.addEventListener('mock-auth-change', checkMockUser);
      return () => window.removeEventListener('mock-auth-change', checkMockUser);
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
