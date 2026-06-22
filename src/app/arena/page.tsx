"use client"
import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Matchmaking } from '@/components/arena/Matchmaking';
import { BattleArena } from '@/components/arena/BattleArena';

export default function ArenaPage() {
  const [inBattle, setInBattle] = useState(false);

  return (
    <Shell>
      {!inBattle ? (
        <Matchmaking onMatchFound={() => setInBattle(true)} />
      ) : (
        <BattleArena />
      )}
    </Shell>
  );
}
