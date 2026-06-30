"use client"
import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Matchmaking } from '@/components/arena/Matchmaking';
import { BattleArena } from '@/components/arena/BattleArenaMultiplayer';
import { useUser } from '@/firebase/auth/use-user';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit as fLimit } from 'firebase/firestore';

interface Opponent {
  id: string;
  username: string;
  rating: number;
  tier: string;
}

export default function ArenaPage() {
  const { user } = useUser();
  const [inBattle, setInBattle] = useState(false);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(true);

  // Reconnection: check for active battles on mount
  useEffect(() => {
    if (!user) {
      setReconnecting(false);
      return;
    }

    let cancelled = false;

    async function checkActiveBattle() {
      try {
        if (!user) { setReconnecting(false); return; }
        const { firestore: db } = initializeFirebase();
        if (!db) { setReconnecting(false); return; }

        // Check matchmaking - if matched, rejoin
        const matchDoc = doc(db, 'matchmaking', user.uid);
        const matchSnap = await getDoc(matchDoc);
        if (matchSnap.exists() && matchSnap.data().status === 'matched' && matchSnap.data().battleId) {
          const bid = matchSnap.data().battleId;
          const battleDoc = doc(db, 'battles', bid);
          const battleSnap = await getDoc(battleDoc);
          if (battleSnap.exists() && !battleSnap.data().finished) {
            const bd = battleSnap.data();
            const isPlayer1 = bd.player1?.uid === user.uid;
            const enemyData = isPlayer1 ? bd.player2 : bd.player1;
            if (!cancelled && enemyData) {
              setBattleId(bid);
              setOpponent({
                id: enemyData.uid,
                username: enemyData.username,
                rating: enemyData.rating,
                tier: enemyData.tier,
              });
              setInBattle(true);
              setReconnecting(false);
              return;
            }
          }
        }

        // Check for any in-progress battles where user is a player
        const battlesQuery = query(
          collection(db, 'battles'),
          where('finished', '==', false),
          fLimit(10)
        );
        const battleSnaps = await getDocs(battlesQuery);
        for (const bs of battleSnaps.docs) {
          const bd = bs.data();
          if (bd.player1?.uid === user.uid || bd.player2?.uid === user.uid) {
            const isPlayer1 = bd.player1?.uid === user.uid;
            const enemyData = isPlayer1 ? bd.player2 : bd.player1;
            if (!cancelled && enemyData) {
              setBattleId(bs.id);
              setOpponent({
                id: enemyData.uid,
                username: enemyData.username,
                rating: enemyData.rating,
                tier: enemyData.tier,
              });
              setInBattle(true);
              break;
            }
          }
        }
      } catch {
        // Reconnection failed, show matchmaking normally
      }
      if (!cancelled) setReconnecting(false);
    }

    checkActiveBattle();
    return () => { cancelled = true; };
  }, [user]);

  const handleMatchFound = (foundOpponent: Opponent, foundBattleId?: string) => {
    setOpponent(foundOpponent);
    if (foundBattleId) setBattleId(foundBattleId);
    setInBattle(true);
  };

  const handleBattleEnd = () => {
    setInBattle(false);
    setOpponent(null);
    setBattleId(null);
  };

  if (reconnecting) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Checking for active battles...</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {!inBattle ? (
        <Matchmaking onMatchFound={handleMatchFound} />
      ) : opponent && battleId ? (
        <BattleArena opponent={opponent} battleId={battleId} onBattleEnd={handleBattleEnd} />
      ) : null}
    </Shell>
  );
}
