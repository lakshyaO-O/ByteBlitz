'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth } from '../provider';
import { authLog } from '@/lib/auth-debug';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

// Safety fallback ONLY. Firebase normally emits the restored session state
// within a moment. If the SDK never produces an initial state (blocked
// network, hung auth domain, misconfig) we refuse to block navigation
// forever and fall through as signed-out so the AuthGuard can route the
// user to /auth cleanly instead of showing an eternal spinner.
const AUTH_RESOLVE_TIMEOUT_MS = 15000;

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      authLog('Auth', 'auth unavailable (not configured) → unauthenticated');
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
        authLog('Auth', `initial state resolved → ${firebaseUser ? 'authenticated' : 'unauthenticated'}`);
        setUser(firebaseUser);
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        authLog('Auth', 'state error:', (err as Error | undefined)?.message);
        setError((err as Error).message || 'Authentication error');
        setLoading(false);
      }
    );

    // Fallback only: never wait on Firebase past the safety window.
    const fallbackTimer = window.setTimeout(() => {
      if (!active) return;
      authLog('Auth', 'no initial auth state within safety window → resolving as unauthenticated');
      setLoading(false);
    }, AUTH_RESOLVE_TIMEOUT_MS);

    return () => {
      active = false;
      window.clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, [auth]);

  const status: AuthStatus = loading ? 'initializing' : user ? 'authenticated' : 'unauthenticated';

  return { user, loading, error, status };
}