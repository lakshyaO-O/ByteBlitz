'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { UserProfile } from '@/types';
import type { AdminRole, AuditLog } from '@/types/admin';

// ─── Helpers ───

async function getAuthToken(): Promise<string | null> {
  const auth = getAuth();
  if (!auth?.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

async function adminApiCall(endpoint: string, body: Record<string, unknown>) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Admin API error');
  return data;
}

async function adminApiGet(endpoint: string) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Admin API error');
  return data;
}

// ─── Auth Guard ───

export async function checkAdmin(uid: string): Promise<{ isAdmin: boolean; role: AdminRole }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { isAdmin: false, role: 'user' };
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return { isAdmin: false, role: 'user' };
  const data = snap.data();
  const role: AdminRole = data.role || (data.isAdmin ? 'admin' : 'user');
  return { isAdmin: role === 'super_admin' || role === 'admin', role };
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
  const admins = usersSnap.docs.filter(d => d.data().isAdmin === true || d.data().role === 'super_admin' || d.data().role === 'admin').length;

  const totalXp = usersSnap.docs.reduce((sum, d) => sum + (d.data().xp || 0), 0);
  const totalCoins = usersSnap.docs.reduce((sum, d) => sum + (d.data().devcoins || 0), 0);

  const now = new Date();
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

// ─── User Management (reads via Firestore, writes via API) ───

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const data = await adminApiGet('/api/admin/users?limit=500');
  return data.users || [];
}

export async function bulkUserAction(uids: string[], bulkAction: 'ban' | 'unban' | 'updateRole', role?: AdminRole) {
  return adminApiCall('/api/admin/users', { action: 'bulk', data: { uids, bulkAction, role } });
}

export async function updateUserRole(uid: string, role: AdminRole) {
  return adminApiCall('/api/admin/users', { action: 'updateRole', targetUid: uid, data: { role } });
}

export async function toggleBanUser(uid: string, banned: boolean) {
  return adminApiCall('/api/admin/users', { action: banned ? 'ban' : 'unban', targetUid: uid, data: {} });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const { id, ...clean } = data as any;
  return adminApiCall('/api/admin/users', { action: 'updateProfile', targetUid: uid, data: clean });
}

export async function deleteUserDoc(uid: string) {
  return adminApiCall('/api/admin/users', { action: 'delete', targetUid: uid, data: {} });
}

// ─── Problem Management (reads via Firestore, writes via API) ───

export async function fetchAdminProblems() {
  const token = await getAuthToken();
  if (!token) return [];
  try {
    const res = await fetch('/api/admin/problems', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.problems || [];
    }
  } catch {}
  return [];
}

export async function fetchProblemWithContent(id: string) {
  const token = await getAuthToken();
  if (!token) return null;
  const res = await fetch(`/api/admin/problems?id=${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function createProblem(data: any) {
  return adminApiCall('/api/admin/problems', { action: 'create', data });
}

export async function saveProblemContent(id: string, data: any) {
  return adminApiCall('/api/admin/problems', { action: 'saveContent', problemId: id, data });
}

export async function deleteProblem(id: string) {
  return adminApiCall('/api/admin/problems', { action: 'delete', problemId: id, data: {} });
}

export async function toggleProblemPublish(id: string) {
  return adminApiCall('/api/admin/problems', { action: 'togglePublish', problemId: id, data: {} });
}

export async function archiveProblem(id: string) {
  return adminApiCall('/api/admin/problems', { action: 'archive', problemId: id, data: {} });
}

export async function restoreProblem(id: string) {
  return adminApiCall('/api/admin/problems', { action: 'restore', problemId: id, data: {} });
}

export async function getProblemVersions(id: string) {
  return adminApiCall('/api/admin/problems', { action: 'getVersions', problemId: id, data: {} });
}

export async function restoreProblemVersion(id: string, versionId: string) {
  return adminApiCall('/api/admin/problems', { action: 'restoreVersion', problemId: id, data: { versionId } });
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

// ─── Shop Management (reads via Firestore, writes via API) ───

export async function fetchShopItems() {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(collection(db, 'shop'), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createShopItem(data: any) {
  return adminApiCall('/api/admin/shop', { action: 'create', data });
}

export async function updateShopItem(id: string, data: any) {
  return adminApiCall('/api/admin/shop', { action: 'update', itemId: id, data });
}

export async function deleteShopItem(id: string) {
  return adminApiCall('/api/admin/shop', { action: 'delete', itemId: id, data: {} });
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

// ─── Settings (reads via Firestore, writes via API) ───

export async function getFeatureFlags() {
  const { firestore: db } = initializeFirebase();
  if (!db) return {};
  const snap = await getDoc(doc(db, 'config', 'featureFlags'));
  return snap.exists() ? snap.data() : {};
}

export async function updateFeatureFlags(flags: Record<string, boolean>) {
  return adminApiCall('/api/admin/settings', { section: 'featureFlags', data: flags });
}

export async function getPlatformSettings() {
  const { firestore: db } = initializeFirebase();
  if (!db) return {};
  const snap = await getDoc(doc(db, 'config', 'settings'));
  return snap.exists() ? snap.data() : {};
}

export async function updatePlatformSettings(settings: any) {
  return adminApiCall('/api/admin/settings', { section: 'settings', data: settings });
}

// ─── Audit Logs ───

export async function fetchAuditLogs(params?: {
  limit?: number;
  action?: string;
  targetType?: string;
  performedBy?: string;
  severity?: string;
}): Promise<{ logs: AuditLog[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.action) searchParams.set('action', params.action);
  if (params?.targetType) searchParams.set('targetType', params.targetType);
  if (params?.performedBy) searchParams.set('performedBy', params.performedBy);
  if (params?.severity) searchParams.set('severity', params.severity);

  const query = searchParams.toString();
  return adminApiGet(`/api/admin/audit-logs${query ? `?${query}` : ''}`);
}
