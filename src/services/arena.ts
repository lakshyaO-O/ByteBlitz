'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, limit, serverTimestamp, runTransaction, Timestamp,
  increment, onSnapshot, Unsubscribe,
} from 'firebase/firestore';
import type {
  ArenaSettings, MatchmakingEntry, BattleDocument, PlayerBattleProgress,
  BattlePhase, MatchType, TimeControlPreset, CodingLanguage, Difficulty,
  Tier, MatchRecord, LeaderboardEntry, RoomInvite, Problem,
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
  return onSnapshot(ref, (snap) => {
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
    .filter(d => d.id !== userId)
    .map(d => ({ userId: d.id, ...d.data() } as MatchmakingEntry));

  if (candidates.length > 0) {
    return candidates[0];
  }
  return null;
}

export async function createBattle(
  player1: { userId: string; username: string; rating: number; tier: Tier; language: CodingLanguage },
  player2: { userId: string; username: string; rating: number; tier: Tier; language: CodingLanguage },
  problem: Problem,
  matchType: MatchType,
  timeControl: TimeControlPreset,
  rated: boolean,
): Promise<string | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const totalTimeMs = parseTimeControl(timeControl);
  const battle: Omit<BattleDocument, 'id'> = {
    roomId: undefined,
    players: [
      {
        userId: player1.userId, username: player1.username, rating: player1.rating,
        tier: player1.tier,
        code: '', language: player1.language,
        passedTestCases: 0, totalTestCases: problem.examples?.length || 0,
        submissionCount: 0, result: 'pending', eloChange: 0,
      },
      {
        userId: player2.userId, username: player2.username, rating: player2.rating,
        tier: player2.tier,
        code: '', language: player2.language,
        passedTestCases: 0, totalTestCases: problem.examples?.length || 0,
        submissionCount: 0, result: 'pending', eloChange: 0,
      },
    ],
    problemId: problem.id,
    problem,
    phase: 'countdown',
    matchType,
    timeControl,
    totalTimeMs,
    rated,
    countdownStartedAt: new Date().toISOString(),
    codingStartedAt: '',
    winnerIds: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const ref = await addDoc(collection(db, 'battles'), {
    ...battle,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'matchmaking', player1.userId), { status: 'matched', matchedWith: player2.userId });
  await updateDoc(doc(db, 'matchmaking', player2.userId), { status: 'matched', matchedWith: player1.userId });

  return ref.id;
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
  return onSnapshot(ref, (snap) => {
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

async function createMatchRecord(
  battle: BattleDocument,
  players: PlayerBattleProgress[],
  winnerIds: string[],
) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const record = {
    roomId: battle.roomId || '',
    players: players.map(p => ({
      uid: p.userId,
      username: p.username,
      score: p.passedTestCases,
      timeUsed: 0,
      result: winnerIds.length === 1
        ? (winnerIds[0] === p.userId ? 'WIN' as const : 'LOSS' as const)
        : 'DRAW' as const,
      eloChange: p.eloChange,
      newRating: p.rating + p.eloChange,
    })),
    winnerIds,
    problem: { id: battle.problemId, title: battle.problem.title },
    duration: 0,
    gameMode: battle.rated ? 'rated' as const : 'practice' as const,
    timestamp: new Date().toISOString(),
  };

  for (const p of players) {
    await addDoc(collection(db, 'users', p.userId, 'matches'), {
      ...record,
      timestamp: serverTimestamp(),
    });
  }

  const leaderboardRef = collection(db, 'leaderboard');
  for (const p of players) {
    const q = query(leaderboardRef, where('userId', '==', p.userId), where('period', '==', 'all-time'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(doc(db, 'leaderboard', snap.docs[0].id), {
        rating: p.rating + p.eloChange,
        wins: increment(winnerIds.includes(p.userId) && winnerIds.length === 1 ? 1 : 0),
        lastActive: serverTimestamp(),
      });
    }
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
  return snap.docs.map(d => ({
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
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaderboardEntry));
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
  return onSnapshot(q, (snap) => {
    onInvite(snap.docs.map(d => ({ id: d.id, ...d.data() } as RoomInvite)));
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

function parseTimeControl(tc: TimeControlPreset): number {
  const match = tc.match(/^(\d+)\+(\d+)$/);
  if (!match) return 5 * 60 * 1000;
  const minutes = parseInt(match[1], 10);
  return minutes * 60 * 1000;
}

function calculateNewRating(rating: number, opponentRating: number, score: number): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
  return Math.round(rating + K * (score - expected));
}
