'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAdminChallenges, setDailyChallenge, setWeeklyChallenge } from '@/services/admin';
import { Loader2 } from 'lucide-react';

export default function AdminChallengesPage() {
  const { toast } = useToast();
  const [daily, setDaily] = useState<{ date: string; problemId: string; xpBonus: number }>({ date: '', problemId: '', xpBonus: 50 });
  const [weekly, setWeekly] = useState<{ week: string; problemIds: string; xpBonus: number }>({ week: '', problemIds: '', xpBonus: 200 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminChallenges().then(data => {
      if (data.daily?.challenges?.length > 0) {
        const last = data.daily!.challenges[data.daily!.challenges.length - 1];
        setDaily({ date: last.date || '', problemId: last.problemId || '', xpBonus: last.xpBonus || 50 });
      }
      if (data.weekly) {
        setWeekly({ week: data.weekly.week || '', problemIds: (data.weekly.problemIds || []).join(', '), xpBonus: data.weekly.xpBonus || 200 });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSaveDaily = async () => {
    if (!daily.date || !daily.problemId) return;
    setSaving(true);
    try {
      await setDailyChallenge(daily);
      toast({ title: 'Daily challenge saved' });
    } catch { toast({ variant: 'destructive', title: 'Failed to save' }); }
    setSaving(false);
  };

  const handleSaveWeekly = async () => {
    if (!weekly.week || !weekly.problemIds) return;
    setSaving(true);
    try {
      await setWeeklyChallenge({ week: weekly.week, problemIds: weekly.problemIds.split(',').map(s => s.trim()), xpBonus: weekly.xpBonus });
      toast({ title: 'Weekly challenge saved' });
    } catch { toast({ variant: 'destructive', title: 'Failed to save' }); }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-headline font-black uppercase tracking-tighter">Challenge Management</h2>
      </div>

      <Card className="bg-card/50 border-border">
        <CardHeader><CardTitle className="text-sm">Daily Challenge</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Date</Label>
            <Input value={daily.date} onChange={e => setDaily(p => ({ ...p, date: e.target.value }))} placeholder="YYYY-MM-DD" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Problem ID</Label>
            <Input value={daily.problemId} onChange={e => setDaily(p => ({ ...p, problemId: e.target.value }))} placeholder="Problem document ID" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">XP Bonus</Label>
            <Input type="number" value={daily.xpBonus} onChange={e => setDaily(p => ({ ...p, xpBonus: parseInt(e.target.value) || 0 }))} />
          </div>
          <Button onClick={handleSaveDaily} disabled={saving}>{saving ? 'Saving...' : 'Save Daily Challenge'}</Button>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border">
        <CardHeader><CardTitle className="text-sm">Weekly Challenge</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Week</Label>
            <Input value={weekly.week} onChange={e => setWeekly(p => ({ ...p, week: e.target.value }))} placeholder="YYYY-Wxx" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Problem IDs (comma separated)</Label>
            <Input value={weekly.problemIds} onChange={e => setWeekly(p => ({ ...p, problemIds: e.target.value }))} placeholder="id1, id2, id3" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">XP Bonus</Label>
            <Input type="number" value={weekly.xpBonus} onChange={e => setWeekly(p => ({ ...p, xpBonus: parseInt(e.target.value) || 0 }))} />
          </div>
          <Button onClick={handleSaveWeekly} disabled={saving}>{saving ? 'Saving...' : 'Save Weekly Challenge'}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
