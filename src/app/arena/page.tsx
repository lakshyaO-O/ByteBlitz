"use client"
import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Matchmaking } from '@/components/arena/Matchmaking';
import { BattleArena } from '@/components/arena/BattleArenaMultiplayer';

interface Opponent {
  id: string;
  username: string;
  rating: number;
  tier: string;
}

export default function ArenaPage() {
  const [inBattle, setInBattle] = useState(false);
  const [opponent, setOpponent] = useState<Opponent | null>(null);

  const handleMatchFound = (foundOpponent: Opponent) => {
    setOpponent(foundOpponent);
    setInBattle(true);
  };

  const handleBattleEnd = () => {
    setInBattle(false);
    setOpponent(null);
  };

  return (
    <Shell>
      {!inBattle ? (
        <Matchmaking onMatchFound={handleMatchFound} />
      ) : opponent ? (
        <BattleArena opponent={opponent} onBattleEnd={handleBattleEnd} />
      ) : null}
    </Shell>
  );
}
