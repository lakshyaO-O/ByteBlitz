'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import {
  getShopItems, getShopItemById, getFeaturedItems, getDevCoinBalance,
  purchaseItem, getInventory, getOwnedItems,
  equipItem, unequipItem, isItemOwned, getPurchaseHistory,
  recordEarning, getRecentEarnings, getTotalDevCoinsEarned,
} from '@/services/shop';
import type {
  ShopItem, UserInventory, PurchaseRecord, DevCoinEarning, DevCoinSource, ShopItemType,
} from '@/types';

// ---- Shop Items ----

export function useShopItems(category?: ShopItemType) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getShopItems(category).then(data => { if (mounted) setItems(data); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [category]);

  return { items, loading };
}

export function useFeaturedItems() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getFeaturedItems().then(data => { if (mounted) setItems(data); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return { items, loading };
}

// ---- DevCoin Balance ----

export function useDevCoins() {
  const { user } = useUser();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.uid) { setBalance(0); setLoading(false); return; }
    const bal = await getDevCoinBalance(user.uid);
    setBalance(bal);
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => { refresh(); }, [refresh]);

  return { balance, loading, refresh };
}

// ---- Purchase ----

export function usePurchase() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = useCallback(async (itemId: string): Promise<boolean> => {
    if (!user?.uid) { setError('Not logged in'); return false; }
    setLoading(true);
    setError(null);
    const result = await purchaseItem(user.uid, itemId);
    if (!result.success) setError(result.error || 'Purchase failed');
    setLoading(false);
    return result.success;
  }, [user?.uid]);

  return { buy, loading, error, clearError: () => setError(null) };
}

// ---- Inventory ----

export function useInventory() {
  const { user } = useUser();
  const [inventory, setInventory] = useState<UserInventory | null>(null);
  const [ownedItems, setOwnedItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.uid) { setInventory(null); setOwnedItems([]); setLoading(false); return; }
    const [inv, items] = await Promise.all([
      getInventory(user.uid),
      getOwnedItems(user.uid),
    ]);
    setInventory(inv);
    setOwnedItems(items);
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => { refresh(); }, [refresh]);

  const equip = useCallback(async (itemId: string): Promise<boolean> => {
    if (!user?.uid) return false;
    const ok = await equipItem(user.uid, itemId);
    if (ok) await refresh();
    return ok;
  }, [user?.uid, refresh]);

  const unequip = useCallback(async (itemType: ShopItemType): Promise<boolean> => {
    if (!user?.uid) return false;
    const ok = await unequipItem(user.uid, itemType);
    if (ok) await refresh();
    return ok;
  }, [user?.uid, refresh]);

  return { inventory, ownedItems, loading, refresh, equip, unequip };
}

export function useItemOwned(itemId: string) {
  const { user } = useUser();
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setOwned(false); setLoading(false); return; }
    let mounted = true;
    isItemOwned(user.uid, itemId).then(val => { if (mounted) setOwned(val); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user?.uid, itemId]);

  return { owned, loading };
}

// ---- Purchase History ----

export function usePurchaseHistory() {
  const { user } = useUser();
  const [history, setHistory] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setHistory([]); setLoading(false); return; }
    let mounted = true;
    getPurchaseHistory(user.uid).then(data => { if (mounted) setHistory(data); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user?.uid]);

  return { history, loading };
}

// ---- DevCoin Earning ----

export function useEarnings() {
  const { user } = useUser();
  const [recent, setRecent] = useState<DevCoinEarning[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.uid) { setRecent([]); setTotal(0); setLoading(false); return; }
    const [r, t] = await Promise.all([
      getRecentEarnings(user.uid),
      getTotalDevCoinsEarned(user.uid),
    ]);
    setRecent(r);
    setTotal(t);
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => { refresh(); }, [refresh]);

  const earn = useCallback(async (
    source: DevCoinSource,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<{ success: boolean; amount: number; error?: string }> => {
    if (!user?.uid) return { success: false, amount: 0, error: 'Not logged in' };
    const result = await recordEarning(user.uid, source, description, metadata);
    if (result.success) await refresh();
    return result;
  }, [user?.uid, refresh]);

  return { recent, total, loading, refresh, earn };
}
