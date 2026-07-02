'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { fetchArenaSettings, saveArenaSettings } from '@/services/arena';
import type { ArenaSettings } from '@/types';

const DEFAULT_SETTINGS: ArenaSettings = {
  preferredLanguage: 'python',
  rated: true,
  difficulty: 'Medium',
  category: 'all',
  timeControl: '5+0',
  region: 'auto',
  eloRange: 200,
  editorTheme: 'vs-dark',
  editorFontSize: 14,
  editorMinimap: true,
  editorWordWrap: true,
  editorTabSize: 4,
  soundEnabled: true,
  musicEnabled: false,
  showOpponentProgress: true,
  autoAcceptRematch: false,
  confirmBeforeSubmit: true,
  privacyShowActivity: true,
  privacyShowRating: true,
  privacyShowStats: true,
  notificationsMatchFound: true,
  notificationsBattleStart: true,
  notificationsRoundEnd: true,
  notificationsFriendInvite: true,
};

export function useArenaSettings() {
  const { user } = useUser();
  const [settings, setSettings] = useState<ArenaSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchArenaSettings(user.uid)
      .then((s) => { if (mounted) setSettings(s); })
      .catch((e) => { if (mounted) setError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user?.uid]);

  const updateSetting = useCallback(async <K extends keyof ArenaSettings>(
    key: K, value: ArenaSettings[K],
  ) => {
    if (!user?.uid) return;
    setSettings(prev => ({ ...prev, [key]: value }));
    try {
      await saveArenaSettings(user.uid, { [key]: value });
    } catch (e: any) {
      setError(e.message);
    }
  }, [user?.uid]);

  const updateSettings = useCallback(async (partial: Partial<ArenaSettings>) => {
    if (!user?.uid) return;
    setSettings(prev => ({ ...prev, ...partial }));
    try {
      await saveArenaSettings(user.uid, partial);
    } catch (e: any) {
      setError(e.message);
    }
  }, [user?.uid]);

  const resetSettings = useCallback(async () => {
    if (!user?.uid) return;
    setSettings(DEFAULT_SETTINGS);
    try {
      await saveArenaSettings(user.uid, DEFAULT_SETTINGS);
    } catch (e: any) {
      setError(e.message);
    }
  }, [user?.uid]);

  return { settings, loading, error, updateSetting, updateSettings, resetSettings };
}
