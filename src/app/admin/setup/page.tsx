'use client';

import React, { useState } from 'react';
import { Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase/provider';
import { cn } from '@/lib/utils';

export default function AdminSetupPage() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSetup = async () => {
    if (!auth || !user) return;
    setStatus('loading');
    setMessage('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        setStatus('error');
        setMessage(`Server returned HTML instead of JSON. Status ${res.status}. Your Firebase Admin env vars (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) may be missing in Vercel.`);
        return;
      }
      if (res.ok) {
        setStatus('success');
        setMessage(`Account promoted to ${data.role}. You can now access the admin panel.`);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to set up admin account.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Network error.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md bg-card/50 border-border">
        <CardContent className="p-6 space-y-5">
          <div className="text-center space-y-2">
            <Shield className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-lg font-headline font-black uppercase tracking-tighter">Admin Setup</h1>
            <p className="text-xs text-muted-foreground">
              Claim the <strong className="text-primary">super_admin</strong> role for your account.
            </p>
          </div>

          {user && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-xs font-mono">
              <p><span className="text-muted-foreground">UID:</span> {user.uid}</p>
              <p><span className="text-muted-foreground">Email:</span> {user.email || '—'}</p>
              <p><span className="text-muted-foreground">Display:</span> {user.displayName || '—'}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-400">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{message}</p>
            </div>
          )}

          <Button
            className="w-full gap-2"
            onClick={handleSetup}
            disabled={!user || status === 'loading' || status === 'success'}
          >
            {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'loading' ? 'Promoting...' : status === 'success' ? 'Already Admin' : 'Make me super_admin'}
          </Button>

          {status === 'success' && (
            <p className="text-center text-[10px] text-muted-foreground">
              <a href="/admin/dashboard" className="text-primary hover:underline">Go to Dashboard →</a>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
