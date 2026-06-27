'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Opponent {
  id: string;
  username: string;
  rating: number;
  tier: string;
}

export function useMatchmaking(userId: string | null, userRating: number, userTier: string) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [eloRange, setEloRange] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const startSearch = useCallback(async () => {
    if (!userId) return;
    
    setIsSearching(true);
    setSearchTime(0);
    setOpponent(null);
    setError(null);
  }, [userId]);

  const cancelSearch = useCallback(async () => {
    if (!userId) return;

    try {
      await fetch('/api/matchmaking/find-opponent', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      console.error('Cancel error:', err);
    }

    setIsSearching(false);
    setSearchTime(0);
    setOpponent(null);
  }, [userId]);

  // Main matchmaking loop
  useEffect(() => {
    if (!isSearching || !userId) return;

    let interval: NodeJS.Timeout | null = null;

    const attemptMatch = async () => {
      try {
        // Expand ELO range every 2 seconds
        if (searchTime > 0 && searchTime % 2 === 0) {
          setEloRange(prev => prev + 50);
        }

        const response = await fetch('/api/matchmaking/find-opponent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            rating: userRating,
            tier: userTier,
          }),
        });

        const data = await response.json();

        if (data.found && data.opponent) {
          setOpponent(data.opponent);
          setIsSearching(false);
          return;
        }

        if (data.error) {
          setError(data.error);
          setIsSearching(false);
        }
      } catch (err) {
        console.error('Matchmaking error:', err);
        setError('Connection error. Please try again.');
      }
    };

    // Try matchmaking immediately and every 2 seconds
    attemptMatch();
    interval = setInterval(attemptMatch, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSearching, userId, userRating, userTier, searchTime]);

  // Update search time
  useEffect(() => {
    if (!isSearching) return;

    const timer = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSearching]);

  return {
    isSearching,
    searchTime,
    opponent,
    eloRange,
    error,
    startSearch,
    cancelSearch,
  };
}
