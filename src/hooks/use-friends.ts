'use client';

import { useState, useCallback, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, onSnapshot, limit, orderBy, serverTimestamp, runTransaction,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData, QuerySnapshot, Transaction } from 'firebase/firestore';
import { FriendDoc, BlockDoc } from '@/app/lib/types';

export function useFriends(userId: string | null) {
  const [friends, setFriends] = useState<FriendDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setFriends([]); setLoading(false); return; }
    setLoading(true);
    let unsub: (() => void) | null = null;
    const { firestore: db } = initializeFirebase();
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, 'users', userId, 'friends'), orderBy('addedAt', 'desc'));
    unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      setFriends(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as unknown as FriendDoc)));
      setLoading(false);
    }, () => { setError('Failed to load friends'); setLoading(false); });
    return () => { if (unsub) unsub(); };
  }, [userId]);

  return { friends, loading, error };
}

export function useBlockedUsers(userId: string | null) {
  const [blocked, setBlocked] = useState<BlockDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setBlocked([]); setLoading(false); return; }
    setLoading(true);
    let unsub: (() => void) | null = null;
    const { firestore: db } = initializeFirebase();
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, 'users', userId, 'blocked'), orderBy('blockedAt', 'desc'));
    unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      setBlocked(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as unknown as BlockDoc)));
      setLoading(false);
    }, () => { setLoading(false); });
    return () => { if (unsub) unsub(); };
  }, [userId]);

  return { blocked, loading };
}

export function useSendFriendRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { firestore: db } = initializeFirebase();

  const sendRequest = useCallback(async (params: {
    fromUserId: string; fromUsername: string; fromPhotoURL: string;
    toUserId: string; toUsername: string;
  }) => {
    setLoading(true); setError(null);
    try {
      if (!db) { throw new Error('Firebase not available'); }
      const blockedRef = doc(db, 'users', params.fromUserId, 'blocked', params.toUserId);
      const blockedSnap = await getDoc(blockedRef);
      if (blockedSnap.exists()) throw new Error('Cannot send request to this user');

      const friendsRef = doc(collection(db, 'users', params.fromUserId, 'friends'), params.toUserId);
      const friendSnap = await getDoc(friendsRef);
      if (friendSnap.exists()) throw new Error('Already friends');

      const reqQ = query(
        collection(db, 'users', params.toUserId, 'friendRequests'),
        where('fromUserId', '==', params.fromUserId),
        where('status', '==', 'pending'), limit(1)
      );
      const existing = await getDocs(reqQ);
      if (!existing.empty) throw new Error('Friend request already sent');

      await addDoc(collection(db, 'users', params.toUserId, 'friendRequests'), {
        fromUserId: params.fromUserId, fromUsername: params.fromUsername,
        fromPhotoURL: params.fromPhotoURL, toUserId: params.toUserId,
        status: 'pending', createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'users', params.toUserId, 'notifications'), {
        userId: params.toUserId, type: 'friend_request', title: 'New Friend Request',
        message: `${params.fromUsername} sent you a friend request`,
        data: { fromUserId: params.fromUserId, fromUsername: params.fromUsername, fromPhotoURL: params.fromPhotoURL },
        read: false, createdAt: serverTimestamp(),
      });
      return true;
    } catch (err: any) { setError(err.message || 'Failed'); return false; }
    finally { setLoading(false); }
  }, [db]);

  return { sendRequest, loading, error };
}

export function useAcceptFriendRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptRequest = useCallback(async (params: { requestId: string; toUserId: string; fromUser: any }) => {
    setLoading(true); setError(null);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return false; }
      const reqRef = doc(db, 'users', params.toUserId, 'friendRequests', params.requestId);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists() || reqSnap.data().status !== 'pending') {
        throw new Error('Request no longer pending');
      }
      await updateDoc(reqRef, { status: 'accepted' });
      const fu = params.fromUser;
      const fid = fu.uid || fu.id;
      const currentSnap = await getDoc(doc(db, 'users', params.toUserId));
      const current = currentSnap.data() || {};
      const requesterDoc = {
        username: fu.username || 'Unknown', photoURL: fu.photoURL || '',
        tier: fu.tier || 'Beginner', rating: fu.rating || 1200,
        onlineStatus: fu.onlineStatus || 'offline', addedAt: serverTimestamp(),
      };
      const currentDoc = {
        username: current.username || 'Player', photoURL: current.photoURL || '',
        tier: current.tier || 'Beginner', rating: current.rating || 1200,
        onlineStatus: current.onlineStatus || 'online', addedAt: serverTimestamp(),
      };
      await setDoc(doc(collection(db, 'users', params.toUserId, 'friends'), fid), { friendId: fid, ...requesterDoc });
      await setDoc(doc(collection(db, 'users', fid, 'friends'), params.toUserId), { friendId: params.toUserId, ...currentDoc });
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

export function useRemoveFriend() {
  const [loading, setLoading] = useState(false);
  const removeFriend = useCallback(async (userId: string, friendId: string) => {
    setLoading(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return false;
      await Promise.all([
        deleteDoc(doc(db, 'users', userId, 'friends', friendId)),
        deleteDoc(doc(db, 'users', friendId, 'friends', userId)),
      ]);
      return true;
    } catch { return false; }
    finally { setLoading(false); }
  }, []);
  return { removeFriend, loading };
}

export function useBlockUser() {
  const [loading, setLoading] = useState(false);
  const blockUser = useCallback(async (userId: string, targetId: string, username: string, photoURL?: string) => {
    setLoading(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return false;
      await runTransaction(db, async (tx: Transaction) => {
        tx.set(doc(collection(db, 'users', userId, 'blocked'), targetId), {
          blockedUserId: targetId, username, photoURL: photoURL || '',
          blockedAt: serverTimestamp(),
        });
        tx.delete(doc(db, 'users', userId, 'friends', targetId));
        tx.delete(doc(db, 'users', targetId, 'friends', userId));
      });
      return true;
    } catch { return false; }
    finally { setLoading(false); }
  }, []);
  return { blockUser, loading };
}

export function useUnblockUser() {
  const [loading, setLoading] = useState(false);
  const unblockUser = useCallback(async (userId: string, targetId: string) => {
    setLoading(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return false;
      await deleteDoc(doc(db, 'users', userId, 'blocked', targetId));
      return true;
    } catch { return false; }
    finally { setLoading(false); }
  }, []);
  return { unblockUser, loading };
}

export function useFriendRequestsReceived(userId: string | null) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) { setRequests([]); setLoading(false); return; }
    setLoading(true);
    let unsub: (() => void) | null = null;
    const { firestore: db } = initializeFirebase();
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, 'users', userId, 'friendRequests'), orderBy('createdAt', 'desc'));
    unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      setRequests(snap.docs.filter((d: QueryDocumentSnapshot<DocumentData>) => d.data().status === 'pending').map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => { setLoading(false); });
    return () => { if (unsub) unsub(); };
  }, [userId]);
  return { requests, loading };
}
