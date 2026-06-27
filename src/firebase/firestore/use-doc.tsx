'use client';

import { useState, useEffect } from 'react';
import { 
  doc, 
  onSnapshot, 
  DocumentReference, 
  DocumentData, 
  DocumentSnapshot,
  getFirestore
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { useFirestore } from '../provider';
import { firebaseConfig } from '../config';

export function useDoc(path: string | null) {
  const firestore = useFirestore();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const isDemoMode = firebaseConfig.apiKey === 'demo-key';

    if (isDemoMode) {
      if (!path) {
        setLoading(false);
        return;
      }

      const checkMockDoc = () => {
        // Read user doc or mock documents from localStorage
        const storedDb = localStorage.getItem('mock_firestore_db') || '{}';
        const db = JSON.parse(storedDb);
        let docData = db[path];

        // If path is a user profile and doesn't exist, create default
        if (!docData && path.startsWith('users/')) {
          const userId = path.split('/')[1];
          const mockUser = localStorage.getItem('mock_user');
          const username = mockUser ? JSON.parse(mockUser).displayName : 'Guest Coder';
          
          docData = {
            id: userId,
            uid: userId,
            username: username,
            email: mockUser ? JSON.parse(mockUser).email : 'guest@example.com',
            rating: 1200,
            highestRating: 1200,
            wins: 5,
            losses: 3,
            draws: 1,
            xp: 350,
            level: 2,
            tier: 'Beginner',
            photoURL: `https://picsum.photos/seed/${username}/200/200`,
            createdAt: new Date().toISOString(),
          };
          db[path] = docData;
          localStorage.setItem('mock_firestore_db', JSON.stringify(db));
        }

        setData(docData || null);
        setLoading(false);
      };

      checkMockDoc();

      window.addEventListener('mock-db-change', checkMockDoc);
      return () => window.removeEventListener('mock-db-change', checkMockDoc);
    }

    if (!firestore || !path) {
      if (!path) setLoading(false);
      return;
    }

    const docRef = doc(firestore, path);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        setData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        setLoading(false);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path]);

  return { data, loading, error };
}
