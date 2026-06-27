'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth } from '../provider';
import { firebaseConfig } from '../config';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemoMode = firebaseConfig.apiKey === 'demo-key';
    if (isDemoMode) {
      const checkMockUser = () => {
        const stored = localStorage.getItem('mock_user');
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
        setLoading(false);
      };

      checkMockUser();
      
      window.addEventListener('mock-auth-change', checkMockUser);
      return () => window.removeEventListener('mock-auth-change', checkMockUser);
    }

    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
  }, [auth]);

  return { user, loading };
}
