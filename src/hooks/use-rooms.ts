'use client';

import { useState, useEffect, useCallback } from 'react';
import { initializeFirebase } from '@/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteField,
  query,
  where,
  onSnapshot,
  limit,
  orderBy,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { GameRoom } from '@/app/lib/types';

function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

async function generateUniqueRoomCode(db: import('firebase/firestore').Firestore) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const roomCode = generateRoomCode();
    const existing = await getDocs(
      query(collection(db, 'gameRooms'), where('roomCode', '==', roomCode), limit(1))
    );
    if (existing.empty) return roomCode;
  }
  throw new Error('Could not generate a unique room code. Please try again.');
}

export function useRooms() {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const { firestore: db } = initializeFirebase();
    if (!db) { setLoading(false); return; }

    const q = query(
      collection(db, 'gameRooms'),
      where('status', '==', 'waiting'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rooms: GameRoom[] = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as GameRoom));
        setRooms(rooms);
        setLoading(false);
      },
      (err) => {
        console.error('Rooms listener error:', err);
        setError('Failed to load rooms');
        setLoading(false);
      }
    );

    return () => { if (unsubscribe) unsubscribe(); };
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
    const q = query(
      collection(db, 'gameRooms'),
      where('roomCode', '==', roomCode.toUpperCase()),
      where('status', '==', 'waiting'),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (cancelled) return;
      const found = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as GameRoom))[0] || null;
      setRoom(found);
      setLoading(false);
    }, (err) => {
      if (cancelled) return;
      console.error('Room by code error:', err);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [roomCode]);

  return { room, loading };
}

export function useCreateRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(async (params: {
    hostId: string;
    hostName: string;
    gameMode?: 'rated' | 'practice' | 'sprint';
    maxPlayers?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return null; }
      const roomCode = await generateUniqueRoomCode(db);
      const ref = await addDoc(collection(db, 'gameRooms'), {
        roomCode,
        hostId: params.hostId,
        hostName: params.hostName,
        players: [params.hostId],
        playerNames: { [params.hostId]: params.hostName },
        status: 'waiting',
        gameMode: params.gameMode || 'rated',
        maxPlayers: params.maxPlayers || 2,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: ref.id, roomCode, ...params, players: [params.hostId], playerNames: { [params.hostId]: params.hostName }, status: 'waiting', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as GameRoom;
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createRoom, loading, error };
}

export function useJoinRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinRoom = useCallback(async (params: { roomId: string; userId: string; username: string }) => {
    setLoading(true);
    setError(null);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return null; }
      const roomRef = doc(db, 'gameRooms', params.roomId);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(roomRef);
        if (!snapshot.exists()) {
          throw new Error('Room no longer exists');
        }

        const room = snapshot.data() as GameRoom;
        if (room.status !== 'waiting') {
          throw new Error('This room has already started');
        }
        if (room.players?.length >= room.maxPlayers && !room.players.includes(params.userId)) {
          throw new Error('This room is full');
        }

        transaction.update(roomRef, {
          players: arrayUnion(params.userId),
          ['playerNames.' + params.userId]: params.username,
          status: room.players?.length + 1 >= room.maxPlayers ? 'in-progress' : 'waiting',
          startedAt: room.players?.length + 1 >= room.maxPlayers ? serverTimestamp() : room.startedAt || null,
          updatedAt: serverTimestamp(),
        });
      });
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
      return null;
    } finally {
      setLoading(false);
    }
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
      await updateDoc(roomRef, {
        players: arrayRemove(userId),
        ['playerNames.' + userId]: deleteField(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  return { leaveRoom, loading };
}

