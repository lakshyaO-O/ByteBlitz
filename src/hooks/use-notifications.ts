'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { initializeFirebase } from '@/firebase';
import {
  collection, addDoc, doc, updateDoc, getDoc, query, where, onSnapshot, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { Notification, NotificationType } from '@/app/lib/types';

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) { setNotifications([]); setLoading(false); return; }
    setLoading(true);
    let unsub: (() => void) | null = null;
    const { firestore: db } = initializeFirebase();
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, 'users', userId, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
    unsub = onSnapshot(q, (snap) => {
      const notifs: Notification[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
      setLoading(false);
    }, () => { setLoading(false); });
    return () => { if (unsub) unsub(); };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { read: true });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, 'users', userId, 'notifications', n.id), { read: true }).catch((err) => console.error('[Notifications] Failed to mark as read', err))));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }, [userId, notifications]);

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead };
}

const sentCache = new Set<string>();

export function useSendNotification() {
  const sendNotification = useCallback(async (params: {
    userId: string; type: NotificationType; title: string; message: string; data?: Record<string, any>;
  }) => {
    const cacheKey = `${params.userId}:${params.type}:${Date.now()}`;
    if (sentCache.has(cacheKey)) return;
    sentCache.add(cacheKey);
    setTimeout(() => sentCache.delete(cacheKey), 5000);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      await addDoc(collection(db, 'users', params.userId, 'notifications'), {
        userId: params.userId, type: params.type, title: params.title,
        message: params.message, data: params.data || {}, read: false, createdAt: serverTimestamp(),
      });
    } catch { /* ignore */ }
  }, []);
  return { sendNotification };
}
