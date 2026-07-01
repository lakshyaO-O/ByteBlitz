'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import { CodingLanguage, SavedCode } from '@/app/lib/types';

const DB_NAME = 'devrann-editor';
const DB_VERSION = 1;

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('savedCode')) {
        db.createObjectStore('savedCode', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('userPreferences')) {
        db.createObjectStore('userPreferences');
      }
    },
  });
}

export function useEditorPersistence(userId: string | null) {
  const [savedCodes, setSavedCodes] = useState<SavedCode[]>([]);
  const [loadedCode, setLoadedCode] = useState<string | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!userId) return;
    loadAllSavedCodes(userId);
  }, [userId]);

  const loadAllSavedCodes = async (uid: string) => {
    try {
      const db = await getDB();
      const all = await db.getAll('savedCode');
      setSavedCodes(all.filter((c: any) => c.userId === uid));
    } catch (e) { console.warn('[EditorPersistence] Failed to load codes:', e); }
  };

  const saveCode = useCallback(async (problemId: string, problemTitle: string, language: CodingLanguage, code: string, uid: string) => {
    try {
      const db = await getDB();
      const entry: SavedCode = {
        id: `${uid}_${problemId}`,
        problemId,
        problemTitle,
        language,
        code,
        lastModified: new Date().toISOString(),
        userId: uid,
      };
      await db.put('savedCode', entry);
      setLastSaved(new Date());
      setSavedCodes(prev => {
        const idx = prev.findIndex(c => c.id === entry.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = entry;
          return updated;
        }
        return [...prev, entry];
      });
    } catch (e) { console.warn('[EditorPersistence] Failed to save code:', e); }
  }, []);

  const loadCode = useCallback(async (problemId: string, uid: string) => {
    try {
      const db = await getDB();
      const entry = await db.get('savedCode', `${uid}_${problemId}`);
      if (entry) {
        setLoadedCode(entry.code);
        return entry.code;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const autoSave = useCallback((problemId: string, problemTitle: string, language: CodingLanguage, code: string, uid: string) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveCode(problemId, problemTitle, language, code, uid);
    }, 3000);
  }, [saveCode]);

  const clearSavedCode = useCallback(async (problemId: string, uid: string) => {
    try {
      const db = await getDB();
      await db.delete('savedCode', `${uid}_${problemId}`);
      setSavedCodes(prev => prev.filter(c => c.id !== `${uid}_${problemId}`));
    } catch (e) { console.warn('[EditorPersistence] Failed to clear code:', e); }
  }, []);

  return {
    savedCodes,
    loadedCode,
    lastSaved,
    saveCode,
    loadCode,
    autoSave,
    clearSavedCode,
  };
}

export async function saveUserPreference(key: string, value: any) {
  try {
    const db = await getDB();
    await db.put('userPreferences', value, key);
  } catch (e) { console.warn('[EditorPersistence] Failed to save preference:', e); }
}

export async function getUserPreference(key: string) {
  try {
    const db = await getDB();
    return await db.get('userPreferences', key);
  } catch {
    return null;
  }
}
