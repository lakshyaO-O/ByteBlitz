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
  dailyGoal: string;
  dailyXpGoal: number;
  dailyXpEarned: number;
  isBeginnerMode: boolean;
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
  dailyGoal: 'Complete your first lesson',
  dailyXpGoal: 50,
  dailyXpEarned: 0,
  isBeginnerMode: true,
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

  useEffect(() => {
    const { app: firebaseApp, firestore: db } = initializeFirebase();
    if (!firebaseApp || !db) {
      setState(prev => ({ ...prev, firebaseProgressLoaded: true }));
      return;
    }
    const auth = getAuth(firebaseApp);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, 'learning', 'progress'));
        if (snap.exists()) {
          const data = snap.data();
          setState(prev => {
            const newBeginner = {
              ...prev.beginner,
              hasCompletedOnboarding: data.hasCompletedOnboarding ?? true,
              lessonsCompleted: data.lessonsCompleted || prev.beginner.lessonsCompleted,
              lessonProgress: data.lessonProgress || prev.beginner.lessonProgress,
              xp: data.xp ?? prev.beginner.xp,
              coins: data.coins ?? prev.beginner.coins,
              currentLesson: data.currentLesson || prev.beginner.currentLesson,
              streak: data.streak ?? prev.beginner.streak,
            };
            persistBeginner(newBeginner);
            return { ...prev, beginner: newBeginner, firebaseProgressLoaded: true };
          });
        } else {
          setState(prev => ({ ...prev, firebaseProgressLoaded: true }));
        }
      } else {
        setState(prev => ({ ...prev, firebaseProgressLoaded: true }));
      }
    });
    return () => unsub();
  }, []);

  const syncBeginnerToFirebase = useCallback(async () => {
    const { firestore: db } = initializeFirebase();
    if (!db) return;
    const beginner = state.beginner;
    const { hasCompletedOnboarding, lessonsCompleted, lessonProgress, xp, coins, currentLesson, streak } = beginner;
    await setDoc(doc(db, 'learning', 'progress'), {
      hasCompletedOnboarding,
      lessonsCompleted,
      lessonProgress,
      xp,
      coins,
      currentLesson,
      streak,
      lastSynced: serverTimestamp(),
    }, { merge: true });
  }, [state.beginner]);

  const loadBeginnerFromFirebase = useCallback(async (userId?: string) => {
    const { firestore: db } = initializeFirebase();
    if (!db) return;
    const snap = await getDoc(doc(db, 'learning', 'progress'));
    if (snap.exists()) {
      const data = snap.data();
      setState(prev => {
        const newBeginner = {
          ...prev.beginner,
          hasCompletedOnboarding: data.hasCompletedOnboarding ?? true,
          lessonsCompleted: data.lessonsCompleted || prev.beginner.lessonsCompleted,
          lessonProgress: data.lessonProgress || prev.beginner.lessonProgress,
          xp: data.xp ?? prev.beginner.xp,
          coins: data.coins ?? prev.beginner.coins,
          currentLesson: data.currentLesson || prev.beginner.currentLesson,
          streak: data.streak ?? prev.beginner.streak,
        };
        persistBeginner(newBeginner);
        return { ...prev, beginner: newBeginner };
      });
    }
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
    setState(prev => {
      const newBeginner = { ...prev.beginner, ...partial };
      persistBeginner(newBeginner);
      return { ...prev, beginner: newBeginner };
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    updateBeginnerState({ hasCompletedOnboarding: true });
    syncBeginnerToFirebase();
  }, [updateBeginnerState, syncBeginnerToFirebase]);

  const addXp = useCallback((amount: number) => {
    setState(prev => {
      const newBeginner = {
        ...prev.beginner,
        xp: prev.beginner.xp + amount,
        dailyXpEarned: prev.beginner.dailyXpEarned + amount,
      };
      persistBeginner(newBeginner);
      syncBeginnerToFirebase();
      return { ...prev, beginner: newBeginner };
    });
  }, [syncBeginnerToFirebase]);

  const addCoins = useCallback((amount: number) => {
    setState(prev => {
      const newBeginner = { ...prev.beginner, coins: prev.beginner.coins + amount };
      persistBeginner(newBeginner);
      return { ...prev, beginner: newBeginner };
    });
  }, []);

  const completeLesson = useCallback((lessonId: number) => {
    setState(prev => {
      if (prev.beginner.lessonsCompleted.includes(lessonId)) return prev;
      const newCompleted = [...prev.beginner.lessonsCompleted, lessonId];
      const newBeginner = {
        ...prev.beginner,
        lessonsCompleted: newCompleted,
        currentLesson: lessonId + 1,
      };
      persistBeginner(newBeginner);
      return { ...prev, beginner: newBeginner };
    });
  }, []);

  const markLessonRead = useCallback((lessonId: number) => {
    setState(prev => {
      const progress = { ...prev.beginner.lessonProgress };
      if (!progress[lessonId]) progress[lessonId] = { read: false, quizPassed: false, challengePassed: false, xpAwarded: false, completedAt: null };
      progress[lessonId] = { ...progress[lessonId], read: true };
      const newBeginner = { ...prev.beginner, lessonProgress: progress };
      persistBeginner(newBeginner);
      return { ...prev, beginner: newBeginner };
    });
  }, []);

  const markQuizPassed = useCallback((lessonId: number) => {
    setState(prev => {
      const progress = { ...prev.beginner.lessonProgress };
      if (!progress[lessonId]) progress[lessonId] = { read: false, quizPassed: false, challengePassed: false, xpAwarded: false, completedAt: null };
      progress[lessonId] = { ...progress[lessonId], quizPassed: true };
      const newBeginner = { ...prev.beginner, lessonProgress: progress };
      persistBeginner(newBeginner);
      return { ...prev, beginner: newBeginner };
    });
  }, []);

  const markChallengePassed = useCallback((lessonId: number) => {
    setState(prev => {
      const progress = { ...prev.beginner.lessonProgress };
      if (!progress[lessonId]) progress[lessonId] = { read: false, quizPassed: false, challengePassed: false, xpAwarded: false, completedAt: null };
      progress[lessonId] = { ...progress[lessonId], challengePassed: true };
      const newBeginner = { ...prev.beginner, lessonProgress: progress };
      persistBeginner(newBeginner);
      return { ...prev, beginner: newBeginner };
    });
  }, []);

  const completeLessonFull = useCallback((lessonId: number, xpAmount: number, coinAmount: number) => {
    setState(prev => {
      if (prev.beginner.lessonsCompleted.includes(lessonId)) return prev;
      const progress = { ...prev.beginner.lessonProgress };
      if (!progress[lessonId]) progress[lessonId] = { read: false, quizPassed: false, challengePassed: false, xpAwarded: false, completedAt: null };
      progress[lessonId] = { ...progress[lessonId], xpAwarded: true, completedAt: new Date().toISOString() };
      const newCompleted = [...prev.beginner.lessonsCompleted, lessonId];
      const newBeginner = {
        ...prev.beginner,
        lessonsCompleted: newCompleted,
        currentLesson: lessonId + 1,
        xp: prev.beginner.xp + xpAmount,
        coins: prev.beginner.coins + coinAmount,
        dailyXpEarned: prev.beginner.dailyXpEarned + xpAmount,
        lessonProgress: progress,
      };
      persistBeginner(newBeginner);
      syncBeginnerToFirebase();
      return { ...prev, beginner: newBeginner };
    });
  }, [syncBeginnerToFirebase]);

  const incrementStreak = useCallback(() => {
    setState(prev => {
      const newBeginner = { ...prev.beginner, streak: prev.beginner.streak + 1 };
      persistBeginner(newBeginner);
      return { ...prev, beginner: newBeginner };
    });
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
