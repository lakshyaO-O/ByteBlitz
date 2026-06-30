'use client';

import React, { useState } from 'react';
import { MatchReplay } from '@/components/replay/MatchReplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/premium/EmptyState';
import { Video, Search, Loader2 } from 'lucide-react';

export default function ReplayPage() {
  const [matchId, setMatchId] = useState('');
  const [loadedMatchId, setLoadedMatchId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoad = () => {
    if (!matchId.trim()) return;
    setLoading(true);
    setLoadedMatchId(matchId.trim());
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Video className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-headline font-bold">Match Replays</h1>
      </div>

      <Card className="bg-card/50 border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Enter Match ID to replay..."
              value={matchId}
              onChange={e => setMatchId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoad()}
              className="flex-1"
            />
            <Button onClick={handleLoad} disabled={loading || !matchId.trim()} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Load Replay
            </Button>
          </div>
        </CardContent>
      </Card>

      {loadedMatchId ? (
        <MatchReplay matchId={loadedMatchId} />
      ) : (
        <EmptyState
          icon={Video}
          title="No Replay Loaded"
          description="Enter a match ID above to watch a replay of a completed Arena match."
        />
      )}
    </div>
  );
}
