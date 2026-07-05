'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFeatureFlags, updateFeatureFlags, getPlatformSettings, updatePlatformSettings } from '@/services/admin';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFeatureFlags(), getPlatformSettings()]).then(([f, s]) => {
      setFlags(f as Record<string, boolean>);
      setSettings(s as Record<string, string>);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleFlagToggle = async (key: string, value: boolean) => {
    const updated = { ...flags, [key]: value };
    setFlags(updated);
    try {
      await updateFeatureFlags(updated);
      toast({ title: 'Feature flag updated' });
    } catch { toast({ variant: 'destructive', title: 'Failed to update' }); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-headline font-black uppercase tracking-tighter">Platform Settings</h2>
      </div>

      <Card className="bg-card/50 border-border">
        <CardHeader><CardTitle className="text-sm">Feature Flags</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(flags).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm font-mono">{key}</span>
              <Switch checked={value} onCheckedChange={(v: boolean) => handleFlagToggle(key, v)} />
            </div>
          ))}
          {Object.keys(flags).length === 0 && <p className="text-sm text-muted-foreground">No feature flags configured.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
