'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export interface LessonProgress {
  read: boolean;
  quizPassed: boolean;
  challengePassed: boolean;
  xpAwarded: boolean;
  completedAt: string | null;
}

export interface BeginnerState {
  hasCompletedOnboarding: boolean;
  name: string;
  experienceLevel: 'complete_beginner' | 'beginner' | 'intermediate' | 'advanced' | null;
  preferredLanguage: string | null;
  reason: string | null;
  education: string;
  currentLesson: number;
  lessonsCompleted: number[];
  lessonProgress: Record<number, LessonProgress>;
  currentTopic: string;
  xp: number;
  coins: number;
  streak: number;
  lastStreakDate: string;
  dailyGoal: string;
  dailyXpGoal: number;
  dailyXpEarned: number;
  isBeginnerMode: boolean;
  correctSubmissions: number;
  totalSubmissions: number;
  problemsSolved: number;
}

interface AppState {
  sidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  searchQuery: string;
  firebaseProgressLoaded: boolean;
  beginner: BeginnerState;
}

interface AppStoreContextType {
  state: AppState;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  updateBeginnerState: (partial: Partial<BeginnerState>) => void;
  completeOnboarding: () => void;
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  completeLesson: (lessonId: number) => void;
  markLessonRead: (lessonId: number) => void;
  markQuizPassed: (lessonId: number) => void;
  markChallengePassed: (lessonId: number) => void;
  completeLessonFull: (lessonId: number, xp: number, coins: number) => void;
  incrementStreak: () => void;
  recordSubmission: (correct: boolean) => void;
  recordPracticeSolved: () => void;
  syncBeginnerToFirebase: () => Promise<void>;
  loadBeginnerFromFirebase: (userId?: string) => Promise<void>;
}

const defaultBeginnerState: BeginnerState = {
  hasCompletedOnboarding: false,
  name: '',
  experienceLevel: null,
  preferredLanguage: null,
  reason: null,
  education: '',
  currentLesson: 1,
  lessonsCompleted: [],
  lessonProgress: {},
  currentTopic: 'Introduction',
  xp: 0,
  coins: 0,
  streak: 0,
  lastStreakDate: '',
  dailyGoal: 'Complete your first lesson',
  dailyXpGoal: 50,
  dailyXpEarned: 0,
  isBeginnerMode: true,
  correctSubmissions: 0,
  totalSubmissions: 0,
  problemsSolved: 0,
};

const defaultState: AppState = {
  sidebarCollapsed: false,
  isMobileMenuOpen: false,
  searchQuery: '',
  firebaseProgressLoaded: false,
  beginner: defaultBeginnerState,
};

const AppStoreContext = createContext<AppStoreContextType>({
  state: defaultState,
  setSidebarCollapsed: () => {},
  setMobileMenuOpen: () => {},
  setSearchQuery: () => {},
  updateBeginnerState: () => {},
  completeOnboarding: () => {},
  addXp: () => {},
  addCoins: () => {},
  completeLesson: () => {},
  markLessonRead: () => {},
  markQuizPassed: () => {},
  markChallengePassed: () => {},
  completeLessonFull: () => {},
  incrementStreak: () => {},
  recordSubmission: () => {},
  recordPracticeSolved: () => {},
  syncBeginnerToFirebase: async () => {},
  loadBeginnerFromFirebase: async (_userId?: string) => {},
});

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('devrann_beginner');
        if (saved) {
          const beginner = JSON.parse(saved);
          return { ...defaultState, beginner: { ...defaultBeginnerState, ...beginner } };
        }
      } catch {}
    }
    return defaultState;
  });

  const persistBeginner = (newBeginner: BeginnerState) => {
    try { localStorage.setItem('devrann_beginner', JSON.stringify(newBeginner)); } catch {}
  };

  // Auto-persist beginner state whenever it changes
  useEffect(() => {
    persistBeginner(state.beginner);
  }, [state.beginner]);

  useEffect(() => {
    const { app: firebaseApp, firestore: db } = initializeFirebase();
    if (!firebaseApp || !db) {
      setState(prev => ({ ...prev, firebaseProgressLoaded: true }));
      return;
    }
    const auth = getAuth(firebaseApp);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const progressRef = doc(db, 'learning', user.uid);
        const snap = await getDoc(progressRef);
        const data = snap.exists() ? snap.data() : null;
        setState(prev => {
          const newBeginner = {
            ...prev.beginner,
            ...(data ? {
              hasCompletedOnboarding: data.hasCompletedOnboarding ?? true,
              lessonsCompleted: data.lessonsCompleted || prev.beginner.lessonsCompleted,
              lessonProgress: data.lessonProgress || prev.beginner.lessonProgress,
              xp: data.xp ?? prev.beginner.xp,
              coins: data.coins ?? prev.beginner.coins,
              currentLesson: data.currentLesson || prev.beginner.currentLesson,
              streak: data.streak ?? prev.beginner.streak,
              lastStreakDate: data.lastStreakDate ?? prev.beginner.lastStreakDate,
              correctSubmissions: data.correctSubmissions ?? prev.beginner.correctSubmissions,
              totalSubmissions: data.totalSubmissions ?? prev.beginner.totalSubmissions,
              problemsSolved: data.problemsSolved ?? prev.beginner.problemsSolved,
            } : {}),
          };
          return { ...prev, beginner: newBeginner, firebaseProgressLoaded: true };
        });
      } else {
        setState(prev => ({ ...prev, firebaseProgressLoaded: true }));
      }
    });
    return () => unsub();
  }, []);

  const syncBeginnerToFirebase = useCallback(async (userId?: string) => {
    const { firestore: db, auth } = initializeFirebase();
    if (!db) return;
    const uid = userId || auth?.currentUser?.uid;
    if (!uid) return;
    const beginner = state.beginner;
    const { hasCompletedOnboarding, lessonsCompleted, lessonProgress, xp, coins, currentLesson, streak, lastStreakDate, correctSubmissions, totalSubmissions, problemsSolved } = beginner;
    await setDoc(doc(db, 'learning', uid), {
      hasCompletedOnboarding,
      lessonsCompleted,
      lessonProgress,
      xp,
      coins,
      currentLesson,
      streak,
      lastStreakDate,
      correctSubmissions,
      totalSubmissions,
      problemsSolved,
      lastSynced: serverTimestamp(),
    }, { merge: true });
  }, [state.beginner]);

  // Auto-sync to Firebase whenever beginner state changes
  useEffect(() => {
    if (!state.firebaseProgressLoaded) return;
    syncBeginnerToFirebase();
  }, [state.beginner, state.firebaseProgressLoaded, syncBeginnerToFirebase]);

  const loadBeginnerFromFirebase = useCallback(async (userId?: string) => {
    const { firestore: db, auth } = initializeFirebase();
    if (!db) return;
    const uid = userId || auth?.currentUser?.uid;
    if (!uid) return;
    const progressRef = doc(db, 'learning', uid);
    const snap = await getDoc(progressRef);
    const data = snap.exists() ? snap.data() : null;
    setState(prev => {
      const newBeginner = {
        ...prev.beginner,
        ...(data ? {
          lessonsCompleted: data.lessonsCompleted || prev.beginner.lessonsCompleted,
          lessonProgress: data.lessonProgress || prev.beginner.lessonProgress,
          xp: data.xp ?? prev.beginner.xp,
          coins: data.coins ?? prev.beginner.coins,
          currentLesson: data.currentLesson || prev.beginner.currentLesson,
          streak: data.streak ?? prev.beginner.streak,
          lastStreakDate: data.lastStreakDate ?? prev.beginner.lastStreakDate,
          correctSubmissions: data.correctSubmissions ?? prev.beginner.correctSubmissions,
          totalSubmissions: data.totalSubmissions ?? prev.beginner.totalSubmissions,
          problemsSolved: data.problemsSolved ?? prev.beginner.problemsSolved,
        } : {}),
      };
      return { ...prev, beginner: newBeginner };
    });
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState(prev => ({ ...prev, sidebarCollapsed: collapsed }));
  }, []);

  const setMobileMenuOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isMobileMenuOpen: open }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const updateBeginnerState = useCallback((partial: Partial<BeginnerState>) => {
    setState(prev => ({
      ...prev,
      beginner: { ...prev.beginner, ...partial },
    }));
  }, []);

  const completeOnboarding = useCallback(async () => {
    updateBeginnerState({ hasCompletedOnboarding: true });
    const { firestore: db, auth } = initializeFirebase();
    if (db && auth?.currentUser?.uid) {
      const uid = auth.currentUser.uid;
      await Promise.all([
        setDoc(doc(db, 'learning', uid), {
          hasCompletedOnboarding: true,
          lastSynced: serverTimestamp(),
        }, { merge: true }),
        setDoc(doc(db, 'users', uid), {
          onboardingCompleted: true,
        }, { merge: true }),
      ]);
    }
  }, [updateBeginnerState]);

  const addXp = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      beginner: {
        ...prev.beginner,
        xp: prev.beginner.xp + amount,
        dailyXpEarned: prev.beginner.dailyXpEarned + amount,
      },
    }));
  }, []);

  const addCoins = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      beginner: { ...prev.beginner, coins: prev.beginner.coins + amount },
    }));
  }, []);

  const completeLesson = useCallback((lessonId: number) => {
    setState(prev => {
      if (prev.beginner.lessonsCompleted.includes(lessonId)) return prev;
      return {
        ...prev,
        beginner: {
          ...prev.beginner,
          lessonsCompleted: [...prev.beginner.lessonsCompleted, lessonId],
          currentLesson: lessonId + 1,
        },
      };
    });
  }, []);

  const markLessonRead = useCallback((lessonId: number) => {
    setState(prev => {
      const progress = { ...prev.beginner.lessonProgress };
      if (!progress[lessonId]) progress[lessonId] = { read: false, quizPassed: false, challengePassed: false, xpAwarded: false, completedAt: null };
      progress[lessonId] = { ...progress[lessonId], read: true };
      return { ...prev, beginner: { ...prev.beginner, lessonProgress: progress } };
    });
  }, []);

  const markQuizPassed = useCallback((lessonId: number) => {
    setState(prev => {
      const progress = { ...prev.beginner.lessonProgress };
      if (!progress[lessonId]) progress[lessonId] = { read: false, quizPassed: false, challengePassed: false, xpAwarded: false, completedAt: null };
      progress[lessonId] = { ...progress[lessonId], quizPassed: true };
      return { ...prev, beginner: { ...prev.beginner, lessonProgress: progress } };
    });
  }, []);

  const markChallengePassed = useCallback((lessonId: number) => {
    setState(prev => {
      const progress = { ...prev.beginner.lessonProgress };
      if (!progress[lessonId]) progress[lessonId] = { read: false, quizPassed: false, challengePassed: false, xpAwarded: false, completedAt: null };
      progress[lessonId] = { ...progress[lessonId], challengePassed: true };
      return { ...prev, beginner: { ...prev.beginner, lessonProgress: progress } };
    });
  }, []);

  const completeLessonFull = useCallback((lessonId: number, xpAmount: number, coinAmount: number) => {
    setState(prev => {
      if (prev.beginner.lessonsCompleted.includes(lessonId)) return prev;
      const progress = { ...prev.beginner.lessonProgress };
      if (!progress[lessonId]) progress[lessonId] = { read: false, quizPassed: false, challengePassed: false, xpAwarded: false, completedAt: null };
      progress[lessonId] = { ...progress[lessonId], xpAwarded: true, completedAt: new Date().toISOString() };
      return {
        ...prev,
        beginner: {
          ...prev.beginner,
          lessonsCompleted: [...prev.beginner.lessonsCompleted, lessonId],
          currentLesson: lessonId + 1,
          xp: prev.beginner.xp + xpAmount,
          coins: prev.beginner.coins + coinAmount,
          dailyXpEarned: prev.beginner.dailyXpEarned + xpAmount,
          lessonProgress: progress,
        },
      };
    });
  }, []);

  const incrementStreak = useCallback(() => {
    setState(prev => {
      const today = new Date().toISOString().slice(0, 10);
      const lastDate = prev.beginner.lastStreakDate;
      if (lastDate === today && prev.beginner.streak > 0) return prev;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = lastDate === yesterday ? prev.beginner.streak + 1 : 1;
      return { ...prev, beginner: { ...prev.beginner, streak: newStreak, lastStreakDate: today } };
    });
  }, []);

  const recordSubmission = useCallback((correct: boolean) => {
    setState(prev => ({
      ...prev,
      beginner: {
        ...prev.beginner,
        totalSubmissions: prev.beginner.totalSubmissions + 1,
        correctSubmissions: prev.beginner.correctSubmissions + (correct ? 1 : 0),
      },
    }));
  }, []);

  const recordPracticeSolved = useCallback(() => {
    setState(prev => ({
      ...prev,
      beginner: { ...prev.beginner, problemsSolved: prev.beginner.problemsSolved + 1 },
    }));
  }, []);

  const value = useMemo(() => ({
    state,
    setSidebarCollapsed,
    setMobileMenuOpen,
    setSearchQuery,
    updateBeginnerState,
    completeOnboarding,
    addXp,
    addCoins,
    completeLesson,
    markLessonRead,
    markQuizPassed,
    markChallengePassed,
    completeLessonFull,
    incrementStreak,
    recordSubmission,
    recordPracticeSolved,
    syncBeginnerToFirebase,
    loadBeginnerFromFirebase,
  }), [
    state,
    setSidebarCollapsed,
    setMobileMenuOpen,
    setSearchQuery,
    updateBeginnerState,
    completeOnboarding,
    addXp,
    addCoins,
    completeLesson,
    markLessonRead,
    markQuizPassed,
    markChallengePassed,
    completeLessonFull,
    incrementStreak,
    recordSubmission,
    recordPracticeSolved,
    syncBeginnerToFirebase,
    loadBeginnerFromFirebase,
  ]);

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export const useAppStore = () => useContext(AppStoreContext);
