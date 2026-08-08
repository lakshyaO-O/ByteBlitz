'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  query, where, orderBy, limit, serverTimestamp, increment, Timestamp,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { DailyMission } from '@/types';

export async function getDailyMissions(userId: string): Promise<DailyMission[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const q = query(
    collection(db, 'users', userId, 'missions'),
    where('expiresAt', '>=', todayStr),
    orderBy('expiresAt', 'asc'),
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return generateDailyMissions(userId);
  }

  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as DailyMission));
}

export async function updateMissionProgress(userId: string, missionId: string, progress: number) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;

  const ref = doc(db, 'users', userId, 'missions', missionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as DailyMission;
  const newProgress = Math.min(progress, data.requirement);
  const completed = newProgress >= data.requirement;

  await updateDoc(ref, {
    progress: newProgress,
    completed,
  });
}

export async function claimMissionReward(userId: string, missionId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return false;

  const ref = doc(db, 'users', userId, 'missions', missionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;

  const data = snap.data() as DailyMission;
  if (!data.completed || data.claimed) return false;

  await updateDoc(ref, { claimed: true });

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    xp: increment(data.xpReward),
    coins: increment(data.coinReward),
  });

  return true;
}

export async function generateDailyMissions(userId: string): Promise<DailyMission[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const expiresAt = today.toISOString();

  const missionTemplates = [
    { title: 'Code Warrior', description: 'Solve 3 practice problems', type: 'practice' as const, requirement: 3, xpReward: 50, coinReward: 25, difficulty: 'easy' as const },
    { title: 'Arena Fighter', description: 'Complete 1 arena battle', type: 'arena' as const, requirement: 1, xpReward: 75, coinReward: 30, difficulty: 'easy' as const },
    { title: 'Streak Keeper', description: 'Maintain your login streak', type: 'streak' as const, requirement: 1, xpReward: 30, coinReward: 15, difficulty: 'easy' as const },
    { title: 'Social Butterfly', description: 'Like or comment on 3 posts', type: 'social' as const, requirement: 3, xpReward: 40, coinReward: 20, difficulty: 'easy' as const },
    { title: 'Problem Solver', description: 'Solve 1 hard problem', type: 'challenge' as const, requirement: 1, xpReward: 150, coinReward: 75, difficulty: 'hard' as const },
    { title: 'Learning Session', description: 'Spend 30 minutes learning', type: 'learning' as const, requirement: 30, xpReward: 60, coinReward: 25, difficulty: 'medium' as const },
  ];

  const selected = missionTemplates.slice(0, 3);
  const missionIds: string[] = [];

  for (const template of selected) {
    const ref = await addDoc(collection(db, 'users', userId, 'missions'), {
      ...template,
      progress: 0,
      completed: false,
      claimed: false,
      expiresAt,
    });
    missionIds.push(ref.id);
  }

  return selected.map((t, i) => ({
    ...t,
    id: missionIds[i],
    progress: 0,
    completed: false,
    claimed: false,
    expiresAt,
  } as DailyMission));
}
