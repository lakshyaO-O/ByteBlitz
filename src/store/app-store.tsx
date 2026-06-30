'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AppState {
  sidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  searchQuery: string;
}

interface AppStoreContextType {
  state: AppState;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
}

const defaultState: AppState = {
  sidebarCollapsed: false,
  isMobileMenuOpen: false,
  searchQuery: '',
};

const AppStoreContext = createContext<AppStoreContextType>({
  state: defaultState,
  setSidebarCollapsed: () => {},
  setMobileMenuOpen: () => {},
  setSearchQuery: () => {},
});

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState(prev => ({ ...prev, sidebarCollapsed: collapsed }));
  }, []);

  const setMobileMenuOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isMobileMenuOpen: open }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  return (
    <AppStoreContext.Provider value={{ state, setSidebarCollapsed, setMobileMenuOpen, setSearchQuery }}>
      {children}
    </AppStoreContext.Provider>
  );
}

export const useAppStore = () => useContext(AppStoreContext);
