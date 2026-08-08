'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, limit, serverTimestamp, runTransaction, Timestamp,
  increment, onSnapshot, Unsubscribe,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import type {
  ArenaSettings, MatchmakingEntry, BattleDocument, PlayerBattleProgress,
  BattlePhase, CodingLanguage,
  MatchRecord, LeaderboardEntry, RoomInvite,
} from '@/types';

const DEFAULT_SETTINGS: ArenaSettings = {
  preferredLanguage: 'python',
  rated: true,
  difficulty: 'Medium',
  category: 'all',
  timeControl: '5+0',
  region: 'auto',
  eloRange: 200,
  editorTheme: 'vs-dark',
  editorFontSize: 14,
  editorMinimap: true,
  editorWordWrap: true,
  editorTabSize: 4,
  soundEnabled: true,
  musicEnabled: false,
  showOpponentProgress: true,
  autoAcceptRematch: false,
  confirmBeforeSubmit: true,
  privacyShowActivity: true,
  privacyShowRating: true,
  privacyShowStats: true,
  notificationsMatchFound: true,
  notificationsBattleStart: true,
  notificationsRoundEnd: true,
  notificationsFriendInvite: true,
};

export function arenaSettingsDocRef(userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  return doc(db, 'users', userId, 'arenaSettings', 'default');
}

export function matchmakingDocRef(userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  return doc(db, 'matchmaking', userId);
}

export function battleDocRef(battleId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  return doc(db, 'battles', battleId);
}

export function inviteDocRef(inviteId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  return doc(db, 'invites', inviteId);
}

export async function fetchArenaSettings(userId: string): Promise<ArenaSettings> {
  const { firestore: db } = initializeFirebase();
  if (!db) return DEFAULT_SETTINGS;
  const ref = doc(db, 'users', userId, 'arenaSettings', 'default');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...DEFAULT_SETTINGS, ...snap.data() } as ArenaSettings;
  }
  return DEFAULT_SETTINGS;
}

export async function saveArenaSettings(userId: string, settings: Partial<ArenaSettings>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const ref = doc(db, 'users', userId, 'arenaSettings', 'default');
  await setDoc(ref, settings, { merge: true });
}

export async function joinMatchmakingQueue(
  userId: string, entry: Omit<MatchmakingEntry, 'joinedAt' | 'status'>,
) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await setDoc(doc(db, 'matchmaking', userId), {
    ...entry,
    joinedAt: serverTimestamp(),
    status: 'searching',
  });
}

export async function leaveMatchmakingQueue(userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await deleteDoc(doc(db, 'matchmaking', userId));
}

export function subscribeMatchmaking(
  userId: string,
  onMatch: (entry: MatchmakingEntry | null) => void,
): Unsubscribe | null {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const ref = doc(db, 'matchmaking', userId);
  return onSnapshot(ref, (snap: DocumentSnapshot<DocumentData>) => {
    if (snap.exists()) {
      onMatch({ userId: snap.id, ...snap.data() } as MatchmakingEntry);
    } else {
      onMatch(null);
    }
  });
}

export async function findMatch(
  userId: string, settings: ArenaSettings,
): Promise<MatchmakingEntry | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const userSnap = await getDoc(doc(db, 'users', userId));
  if (!userSnap.exists()) return null;
  const userData = userSnap.data();
  const userRating = userData.rating || 800;

  const minRating = Math.max(0, userRating - settings.eloRange);
  const maxRating = userRating + settings.eloRange;
  const q = query(
    collection(db, 'matchmaking'),
    where('status', '==', 'searching'),
    where('rated', '==', settings.rated),
    where('difficulty', '==', settings.difficulty),
    where('timeControl', '==', settings.timeControl),
    where('preferredLanguage', '==', settings.preferredLanguage),
    where('rating', '>=', minRating),
    where('rating', '<=', maxRating),
    limit(1),
  );
  const snap = await getDocs(q);
  const candidates = snap.docs
    .filter((d: QueryDocumentSnapshot<DocumentData>) => d.id !== userId)
    .map((d: QueryDocumentSnapshot<DocumentData>) => ({ userId: d.id, ...d.data() } as MatchmakingEntry));

  if (candidates.length > 0) {
    return candidates[0];
  }
  return null;
}

export async function fetchBattle(battleId: string): Promise<BattleDocument | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'battles', battleId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as BattleDocument) : null;
}

export function subscribeBattle(
  battleId: string,
  onUpdate: (battle: BattleDocument) => void,
): Unsubscribe | null {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const ref = doc(db, 'battles', battleId);
  return onSnapshot(ref, (snap: DocumentSnapshot<DocumentData>) => {
    if (snap.exists()) {
      onUpdate({ id: snap.id, ...snap.data() } as BattleDocument);
    }
  });
}

export async function updateBattlePhase(battleId: string, phase: BattlePhase) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await updateDoc(doc(db, 'battles', battleId), {
    phase,
    updatedAt: serverTimestamp(),
    ...(phase === 'coding' ? { codingStartedAt: new Date().toISOString() } : {}),
  });
}

export async function updatePlayerProgress(
  battleId: string, userId: string, updates: Partial<PlayerBattleProgress>,
) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const battleSnap = await getDoc(doc(db, 'battles', battleId));
  if (!battleSnap.exists()) return;
  const battle = battleSnap.data() as BattleDocument;
  const players = battle.players.map(p =>
    p.userId === userId ? { ...p, ...updates } : p,
  );
  await updateDoc(doc(db, 'battles', battleId), { players, updatedAt: serverTimestamp() });
}

export async function submitBattleCode(
  battleId: string, userId: string, code: string, language: CodingLanguage,
  testCases: Array<{ input: string; expected: string }>,
) {
  try {
    const user = (await import('firebase/auth')).getAuth().currentUser;
    if (!user) return { passed: 0, total: 0, verdict: 'Runtime Error' as const };
    const idToken = await user.getIdToken();

    const res = await fetch('/api/battles/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ battleId, code, language }),
    });

    const data = await res.json();
    if (!res.ok) return { passed: 0, total: 0, verdict: 'Runtime Error' as const };
    return {
      passed: data.passed || 0,
      total: data.total || testCases.length,
      verdict: (data.result === 'WIN' ? 'Accepted' : data.result === 'LOSS' ? 'Wrong Answer' : 'Accepted') as 'Accepted' | 'Wrong Answer' | 'Runtime Error',
    };
  } catch {
    return { passed: 0, total: 0, verdict: 'Runtime Error' as const };
  }
}

export async function fetchMatchHistory(userId: string): Promise<MatchRecord[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(
    collection(db, 'users', userId, 'matches'),
    orderBy('timestamp', 'desc'),
    limit(20),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
    id: d.id,
    ...d.data(),
    timestamp: d.data().timestamp?.toMillis?.()?.toString() || new Date().toISOString(),
  } as unknown as MatchRecord));
}

export async function fetchLeaderboard(period: 'weekly' | 'monthly' | 'all-time' = 'all-time'): Promise<LeaderboardEntry[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(
    collection(db, 'leaderboard'),
    where('period', '==', period),
    orderBy('rating', 'desc'),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as LeaderboardEntry));
}

export async function sendRoomInvite(
  fromUserId: string, fromUsername: string, toUserId: string,
  roomId: string, roomCode: string,
) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await addDoc(collection(db, 'invites'), {
    roomId, roomCode, fromUserId, fromUsername, toUserId,
    status: 'pending', createdAt: serverTimestamp(),
  });
}

export async function respondToInvite(inviteId: string, status: 'accepted' | 'declined') {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await updateDoc(doc(db, 'invites', inviteId), { status, updatedAt: serverTimestamp() });
}

export function subscribeInvites(
  userId: string,
  onInvite: (invites: RoomInvite[]) => void,
): Unsubscribe | null {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const q = query(
    collection(db, 'invites'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending'),
  );
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    onInvite(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as RoomInvite)));
  });
}

export async function fetchActiveBattleCount(): Promise<number> {
  const { firestore: db } = initializeFirebase();
  if (!db) return 0;
  const q = query(
    collection(db, 'battles'),
    where('status', '==', 'active'),
    limit(1000),
  );
  const snap = await getDocs(q);
  return snap.size;
}

export async function fetchOnlinePlayerCount(): Promise<number> {
  const { firestore: db } = initializeFirebase();
  if (!db) return 0;
  const q = query(
    collection(db, 'users'),
    where('onlineStatus', '==', 'online'),
    limit(1000),
  );
  const snap = await getDocs(q);
  return snap.size;
}

function calculateNewRating(rating: number, opponentRating: number, score: number): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
  return Math.round(rating + K * (score - expected));
}
