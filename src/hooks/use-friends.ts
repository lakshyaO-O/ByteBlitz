'use client';

import { useState, useCallback, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  limit,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { FriendDoc } from '@/app/lib/types';

export function useFriends(userId: string | null) {
  const [friends, setFriends] = useState<FriendDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    let unsubscribe: (() => void) | null = null;
    const { firestore: db } = initializeFirebase();
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, 'users', userId, 'friends'), orderBy('addedAt', 'desc'));
    unsubscribe = onSnapshot(q, (snapshot: any) => {
      setFriends(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Friends listener error:', err);
      const pe = new FirestorePermissionError({ path: 'users/' + userId + '/friends', operation: 'list' });
      errorEmitter.emit('permission-error', pe);
      setError('Failed to load friends');
      setLoading(false);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [userId]);

  return { friends, loading, error, refresh: () => {} };
}

export function useSendFriendRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendRequest = useCallback(async (params: {
    fromUserId: string; fromUsername: string; fromPhotoURL: string; toUserId: string; toUsername: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return false; }
      await addDoc(collection(db, 'users', params.toUserId, 'friendRequests'), {
        fromUserId: params.fromUserId, fromUsername: params.fromUsername, fromPhotoURL: params.fromPhotoURL,
        toUserId: params.toUserId, status: 'pending', createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'users', params.toUserId, 'notifications'), {
        userId: params.toUserId, type: 'friend_request', title: 'New Friend Request',
        message: params.fromUsername + ' sent you a friend request',
        data: { fromUserId: params.fromUserId, fromUsername: params.fromUsername, fromPhotoURL: params.fromPhotoURL },
        read: false, createdAt: serverTimestamp(),
      });
      return true;
    } catch (err: any) { setError(err.message || 'Failed'); return false; }
    finally { setLoading(false); }
  }, []);

  return { sendRequest, loading, error };
}

export function useAcceptFriendRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptRequest = useCallback(async (params: { requestId: string; toUserId: string; fromUser: any }) => {
    setLoading(true);
    setError(null);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return false; }
      await updateDoc(doc(db, 'users', params.toUserId, 'friendRequests', params.requestId), { status: 'accepted' });
      const fu = params.fromUser;
      const fid = fu.uid || fu.id || 'unknown';
      const currentUserSnapshot = await getDoc(doc(db, 'users', params.toUserId));
      const currentUser = currentUserSnapshot.data() || {};
      const requesterFriendDoc = {
        username: fu.username || 'Unknown', photoURL: fu.photoURL || '',
        tier: fu.tier || 'Beginner', rating: fu.rating || 1200,
        onlineStatus: fu.onlineStatus || 'offline', addedAt: serverTimestamp(),
      };
      const currentUserFriendDoc = {
        username: currentUser.username || 'Player',
        photoURL: currentUser.photoURL || '',
        tier: currentUser.tier || 'Beginner',
        rating: currentUser.rating || 1200,
        onlineStatus: currentUser.onlineStatus || 'online',
        addedAt: serverTimestamp(),
      };
      await Promise.all([
        setDoc(doc(collection(db, 'users', params.toUserId, 'friends'), fid), { friendId: fid, ...requesterFriendDoc }),
        setDoc(doc(collection(db, 'users', fid, 'friends'), params.toUserId), { friendId: params.toUserId, ...currentUserFriendDoc }),
      ]);
      return true;
    } catch (err: any) { setError(err.message || 'Failed'); return false; }
    finally { setLoading(false); }
  }, []);

  const rejectRequest = useCallback(async (requestId: string, toUserId: string) => {
    setLoading(true); setError(null);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return false; }
      await updateDoc(doc(db, 'users', toUserId, 'friendRequests', requestId), { status: 'rejected' });
      return true;
    } catch (err: any) { setError(err.message || 'Failed'); return false; }
    finally { setLoading(false); }
  }, []);

  return { acceptRequest, rejectRequest, loading, error };
}
