'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth } from '../provider';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (!active) return;
        setUser(firebaseUser);
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        setError(err.message || 'Authentication error');
        setLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth]);

  return { user, loading, error };
}
