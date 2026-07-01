'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeFirebase } from '@/firebase';
import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, deleteField,
  query, where, onSnapshot, limit, orderBy, runTransaction, serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { GameRoom } from '@/app/lib/types';

function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

async function generateUniqueRoomCode(db: any) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const roomCode = generateRoomCode();
    const existing = await getDocs(query(collection(db, 'gameRooms'), where('roomCode', '==', roomCode), limit(1)));
    if (existing.empty) return roomCode;
  }
  throw new Error('Could not generate a unique room code. Please try again.');
}

const ACTIVE_ROOM_KEY = 'devrann_active_room';

export function saveActiveRoomId(roomId: string | null) {
  if (typeof window === 'undefined') return;
  if (roomId) localStorage.setItem(ACTIVE_ROOM_KEY, roomId);
  else localStorage.removeItem(ACTIVE_ROOM_KEY);
}

export function getSavedActiveRoomId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_ROOM_KEY);
}

export function useActiveRoom(userId: string | null) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const subscribeToRoom = useCallback((roomId: string) => {
    const { firestore: db } = initializeFirebase();
    if (!db) return;
    if (unsubRef.current) unsubRef.current();
    const roomRef = doc(db, 'gameRooms', roomId);
    unsubRef.current = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as GameRoom;
        if (data.status === 'finished' || !data.players?.includes(userId || '')) {
          setRoom(null);
          saveActiveRoomId(null);
        } else {
          setRoom(data);
        }
      } else {
        setRoom(null);
        saveActiveRoomId(null);
      }
      setLoading(false);
    }, (err) => {
      setError('Room connection lost');
      setLoading(false);
    });
  }, [userId]);

  const clearRoom = useCallback(() => {
    if (unsubRef.current) unsubRef.current();
    setRoom(null);
    saveActiveRoomId(null);
  }, []);

  useEffect(() => {
    if (!userId) { setRoom(null); setLoading(false); return; }
    const savedId = getSavedActiveRoomId();
    if (savedId) subscribeToRoom(savedId);
    else setLoading(false);
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [userId, subscribeToRoom]);

  return { room, loading, error, subscribeToRoom, clearRoom };
}

export function useRooms() {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    const { firestore: db } = initializeFirebase();
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, 'gameRooms'), where('status', '==', 'waiting'), orderBy('createdAt', 'desc'), limit(20));
    unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GameRoom)));
      setLoading(false);
    }, () => { setError('Failed to load rooms'); setLoading(false); });
    return () => { if (unsub) unsub(); };
  }, []);

  return { rooms, loading, error };
}

export function useRoomByCode(roomCode: string | null) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!roomCode) { setRoom(null); return; }
    setLoading(true);
    let cancelled = false;
    const { firestore: db } = initializeFirebase();
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, 'gameRooms'), where('roomCode', '==', roomCode.toUpperCase()), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      if (cancelled) return;
      const found = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GameRoom))[0] || null;
      setRoom(found);
      setLoading(false);
    }, () => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; unsub(); };
  }, [roomCode]);
  return { room, loading };
}

export function useCreateRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createRoom = useCallback(async (params: { hostId: string; hostName: string; gameMode?: 'rated' | 'practice' | 'sprint'; maxPlayers?: number }) => {
    setLoading(true); setError(null);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return null; }
      const roomCode = await generateUniqueRoomCode(db);
      const ref = await addDoc(collection(db, 'gameRooms'), {
        roomCode, hostId: params.hostId, hostName: params.hostName,
        players: [params.hostId], playerNames: { [params.hostId]: params.hostName },
        status: 'waiting', gameMode: params.gameMode || 'rated', maxPlayers: params.maxPlayers || 2,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      saveActiveRoomId(ref.id);
      return { id: ref.id, roomCode, ...params, players: [params.hostId], playerNames: { [params.hostId]: params.hostName }, status: 'waiting', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as GameRoom;
    } catch (err: any) { setError(err.message || 'Failed to create room'); return null; }
    finally { setLoading(false); }
  }, []);
  return { createRoom, loading, error };
}

export function useJoinRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const joinRoom = useCallback(async (params: { roomId: string; userId: string; username: string }) => {
    setLoading(true); setError(null);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return null; }
      const roomRef = doc(db, 'gameRooms', params.roomId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(roomRef);
        if (!snap.exists()) throw new Error('Room no longer exists');
        const room = snap.data() as GameRoom;
        if (room.status !== 'waiting') throw new Error('Room already started');
        if (room.players?.includes(params.userId)) {
          saveActiveRoomId(params.roomId);
          return;
        }
        if (room.blockedUserIds?.includes(params.userId)) throw new Error('You have been blocked from this room');
        if (room.players?.length >= room.maxPlayers) throw new Error('Room is full');
        const nowFull = (room.players?.length || 0) + 1 >= room.maxPlayers;
        tx.update(roomRef, {
          players: arrayUnion(params.userId),
          [`playerNames.${params.userId}`]: params.username,
          status: nowFull && room.gameMode !== 'practice' ? 'in-progress' : 'waiting',
          startedAt: nowFull && room.gameMode !== 'practice' ? serverTimestamp() : room.startedAt || null,
          updatedAt: serverTimestamp(),
        });
      });
      saveActiveRoomId(params.roomId);
      return { success: true };
    } catch (err: any) { setError(err.message || 'Failed to join'); return null; }
    finally { setLoading(false); }
  }, []);
  return { joinRoom, loading, error };
}

export function useLeaveRoom() {
  const [loading, setLoading] = useState(false);
  const leaveRoom = useCallback(async (roomId: string, userId: string) => {
    setLoading(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      const roomRef = doc(db, 'gameRooms', roomId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(roomRef);
        if (!snap.exists()) return;
        const room = snap.data() as GameRoom;
        const isHost = room.hostId === userId;
        const remaining = (room.players || []).filter((p: string) => p !== userId);
        if (isHost && remaining.length > 0) {
          tx.update(roomRef, {
            players: remaining,
            hostId: remaining[0],
            hostName: room.playerNames?.[remaining[0]] || 'Player',
            [`playerNames.${userId}`]: deleteField(),
            updatedAt: serverTimestamp(),
          });
        } else if (remaining.length === 0) {
          tx.update(roomRef, { status: 'finished', updatedAt: serverTimestamp() });
        } else {
          tx.update(roomRef, {
            players: remaining,
            [`playerNames.${userId}`]: deleteField(),
            updatedAt: serverTimestamp(),
          });
        }
      });
      saveActiveRoomId(null);
    } catch { /* best-effort */ }
    finally { setLoading(false); }
  }, []);
  return { leaveRoom, loading };
}

export function useKickPlayer() {
  const kickPlayer = useCallback(async (roomId: string, targetId: string) => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return false;
      await updateDoc(doc(db, 'gameRooms', roomId), {
        players: arrayRemove(targetId),
        [`playerNames.${targetId}`]: deleteField(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch { return false; }
  }, []);
  return { kickPlayer };
}

export function useTransferHost() {
  const transferHost = useCallback(async (roomId: string, newHostId: string) => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return false;
      const roomRef = doc(db, 'gameRooms', roomId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(roomRef);
        if (!snap.exists()) return;
        const room = snap.data() as GameRoom;
        tx.update(roomRef, { hostId: newHostId, hostName: room.playerNames?.[newHostId] || 'Player', updatedAt: serverTimestamp() });
      });
      return true;
    } catch { return false; }
  }, []);
  return { transferHost };
}

export function useBlockPlayerFromRoom() {
  const blockPlayer = useCallback(async (roomId: string, targetId: string) => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return false;
      await updateDoc(doc(db, 'gameRooms', roomId), {
        blockedUserIds: arrayUnion(targetId),
        players: arrayRemove(targetId),
        [`playerNames.${targetId}`]: deleteField(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch { return false; }
  }, []);
  return { blockPlayer };
}

export function useSendRoomInvite() {
  const sendInvite = useCallback(async (params: { roomId: string; roomCode: string; fromUserId: string; fromUsername: string; toUserId: string }) => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return false;
      await addDoc(collection(db, 'users', params.toUserId, 'notifications'), {
        userId: params.toUserId, type: 'room_invite', title: 'Room Invite',
        message: `${params.fromUsername} invited you to join their room`,
        data: { roomId: params.roomId, roomCode: params.roomCode, fromUserId: params.fromUserId, fromUsername: params.fromUsername },
        read: false, createdAt: serverTimestamp(),
      });
      return true;
    } catch { return false; }
  }, []);
  return { sendInvite };
}

export function useStartMatch() {
  const [loading, setLoading] = useState(false);
  const startMatch = useCallback(async (roomId: string) => {
    setLoading(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return false;
      await updateDoc(doc(db, 'gameRooms', roomId), { status: 'in-progress', startedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      return true;
    } catch { return false; }
    finally { setLoading(false); }
  }, []);
  return { startMatch, loading };
}

const PRESENCE_INTERVAL = 30000;

export function usePresence(userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    const { firestore: db } = initializeFirebase();
    if (!db) return;
    const userRef = doc(db, 'users', userId);
    const setOnline = () => {
      updateDoc(userRef, { onlineStatus: 'online', lastActive: serverTimestamp() }).catch(() => {});
    };
    setOnline();
    const interval = setInterval(setOnline, PRESENCE_INTERVAL);
    const onUnload = () => {
      updateDoc(userRef, { onlineStatus: 'offline', lastActive: serverTimestamp() }).catch(() => {});
    };
    window.addEventListener('beforeunload', onUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') setOnline();
      else updateDoc(userRef, { onlineStatus: 'offline', lastActive: serverTimestamp() }).catch(() => {});
    });
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', onUnload);
      updateDoc(userRef, { onlineStatus: 'offline', lastActive: serverTimestamp() }).catch(() => {});
    };
  }, [userId]);
}
