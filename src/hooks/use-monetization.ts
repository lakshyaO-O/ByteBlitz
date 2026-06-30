'use client';

import { useState, useCallback } from 'react';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { SubscriptionTier } from '@/app/lib/types';

const SUBSCRIPTION_BENEFITS: Record<SubscriptionTier, string[]> = {
  free: ['Basic editor', 'Practice problems', 'Leaderboard'],
  pro: ['Monaco editor', 'Analytics dashboard', 'AI code review (50/mo)', 'Custom themes', 'Priority support'],
  elite: ['Everything in Pro', 'Unlimited AI review', 'Spectator mode', 'Early access features', 'Premium badge', 'Recruiter profile'],
};

export function useMonetization(userId: string | null) {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [aiCredits, setAiCredits] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSubscription = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return; }
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setTier(data.subscriptionTier || 'free');
        setAiCredits(data.aiCredits || 0);
        setReferralCode(data.referralCode || '');
      }
    } catch (e) { console.warn('[useMonetization] Failed to load subscription:', e); }
    setLoading(false);
  }, [userId]);

  const useAiCredit = useCallback(async () => {
    if (!userId || aiCredits <= 0) return false;
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return false;
      await updateDoc(doc(db, 'users', userId), { aiCredits: increment(-1) });
      setAiCredits(prev => prev - 1);
      return true;
    } catch { return false; }
  }, [userId, aiCredits]);

  const generateReferralCode = useCallback(async () => {
    if (!userId) return '';
    const code = `REF-${userId.slice(0, 6)}-${Date.now().toString(36).toUpperCase()}`;
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return '';
      await updateDoc(doc(db, 'users', userId), { referralCode: code });
      setReferralCode(code);
      return code;
    } catch { return ''; }
  }, [userId]);

  const applyReferral = useCallback(async (code: string) => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db || !userId) return false;
      const refDoc = await getDoc(doc(db, 'referrals', code));
      if (!refDoc.exists()) return false;
      const refData = refDoc.data();
      await Promise.all([
        updateDoc(doc(db, 'users', refData.userId), { coins: increment(100), xp: increment(50) }),
        updateDoc(doc(db, 'users', userId), { coins: increment(50), xp: increment(25), referredBy: refData.userId }),
        addDoc(collection(db, 'users', refData.userId, 'notifications'), {
          type: 'achievement_unlock',
          title: 'Referral Reward!',
          message: 'Someone used your referral code! +100 coins, +50 XP',
          data: {},
          read: false,
          createdAt: serverTimestamp(),
        }),
      ]);
      return true;
    } catch { return false; }
  }, [userId]);

  const getBenefits = useCallback((t: SubscriptionTier) => SUBSCRIPTION_BENEFITS[t], []);

  return {
    tier, aiCredits, referralCode, loading, loadSubscription,
    useAiCredit, generateReferralCode, applyReferral, getBenefits,
    SUBSCRIPTION_BENEFITS,
  };
}

export { SUBSCRIPTION_BENEFITS };
