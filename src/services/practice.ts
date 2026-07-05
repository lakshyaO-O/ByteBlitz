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
  ProblemContent, ProblemDocumentMeta, PracticeDraft, TestCaseResult,
} from '@/types';
import { createMockJudge } from '@/features/practice/services/mock-judge';

const judge = createMockJudge();

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
  onProgress?: (progress: any) => void,
): Promise<{ submission: PracticeSubmission; results: TestCaseResult[]; compileTimeMs?: number; codeSize?: number }> {
  const problem = await fetchProblem(problemId);
  const judgeResult = await judge.execute({
    code, language, testCases, problemId,
    timeLimitMs: problem?.timeLimitMs || 2000,
    memoryLimitKb: problem?.memoryLimitKb || 256000,
  }, onProgress);

  const { verdict, passedTestCases, totalTestCases, testCaseResults, compileTimeMs, codeSize } = judgeResult;
  const results = testCaseResults;

  const { firestore: db } = initializeFirebase();
  let submissionId = '';

  if (db) {
    const subRef = await addDoc(collection(db, 'users', userId, 'submissions'), {
      userId, problemId, language, code,
      verdict, passedTestCases, totalTestCases,
      executionTimeMs: judgeResult.executionTimeMs,
      memoryUsedKb: judgeResult.memoryUsedKb,
      compileTimeMs: compileTimeMs ?? null,
      codeSize: codeSize ?? null,
      submittedAt: serverTimestamp(),
    });
    submissionId = subRef.id;

    const ppRef = doc(db, 'users', userId, 'practiceProgress', problemId);
    await setDoc(ppRef, {
      solved: verdict === 'Accepted',
      attempted: true,
      bestSubmissionId: subRef.id,
      submissionsCount: increment(1),
      lastSubmittedAt: serverTimestamp(),
      lastVerdict: verdict,
    }, { merge: true });

    await setDoc(doc(db, 'users', userId, 'progress', problemId), {
      solved: verdict === 'Accepted',
      attempted: true,
      bestSubmissionId: subRef.id,
      submissionsCount: increment(1),
      lastSubmittedAt: serverTimestamp(),
      lastVerdict: verdict,
    }, { merge: true });

    const userRef = doc(db, 'users', userId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (snap.exists()) {
        const updates: Record<string, any> = {
          xp: increment(verdict === 'Accepted' ? 50 : 10),
          totalSubmissions: increment(1),
          lastActive: serverTimestamp(),
        };
        if (verdict === 'Accepted') {
          updates.problemsSolved = increment(1);
        }
        tx.update(userRef, updates);
      }
    });
  }

  const submission: PracticeSubmission = {
    id: submissionId || 'local',
    userId, problemId, language, code,
    verdict, passedTestCases, totalTestCases,
    executionTimeMs: judgeResult.executionTimeMs,
    memoryUsedKb: judgeResult.memoryUsedKb,
    submittedAt: new Date().toISOString(),
  };

  return { submission, results, compileTimeMs, codeSize };
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
  const [progressSnap, submissionsSnap, problemsSnap] = await Promise.all([
    getDocs(collection(db, 'users', userId, 'practiceProgress')),
    getDocs(query(collection(db, 'users', userId, 'submissions'), orderBy('submittedAt', 'desc'), limit(500))),
    getDocs(collection(db, 'problems')),
  ]);

  const progressMap: Record<string, any> = {};
  progressSnap.docs.forEach(d => { progressMap[d.id] = d.data(); });

  const problemsMap: Record<string, any> = {};
  problemsSnap.docs.forEach(d => { problemsMap[d.id] = d.data(); });

  const submissions = submissionsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PracticeSubmission[];

  const solved = Object.values(progressMap).filter((p: any) => p.solved).length;
  const total = Object.keys(progressMap).length;

  let easySolved = 0, mediumSolved = 0, hardSolved = 0;

  for (const [pid, p] of Object.entries(progressMap)) {
    const prob = problemsMap[pid];
    if (!prob) continue;
    if ((p as any).solved) {
      if (prob.difficulty === 'Easy') easySolved++;
      else if (prob.difficulty === 'Medium') mediumSolved++;
      else if (prob.difficulty === 'Hard') hardSolved++;
    }
  }

  const byTopic: Record<string, { solved: number; total: number }> = {};
  for (const prob of Object.values(problemsMap) as any[]) {
    const topics: string[] = prob.topics || [prob.category].filter(Boolean);
    for (const t of topics) {
      if (!byTopic[t]) byTopic[t] = { solved: 0, total: 0 };
      byTopic[t].total++;
      if (progressMap[prob.id]?.solved) byTopic[t].solved++;
    }
  }

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

  // Compute streak from submission dates
  const submissionDates = new Set<string>();
  submissions.forEach(s => {
    const ts = (s as any).submittedAt;
    const d = ts?.toDate?.()?.toISOString()?.slice(0, 10);
    if (d) submissionDates.add(d);
  });
  const sortedDates = [...submissionDates].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let checkDate = new Date(today);
  for (const dateStr of sortedDates) {
    const expected = checkDate.toISOString().slice(0, 10);
    if (dateStr === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr < expected) {
      break;
    }
  }

  // Update Firestore streak if it changed
  if (streak !== (userData.streak || 0)) {
    try {
      await updateDoc(doc(db, 'users', userId), { streak });
    } catch { /* ignore */ }
  }

  return {
    totalSolved: solved,
    totalAttempted: total,
    totalXpEarned: userData.xp || 0,
    totalCoinsEarned: userData.coins || 0,
    currentStreak: streak,
    longestStreak: Math.max(streak, userData.longestStreak || 0),
    easySolved,
    mediumSolved,
    hardSolved,
    byTopic,
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

// ===== NEW SCHEMA: PROBLEM CONTENT (separate from metadata) =====

export async function fetchProblemContent(problemId: string): Promise<ProblemContent | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'problemContent', problemId));
  return snap.exists() ? (snap.data() as ProblemContent) : null;
}

export async function getFullProblem(problemId: string): Promise<PracticeProblemDocument | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const [metaSnap, contentSnap] = await Promise.all([
    getDoc(doc(db, 'problems', problemId)),
    getDoc(doc(db, 'problemContent', problemId)),
  ]);
  if (!metaSnap.exists()) return null;
  const meta = { id: metaSnap.id, ...metaSnap.data() } as ProblemDocumentMeta;
  if (!contentSnap.exists()) return null;
  const content = contentSnap.data() as ProblemContent;
  return {
    ...meta,
    description: content.description,
    constraints: content.constraints,
    examples: content.examples,
    testCases: content.testCases,
    hints: content.hints,
    editorial: content.editorial,
    solutionCode: Object.fromEntries(Object.entries(content.solutionCode).filter(([_, v]) => v != null)) as Record<CodingLanguage, string>,
    starterCode: Object.fromEntries(Object.entries(content.starterCode).filter(([_, v]) => v != null)) as Record<CodingLanguage, string>,
    timeLimitMs: content.timeLimitMs,
    memoryLimitKb: content.memoryLimitKb,
    acceptanceRate: meta.acceptanceRate,
  };
}

// ===== DRAFTS (separate from savedCode) =====

export async function saveDraft(userId: string, draft: PracticeDraft) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  await setDoc(doc(db, 'users', userId, 'drafts', draft.problemId), {
    code: draft.code,
    language: draft.language,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function loadDraft(userId: string, problemId: string): Promise<PracticeDraft | null> {
  const { firestore: db } = initializeFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', userId, 'drafts', problemId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    problemId,
    code: data.code,
    language: data.language,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

// ===== FILTERED QUERIES (for scalable browsing) =====

export async function fetchProblemsFiltered(opts: {
  difficulty?: string;
  topic?: string;
  isPremium?: boolean;
  search?: string;
  sortBy?: string;
  limitCount?: number;
}): Promise<ProblemDocumentMeta[]> {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];
  const constraints: any[] = [];
  if (opts.difficulty && opts.difficulty !== 'All') {
    constraints.push(where('difficulty', '==', opts.difficulty));
  }
  if (opts.topic && opts.topic !== 'All') {
    constraints.push(where('topics', 'array-contains', opts.topic));
  }
  if (opts.isPremium !== undefined) {
    constraints.push(where('isPremium', '==', opts.isPremium));
  }
  constraints.push(where('isPublished', '==', true));

  const sortField = opts.sortBy === 'XP (Low)' || opts.sortBy === 'XP (High)' ? 'points'
    : opts.sortBy === 'Acceptance' ? 'acceptanceRate'
    : opts.sortBy === 'Difficulty' ? 'difficultyRating'
    : 'title';
  constraints.push(orderBy(sortField, opts.sortBy === 'XP (Low)' ? 'asc' : 'desc'));
  constraints.push(limit(opts.limitCount || 50));

  const q = query(collection(db, 'problems'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProblemDocumentMeta));
}

// ===== BATCH PROGRESS UPDATE =====

export async function updateProgress(userId: string, problemId: string, updates: Partial<UserPracticeProgress>) {
  const { firestore: db } = initializeFirebase();
  if (!db) return;
  const ref = doc(db, 'users', userId, 'progress', problemId);
  await setDoc(ref, { ...updates, lastSubmittedAt: serverTimestamp() }, { merge: true });
}
