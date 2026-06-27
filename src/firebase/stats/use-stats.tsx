'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '../provider';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { firebaseConfig } from '../config';

export interface GlobalStats {
  totalPlayers: number;
  totalBattles: number;
  avgExecutionTime: number;
  activeBattles: number;
}

export function useGlobalStats() {
  const db = useFirestore();
  const [stats, setStats] = useState<GlobalStats>({
    totalPlayers: 0,
    totalBattles: 0,
    avgExecutionTime: 150,
    activeBattles: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemoMode = firebaseConfig.apiKey === 'demo-key';
    if (isDemoMode) {
      setStats({
        totalPlayers: 1420,
        totalBattles: 14892,
        avgExecutionTime: 84,
        activeBattles: 3
      });
      setLoading(false);
      return;
    }

    if (!db) return;

    const fetchStats = async () => {
      try {
        // Get total players
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalPlayers = usersSnapshot.size;

        // Get total battles and avg execution time
        let totalBattles = 0;
        let totalExecutionTime = 0;
        let battleCount = 0;

        const battlesSnapshot = await getDocs(collection(db, 'battles'));
        totalBattles = battlesSnapshot.size;

        battlesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.executionTime) {
            totalExecutionTime += data.executionTime;
            battleCount++;
          }
        });

        const avgExecutionTime = battleCount > 0 ? Math.round(totalExecutionTime / battleCount) : 150;

        // Get active battles (in-progress)
        const activeSnapshot = await getDocs(
          query(collection(db, 'battles'), where('status', '==', 'in-progress'))
        );
        const activeBattles = activeSnapshot.size;

        setStats({
          totalPlayers,
          totalBattles,
          avgExecutionTime,
          activeBattles
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [db]);

  return { stats, loading };
}
