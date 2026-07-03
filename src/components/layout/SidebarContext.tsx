'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  collapsedSections: Record<string, boolean>;
  toggleSection: (label: string) => void;
  scrollPosition: number;
  setScrollPosition: (pos: number) => void;
  restoreScrollPosition: () => number;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = 'devrann-sidebar';
const SCROLL_KEY = 'devrann-sidebar-scroll';

interface StoredState {
  collapsed: boolean;
  collapsedSections: Record<string, boolean>;
}

function loadState(): StoredState {
  if (typeof window === 'undefined') return { collapsed: false, collapsedSections: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { collapsed: false, collapsedSections: {} };
}

function saveState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function loadScrollPosition(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    if (raw) return parseInt(raw, 10) || 0;
  } catch { /* ignore */ }
  return 0;
}

function saveScrollPosition(pos: number) {
  try {
    sessionStorage.setItem(SCROLL_KEY, String(pos));
  } catch { /* ignore */ }
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [stored] = useState(loadState);
  const [collapsed, setCollapsedState] = useState(stored.collapsed);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(stored.collapsedSections);
  const [scrollPosition, setScrollPositionState] = useState(loadScrollPosition);
  const lastSavedScroll = useRef(scrollPosition);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    saveState({ collapsed: value, collapsedSections: collapsedSections });
  }, [collapsedSections]);

  const toggleSection = useCallback((label: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [label]: !prev[label] };
      saveState({ collapsed, collapsedSections: next });
      return next;
    });
  }, [collapsed]);

  const setScrollPosition = useCallback((pos: number) => {
    setScrollPositionState(pos);
    lastSavedScroll.current = pos;
    saveScrollPosition(pos);
  }, []);

  const restoreScrollPosition = useCallback(() => {
    return loadScrollPosition();
  }, []);

  useEffect(() => {
    saveState({ collapsed, collapsedSections });
  }, [collapsed, collapsedSections]);

  return (
    <SidebarContext.Provider value={{
      collapsed,
      setCollapsed,
      collapsedSections,
      toggleSection,
      scrollPosition,
      setScrollPosition,
      restoreScrollPosition,
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
