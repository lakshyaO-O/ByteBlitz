'use client';

import { useState, useCallback, useEffect } from 'react';
import { openDB } from 'idb';

interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
  retries: number;
}

async function getQueueDB() {
  return openDB('codezarena-offline', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('actionQueue')) {
        db.createObjectStore('actionQueue', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [syncing, setSyncing] = useState(false);

  const enqueue = useCallback(async (type: string, payload: any) => {
    const db = await getQueueDB();
    const action: QueuedAction = {
      id: Date.now().toString(),
      type,
      payload,
      timestamp: new Date().toISOString(),
      retries: 0,
    };
    await db.add('actionQueue', action);
    setQueue(prev => [...prev, action]);
  }, []);

  const processQueue = useCallback(async () => {
    const db = await getQueueDB();
    const all = await db.getAll('actionQueue');
    if (all.length === 0) return;
    setSyncing(true);
    for (const action of all) {
      try {
        const res = await fetch('/api/offline-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        });
        if (res.ok) {
          await db.delete('actionQueue', action.id);
          setQueue(prev => prev.filter(a => a.id !== action.id));
        }
      } catch {
        await db.put('actionQueue', { ...action, retries: action.retries + 1 });
      }
    }
    setSyncing(false);
  }, []);

  useEffect(() => {
    const loadQueue = async () => {
      const db = await getQueueDB();
      const all = await db.getAll('actionQueue');
      setQueue(all);
    };
    loadQueue();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      if (queue.length > 0) processQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [queue, processQueue]);

  return { queue, syncing, enqueue, processQueue, queueLength: queue.length };
}
