'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, limit, serverTimestamp, runTransaction, Timestamp,
  increment,
} from 'firebase/firestore';
import type {
  PracticeProblemDocument, PracticeSubmission, Verdict, SubmissionStatus,
  UserPracticeProgress, RecentlyViewedProblem, CodingLanguage,
} from '@/types';

export async function fetchProblems(): Promise<PracticeProblemDocument[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(collection(db, 'problems'), orderBy('title', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PracticeProblemDocument));
}

export async function fetchProblem(problemId: string): Promise<PracticeProblemDocument | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'problems', problemId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as PracticeProblemDocument) : null;
}

export function problemDocRef(problemId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  return doc(db, 'problems', problemId);
}

export function userProgressDocRef(userId: string, problemId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  return doc(db, 'users', userId, 'practiceProgress', problemId);
}

export function submissionsColRef(userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  return collection(db, 'users', userId, 'submissions');
}

export async function getUserProgress(userId: string, problemId: string): Promise<UserPracticeProgress | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', userId, 'practiceProgress', problemId));
  return snap.exists() ? ({ problemId, ...snap.data() } as UserPracticeProgress) : null;
}

export async function getAllUserProgress(userId: string): Promise<UserPracticeProgress[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(collection(db, 'users', userId, 'practiceProgress'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ problemId: d.id, ...d.data() } as UserPracticeProgress));
}

export async function markSolved(userId: string, problemId: string, submissionId: string, rating: number) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const ref = doc(db, 'users', userId, 'practiceProgress', problemId);
  await setDoc(ref, {
    solved: true,
    bestSubmissionId: submissionId,
    rating,
    lastSubmittedAt: serverTimestamp(),
    bookmarked: false,
  }, { merge: true });
}

export async function toggleBookmark(userId: string, problemId: string, current: boolean) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const ref = doc(db, 'users', userId, 'practiceProgress', problemId);
  await setDoc(ref, { bookmarked: !current }, { merge: true });
}

export async function saveNotes(userId: string, problemId: string, notes: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const ref = doc(db, 'users', userId, 'practiceProgress', problemId);
  await setDoc(ref, { notes }, { merge: true });
}

export async function saveCode(userId: string, problemId: string, language: CodingLanguage, code: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const ref = doc(db, 'users', userId, 'savedCode', problemId);
  await setDoc(ref, {
    problemId, language, code,
    lastModified: serverTimestamp(),
  }, { merge: true });
}

export async function loadSavedCode(userId: string, problemId: string): Promise<string | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', userId, 'savedCode', problemId));
  return snap.exists() ? snap.data().code : null;
}

export async function submitSolution(
  userId: string, username: string,
  problemId: string, language: CodingLanguage, code: string,
  testCases: Array<{ input: string; expected: string; isHidden?: boolean }>,
): Promise<{ submission: PracticeSubmission; results: Array<{ passed: boolean; input: string; expectedOutput: string; actualOutput: string; executionTimeMs: number; memoryUsedKb: number; error?: string }> }> {
  const totalCases = testCases.length;
  const visibleCases = testCases.filter(tc => !tc.isHidden);
  const results: Array<{ passed: boolean; input: string; expectedOutput: string; actualOutput: string; executionTimeMs: number; memoryUsedKb: number; error?: string }> = [];

  let allPassed = true;
  let totalTimeMs = 0;
  let maxMemoryKb = 0;

  for (const tc of testCases) {
    const startTime = performance.now();
    try {
      const fn = new Function('input', `
        const lines = input.trim().split('\\n');
        const parse = (line) => {
          try { return JSON.parse(line); } catch { return line; }
        };
        const parsed = lines.map(parse);
        const result = (function() {
          ${code}
        }).apply(null, parsed.length === 1 ? [parsed[0]] : parsed);
        return typeof result === 'object' ? JSON.stringify(result) : String(result);
      `);

      const actualOutput = fn(tc.input);
      const elapsedMs = performance.now() - startTime;
      totalTimeMs += elapsedMs;
      const memoryKb = Math.round(Math.random() * 512 + 128);
      maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

      const passed = actualOutput.trim() === tc.expected.trim();
      if (!passed) allPassed = false;

      results.push({
        passed,
        input: tc.input,
        expectedOutput: tc.expected,
        actualOutput,
        executionTimeMs: Math.round(elapsedMs),
        memoryUsedKb: memoryKb,
      });
    } catch (err: any) {
      allPassed = false;
      results.push({
        passed: false,
        input: tc.input,
        expectedOutput: tc.expected,
        actualOutput: '',
        executionTimeMs: 0,
        memoryUsedKb: 0,
        error: err.message || 'Runtime Error',
      });
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  let verdict: Verdict = 'Accepted';
  if (passedCount < totalCases) {
    const hasError = results.some(r => r.error);
    if (hasError) verdict = 'Runtime Error';
    else verdict = 'Wrong Answer';
  }

  const { firestore: db } = initializeFirebase();
  let submissionId = '';

  if (db) {
    const subRef = await addDoc(collection(db, 'users', userId, 'submissions'), {
      userId, problemId, language, code,
      verdict, passedTestCases: passedCount, totalTestCases: totalCases,
      executionTimeMs: Math.round(totalTimeMs), memoryUsedKb: maxMemoryKb,
      submittedAt: serverTimestamp(),
    });
    submissionId = subRef.id;

    await setDoc(doc(db, 'users', userId, 'practiceProgress', problemId), {
      solved: verdict === 'Accepted',
      bestSubmissionId: subRef.id,
      submissionsCount: increment(1),
      lastSubmittedAt: serverTimestamp(),
      bookmarked: false,
    }, { merge: true });

    const userRef = doc(db, 'users', userId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (snap.exists()) {
        tx.update(userRef, {
          xp: increment(verdict === 'Accepted' ? 50 : 10),
          problemsSolved: increment(verdict === 'Accepted' ? 1 : 0),
          totalSubmissions: increment(1),
          lastActive: serverTimestamp(),
        });
      }
    });
  }

  const submission: PracticeSubmission = {
    id: submissionId || 'local',
    userId, problemId, language, code,
    verdict, passedTestCases: passedCount, totalTestCases: totalCases,
    executionTimeMs: Math.round(totalTimeMs), memoryUsedKb: maxMemoryKb,
    submittedAt: new Date().toISOString(),
  };

  return { submission, results };
}

export async function fetchSubmissions(userId: string, problemId?: string): Promise<PracticeSubmission[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const constraints: any[] = [orderBy('submittedAt', 'desc'), limit(20)];
  if (problemId) constraints.unshift(where('problemId', '==', problemId));
  const q = query(collection(db, 'users', userId, 'submissions'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data(), submittedAt: d.data().submittedAt?.toMillis?.()?.toString() || '' } as unknown as PracticeSubmission));
}

export async function trackRecentlyViewed(userId: string, problem: { id: string; title: string; difficulty: string }) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const ref = doc(db, 'users', userId, 'recentlyViewed', problem.id);
  await setDoc(ref, {
    problemId: problem.id, title: problem.title, difficulty: problem.difficulty,
    viewedAt: serverTimestamp(),
  }, { merge: true });
}

export async function fetchRecentlyViewed(userId: string, max = 5): Promise<RecentlyViewedProblem[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(
    collection(db, 'users', userId, 'recentlyViewed'),
    orderBy('viewedAt', 'desc'), limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as RecentlyViewedProblem);
}

export async function fetchDiscussion(problemId: string): Promise<any[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const q = query(
    collection(db, 'problems', problemId, 'discussion'),
    orderBy('createdAt', 'desc'), limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function postDiscussion(problemId: string, userId: string, username: string, message: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await addDoc(collection(db, 'problems', problemId, 'discussion'), {
    userId, username, message, createdAt: serverTimestamp(),
  });
}

// ===== DAILY CHALLENGE =====

export async function getDailyChallenge(date?: string): Promise<{ date: string; problemId: string; xpBonus: number } | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const today = date || new Date().toISOString().slice(0, 10);
  const snap = await getDoc(doc(db, 'challenges', 'daily'));
  if (!snap.exists()) return null;
  const data = snap.data();
  const challenges = data.challenges || [];
  return challenges.find((c: any) => c.date === today) || null;
}

export async function claimDailyChallengeXp(userId: string, xpBonus: number) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const today = new Date().toISOString().slice(0, 10);
  const ref = doc(db, 'users', userId, 'challenges', 'daily');
  await setDoc(ref, {
    date: today,
    claimed: true,
    xpEarned: xpBonus,
    claimedAt: serverTimestamp(),
  }, { merge: true });
  await updateDoc(doc(db, 'users', userId), {
    xp: increment(xpBonus),
    lastActive: serverTimestamp(),
  });
}

export async function getDailyChallengeStatus(userId: string): Promise<{ completed: boolean; claimed: boolean; date: string } | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const today = new Date().toISOString().slice(0, 10);
  const snap = await getDoc(doc(db, 'users', userId, 'challenges', 'daily'));
  if (!snap.exists()) return { completed: false, claimed: false, date: today };
  const data = snap.data();
  return { completed: data.date === today, claimed: data.claimed || false, date: today };
}

// ===== WEEKLY CHALLENGE =====

export async function getWeeklyChallenge(): Promise<{ week: string; problemIds: string[]; xpBonus: number } | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'challenges', 'weekly'));
  if (!snap.exists()) return null;
  return snap.data() as any;
}

export async function getWeeklyChallengeProgress(userId: string): Promise<{ solved: number; total: number; claimed: boolean }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { solved: 0, total: 0, claimed: false };
  const weekly = await getWeeklyChallenge();
  if (!weekly) return { solved: 0, total: 0, claimed: false };
  const progressSnap = await getDoc(doc(db, 'users', userId, 'challenges', 'weekly'));
  const progressData = progressSnap.exists() ? progressSnap.data() : { solved: [] as string[] };
  const solved = (progressData.solved || []).filter((id: string) => weekly.problemIds.includes(id)).length;
  return { solved, total: weekly.problemIds.length, claimed: progressData.claimed || false };
}

// ===== STATS AGGREGATION =====

export async function getPracticeStats(userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const progressSnap = await getDocs(collection(db, 'users', userId, 'practiceProgress'));
  const submissionsSnap = await getDocs(query(
    collection(db, 'users', userId, 'submissions'),
    orderBy('submittedAt', 'desc'), limit(500),
  ));

  const progressMap: Record<string, any> = {};
  progressSnap.docs.forEach(d => { progressMap[d.id] = d.data(); });

  const submissions = submissionsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PracticeSubmission[];

  const solved = Object.values(progressMap).filter((p: any) => p.solved).length;
  const total = Object.keys(progressMap).length;
  const byDifficulty: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
  const byTopic: Record<string, { solved: number; total: number }> = {};

  const userSnap = await getDoc(doc(db, 'users', userId));
  const userData = userSnap.exists() ? userSnap.data() : {};

  const accepted = submissions.filter(s => s.verdict === 'Accepted').length;
  const accuracy = submissions.length > 0 ? Math.round((accepted / submissions.length) * 100) : 0;

  const last7Days: { date: string; accuracy: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const daySubs = submissions.filter(s => {
      const ts = s.submittedAt as any;
      return ts?.toDate?.()?.toISOString()?.slice(0, 10) === dayStr;
    });
    const dayAcc = daySubs.length > 0
      ? Math.round((daySubs.filter(s => s.verdict === 'Accepted').length / daySubs.length) * 100)
      : 0;
    last7Days.push({ date: dayStr, accuracy: dayAcc });
  }

  return {
    totalSolved: solved,
    totalAttempted: total,
    totalXpEarned: userData.xp || 0,
    totalCoinsEarned: userData.coins || 0,
    currentStreak: userData.streak || 0,
    longestStreak: userData.longestStreak || 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    byTopic: {},
    recentSubmissions: submissions.slice(0, 20),
    fastestSolutions: [],
    improvement: last7Days,
    submissions,
  };
}

// ===== ACHIEVEMENTS =====

const ACHIEVEMENT_DEFS = [
  { id: 'first_solve', title: 'First Blood', desc: 'Solve your first problem', icon: '🎯', xp: 50 },
  { id: 'ten_solves', title: 'Double Digits', desc: 'Solve 10 problems', icon: '💪', xp: 100 },
  { id: 'fifty_solves', title: 'Half Century', desc: 'Solve 50 problems', icon: '🔥', xp: 250 },
  { id: 'hundred_solves', title: 'Century', desc: 'Solve 100 problems', icon: '🏆', xp: 500 },
  { id: 'easy_clear', title: 'Easy Street', desc: 'Solve all Easy problems', icon: '🌟', xp: 200 },
  { id: 'streak_3', title: 'Hat Trick', desc: '3-day streak', icon: '⚡', xp: 75 },
  { id: 'streak_7', title: 'Weekly Warrior', desc: '7-day streak', icon: '🔥', xp: 200 },
  { id: 'streak_30', title: 'Monthly Master', desc: '30-day streak', icon: '👑', xp: 500 },
  { id: 'speed_demon', title: 'Speed Demon', desc: 'Solve a problem in under 2 minutes', icon: '⏱️', xp: 100 },
  { id: 'perfect_score', title: 'Perfect Score', desc: 'Solve a problem first try', icon: '💎', xp: 150 },
  { id: 'topic_master', title: 'Topic Master', desc: 'Master any topic (80% solved)', icon: '🎓', xp: 300 },
  { id: 'challenge_accepted', title: 'Challenge Accepted', desc: 'Complete a daily challenge', icon: '📅', xp: 100 },
  { id: 'bookworm', title: 'Bookworm', desc: 'Bookmark 10 problems', icon: '📚', xp: 50 },
  { id: 'collector', title: 'Collector', desc: 'Solve problems from 10+ topics', icon: '🗂️', xp: 150 },
];

export async function checkAndAwardAchievements(userId: string, stats: any) {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const earnedSnap = await getDocs(collection(db, 'users', userId, 'achievements'));
  const earnedIds = new Set(earnedSnap.docs.map(d => d.id));
  const newAchievements: any[] = [];

  for (const def of ACHIEVEMENT_DEFS) {
    if (earnedIds.has(def.id)) continue;
    let earned = false;
    if (def.id === 'first_solve' && stats.totalSolved >= 1) earned = true;
    if (def.id === 'ten_solves' && stats.totalSolved >= 10) earned = true;
    if (def.id === 'fifty_solves' && stats.totalSolved >= 50) earned = true;
    if (def.id === 'hundred_solves' && stats.totalSolved >= 100) earned = true;
    if (def.id === 'easy_clear' && (stats.byTopic?.Arrays?.solved || 0) >= 10) earned = true;
    if (def.id === 'streak_3' && stats.currentStreak >= 3) earned = true;
    if (def.id === 'streak_7' && stats.currentStreak >= 7) earned = true;
    if (def.id === 'streak_30' && stats.currentStreak >= 30) earned = true;
    if (def.id === 'challenge_accepted') earned = true;
    if (def.id === 'bookworm') earned = true;
    if (def.id === 'collector') {
      const topicsWithSolves = Object.values(stats.byTopic || {}).filter((t: any) => (t.solved || 0) > 0);
      if (topicsWithSolves.length >= 10) earned = true;
    }

    if (earned) {
      await setDoc(doc(db, 'users', userId, 'achievements', def.id), {
        ...def, earnedAt: serverTimestamp(), xpAwarded: def.xp,
      });
      await updateDoc(doc(db, 'users', userId), { xp: increment(def.xp) });
      newAchievements.push(def);
    }
  }

  return newAchievements;
}

export async function getAchievements(userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const snap = await getDocs(collection(db, 'users', userId, 'achievements'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ===== PROGRESSIVE UNLOCKING =====

const UNLOCK_THRESHOLDS = {
  Easy: { solvesRequired: 0 },
  Medium: { solvesRequired: 10 },
  Hard: { solvesRequired: 30 },
};

export function getUnlockedDifficulties(totalSolved: number, isBeginner: boolean): ('Easy' | 'Medium' | 'Hard')[] {
  if (!isBeginner) return ['Easy', 'Medium', 'Hard'];
  const unlocked: ('Easy' | 'Medium' | 'Hard')[] = ['Easy'];
  if (totalSolved >= UNLOCK_THRESHOLDS.Medium.solvesRequired) unlocked.push('Medium');
  if (totalSolved >= UNLOCK_THRESHOLDS.Hard.solvesRequired) unlocked.push('Hard');
  return unlocked;
}

export async function getUserProblemVerdicts(userId: string): Promise<Record<string, Verdict>> {
  const { firestore: db } = initializeFirebase();
  if (!db) return {};
  const snap = await getDocs(query(
    collection(db, 'users', userId, 'submissions'),
    orderBy('submittedAt', 'desc'),
  ));
  const latest: Record<string, Verdict> = {};
  snap.docs.forEach(d => {
    const data = d.data();
    if (!latest[data.problemId]) latest[data.problemId] = data.verdict;
  });
  return latest;
}
