'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
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
  const data = await adminApiGet('/api/admin/dashboard');
  return {
    totalUsers: data.totalUsers ?? 0,
    totalProblems: data.totalProblems ?? 0,
    proUsers: 0,
    shopItems: 0,
    bannedUsers: 0,
    admins: 0,
    totalXp: 0,
    totalCoins: 0,
    activeUsers: data.activeUsers24h ?? 0,
    recentUsers: data.newestUsers ?? [],
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
  return adminApiCall('/api/admin/challenges', { action: 'setDaily', data });
}

export async function setWeeklyChallenge(data: { week: string; problemIds: string[]; xpBonus: number }) {
  return adminApiCall('/api/admin/challenges', { action: 'setWeekly', data });
}

export async function getAdminChallenges() {
  try {
    const data = await adminApiGet('/api/admin/challenges');
    return { daily: data.daily ?? null, weekly: data.weekly ?? null };
  } catch {
    return { daily: null, weekly: null };
  }
}

// ─── Shop Management (reads via Firestore, writes via API) ───

export async function fetchShopItems() {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(collection(db, 'shop'), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }));
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
  const data = await adminApiGet('/api/admin/analytics');
  const ai = data.aiUsage ?? {};
  return {
    totalAiCalls: ai.totalCalls ?? 0,
    mentorCalls: ai.mentor ?? 0,
    reviewCalls: ai.codeReview ?? 0,
    debugCalls: ai.debugger ?? 0,
    interviewerCalls: ai.interviewer ?? 0,
    usersWithAi: ai.usersWithAi ?? 0,
    totalUsers: data.growth?.totalUsers ?? 0,
    dailyLimits: { mentor: { free: 5, pro: 20, elite: 50 }, codeReview: { free: 3, pro: 15, elite: 40 }, debugger: { free: 5, pro: 25, elite: 60 }, interviewer: { free: 1, pro: 5, elite: 15 } },
  };
}

// ─── Platform Analytics ───

export async function getPlatformAnalytics() {
  const data = await adminApiGet('/api/admin/analytics');
  return {
    totalUsers: data.growth?.totalUsers ?? 0,
    totalSubmissions: data.problems?.totalSubmissions ?? 0,
    totalProblems: data.problems?.totalSubmissions ?? 0,
    solvedProblems: data.problems?.totalAccepted ?? 0,
    totalXp: 0,
    totalCoins: 0,
    dailySubmissions: data.problems?.dailySubmissions ?? [],
    byDifficulty: {},
    recentSubmissions: [],
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
