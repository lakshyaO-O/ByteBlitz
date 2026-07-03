'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, limit, serverTimestamp, runTransaction, increment,
} from 'firebase/firestore';
import type { UserProfile, PracticeProblemDocument, SubmissionStatus } from '@/types';

// ─── Auth Guard ───

export async function checkAdmin(uid: string): Promise<{ isAdmin: boolean; role: string }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { isAdmin: false, role: '' };
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return { isAdmin: false, role: '' };
  const data = snap.data();
  const role = data.role || (data.isAdmin ? 'admin' : 'user');
  return { isAdmin: role === 'super_admin', role };
}

// ─── Dashboard Stats ───

export async function getAdminDashboardStats() {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const [usersSnap, problemsSnap, subsSnap, shopsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'problems')),
    getDocs(query(collection(db, 'users'), where('subscriptionTier', '==', 'pro'))),
    getDocs(collection(db, 'shop')),
  ]);

  const totalUsers = usersSnap.size;
  const totalProblems = problemsSnap.size;
  const proUsers = subsSnap.size;
  const shopItems = shopsSnap.size;
  const bannedUsers = usersSnap.docs.filter(d => d.data().banned === true).length;
  const admins = usersSnap.docs.filter(d => d.data().isAdmin === true || d.data().role === 'super_admin').length;

  const totalXp = usersSnap.docs.reduce((sum, d) => sum + (d.data().xp || 0), 0);
  const totalCoins = usersSnap.docs.reduce((sum, d) => sum + (d.data().devcoins || 0), 0);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const activeUsers = usersSnap.docs.filter(d => {
    const la = d.data().lastActive?.toDate?.() || new Date(d.data().lastActive || 0);
    return la >= weekAgo;
  }).length;

  const recentUsers = usersSnap.docs
    .filter(d => d.data().createdAt)
    .sort((a, b) => {
      const ta = a.data().createdAt?.toDate?.()?.getTime() || new Date(a.data().createdAt || 0).getTime();
      const tb = b.data().createdAt?.toDate?.()?.getTime() || new Date(b.data().createdAt || 0).getTime();
      return tb - ta;
    })
    .slice(0, 10)
    .map(d => ({ id: d.id, ...d.data() })) as UserProfile[];

  return {
    totalUsers,
    totalProblems,
    proUsers,
    shopItems,
    bannedUsers,
    admins,
    totalXp,
    totalCoins,
    activeUsers,
    recentUsers,
  };
}

// ─── User Management ───

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(500));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
}

export async function updateUserRole(uid: string, role: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), {
    role,
    isAdmin: role === 'super_admin' || role === 'admin',
    updatedAt: serverTimestamp(),
  });
}

export async function toggleBanUser(uid: string, banned: boolean) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), {
    banned,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const { id, ...clean } = data as any;
  await updateDoc(doc(db, 'users', uid), { ...clean, updatedAt: serverTimestamp() });
}

export async function deleteUserDoc(uid: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await deleteDoc(doc(db, 'users', uid));
}

// ─── Problem Management ───

export async function fetchAdminProblems() {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(collection(db, 'problems'), orderBy('title', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createProblem(data: any) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const ref = await addDoc(collection(db, 'problems'), {
    ...data,
    isPublished: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProblem(id: string, data: any) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await updateDoc(doc(db, 'problems', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProblem(id: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await deleteDoc(doc(db, 'problems', id));
  try { await deleteDoc(doc(db, 'problemContent', id)); } catch { /* ignore */ }
}

export async function saveProblemContent(id: string, content: any) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await setDoc(doc(db, 'problemContent', id), content, { merge: true });
}

// ─── Challenge Management ───

export async function setDailyChallenge(data: { date: string; problemId: string; xpBonus: number }) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const snap = await getDoc(doc(db, 'challenges', 'daily'));
  const challenges = snap.exists() ? snap.data().challenges || [] : [];
  const idx = challenges.findIndex((c: any) => c.date === data.date);
  if (idx >= 0) challenges[idx] = data;
  else challenges.push(data);
  await setDoc(doc(db, 'challenges', 'daily'), { challenges }, { merge: true });
}

export async function setWeeklyChallenge(data: { week: string; problemIds: string[]; xpBonus: number }) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await setDoc(doc(db, 'challenges', 'weekly'), data, { merge: true });
}

export async function getAdminChallenges() {
  const { firestore: db } = initializeFirebase();
  if (!db) return { daily: null, weekly: null };
  const [dailySnap, weeklySnap] = await Promise.all([
    getDoc(doc(db, 'challenges', 'daily')),
    getDoc(doc(db, 'challenges', 'weekly')),
  ]);
  return {
    daily: dailySnap.exists() ? dailySnap.data() : null,
    weekly: weeklySnap.exists() ? weeklySnap.data() : null,
  };
}

// ─── Shop Management ───

export async function fetchShopItems() {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(collection(db, 'shop'), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createShopItem(data: any) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const ref = await addDoc(collection(db, 'shop'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateShopItem(id: string, data: any) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await updateDoc(doc(db, 'shop', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteShopItem(id: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await deleteDoc(doc(db, 'shop', id));
}

// ─── AI Usage Monitoring ───

export async function getAIUsageStats() {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const usersSnap = await getDocs(query(collection(db, 'users'), limit(200)));
  let totalAiCalls = 0;
  let mentorCalls = 0;
  let reviewCalls = 0;
  let debugCalls = 0;
  let interviewerCalls = 0;
  let usersWithAi = 0;
  for (const d of usersSnap.docs) {
    const ai = d.data().aiUsage;
    if (ai) {
      usersWithAi++;
      mentorCalls += ai.mentor?.total || 0;
      reviewCalls += ai.codeReview?.total || 0;
      debugCalls += ai.debugger?.total || 0;
      interviewerCalls += ai.interviewer?.total || 0;
    }
  }
  totalAiCalls = mentorCalls + reviewCalls + debugCalls + interviewerCalls;
  const dailyLimits = { mentor: { free: 5, pro: 20, elite: 50 }, codeReview: { free: 3, pro: 15, elite: 40 }, debugger: { free: 5, pro: 25, elite: 60 }, interviewer: { free: 1, pro: 5, elite: 15 } };
  return { totalAiCalls, mentorCalls, reviewCalls, debugCalls, interviewerCalls, usersWithAi, totalUsers: usersSnap.size, dailyLimits };
}

// ─── Platform Analytics ───

export async function getPlatformAnalytics() {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const [usersSnap, subsSnap, problemsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'submissions')),
    getDocs(collection(db, 'problems')),
  ]);

  const totalUsers = usersSnap.size;
  const totalSubmissions = subsSnap.size;
  const totalProblems = problemsSnap.size;
  const solvedProblems = new Set(subsSnap.docs.filter(d => d.data().verdict === 'Accepted').map(d => d.data().problemId)).size;
  const totalXp = usersSnap.docs.reduce((sum, d) => sum + (d.data().xp || 0), 0);
  const totalCoins = usersSnap.docs.reduce((sum, d) => sum + (d.data().devcoins || 0), 0);

  // Submissions over time (last 14 days)
  const dailySubs: Record<string, number> = {};
  const dailyAccepted: Record<string, number> = {};
  const now = Date.now();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
    dailySubs[d] = 0;
    dailyAccepted[d] = 0;
  }
  for (const d of subsSnap.docs) {
    const ts = d.data().submittedAt?.toDate?.()?.toISOString()?.slice(0, 10);
    if (ts && dailySubs[ts] !== undefined) {
      dailySubs[ts]++;
      if (d.data().verdict === 'Accepted') dailyAccepted[ts]++;
    }
  }

  // Difficulty distribution
  const byDifficulty: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
  problemsSnap.docs.forEach(d => {
    const diff = d.data().difficulty || 'Easy';
    if (byDifficulty[diff] !== undefined) byDifficulty[diff]++;
  });

  return {
    totalUsers,
    totalSubmissions,
    totalProblems,
    solvedProblems,
    totalXp,
    totalCoins,
    dailySubmissions: Object.entries(dailySubs).map(([date, count]) => ({ date, count, accepted: dailyAccepted[date] || 0 })),
    byDifficulty,
    recentSubmissions: subsSnap.docs.slice(0, 100),
  };
}

// ─── Settings ───

export async function getFeatureFlags() {
  const { firestore: db } = initializeFirebase();
  if (!db) return {};
  const snap = await getDoc(doc(db, 'config', 'featureFlags'));
  return snap.exists() ? snap.data() : {};
}

export async function updateFeatureFlags(flags: Record<string, boolean>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await setDoc(doc(db, 'config', 'featureFlags'), flags, { merge: true });
}

export async function getPlatformSettings() {
  const { firestore: db } = initializeFirebase();
  if (!db) return {};
  const snap = await getDoc(doc(db, 'config', 'settings'));
  return snap.exists() ? snap.data() : {};
}

export async function updatePlatformSettings(settings: any) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await setDoc(doc(db, 'config', 'settings'), settings, { merge: true });
}
