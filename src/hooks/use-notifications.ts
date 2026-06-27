'use client';

import { useState, useCallback, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { Notification, NotificationType } from '@/app/lib/types';

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    let unsubscribe: (() => void) | null = null;
    const { firestore: db } = initializeFirebase();

    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
      setLoading(false);
    }, (err) => {
      console.error('Notifications listener error:', err);
      setLoading(false);
    });

    return () => { if (unsubscribe) unsubscribe(); };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;
    try {
      const { firestore: db } = initializeFirebase();
      await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { read: true });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  }, [userId]);

  const sendNotification = useCallback(async (params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) => {
    try {
      const { firestore: db } = initializeFirebase();
      await addDoc(collection(db, 'users', params.userId, 'notifications'), {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch {
      // ignore
    }
  }, []);

  return { notifications, loading, unreadCount, markAsRead, refresh: () => {}, sendNotification };
}

