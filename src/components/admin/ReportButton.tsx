'use client';

import React, { useState } from 'react';
import { Flag, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getAuth } from 'firebase/auth';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'plagiarism', label: 'Plagiarism' },
  { value: 'cheating', label: 'Cheating / Exploit' },
  { value: 'other', label: 'Other' },
];

interface ReportButtonProps {
  targetType: 'user' | 'post' | 'comment' | 'code';
  targetId: string;
  targetLabel?: string;
  variant?: 'icon' | 'text' | 'full';
  className?: string;
}

export function ReportButton({ targetType, targetId, targetLabel, variant = 'icon', className }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    setStatus('idle');
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetType, targetId, targetLabel: targetLabel || '', reason, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      setStatus('success');
      setTimeout(() => { setOpen(false); setStatus('idle'); setReason(''); setDescription(''); }, 1500);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const trigger = variant === 'icon' ? (
    <button className={cn('p-1 rounded hover:bg-foreground/[0.04] text-muted-foreground/40 hover:text-foreground/60 transition-colors', className)} title="Report">
      <Flag className="w-3.5 h-3.5" />
    </button>
  ) : variant === 'text' ? (
    <button className={cn('text-xs text-muted-foreground/40 hover:text-foreground/60 transition-colors flex items-center gap-1', className)}>
      <Flag className="w-3 h-3" /> Report
    </button>
  ) : (
    <Button variant="ghost" size="sm" className={cn('text-xs gap-1', className)}>
      <Flag className="w-3 h-3" /> Report
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setStatus('idle'); setReason(''); setDescription(''); } setOpen(o); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-headline font-black flex items-center gap-2">
            <Flag className="w-4 h-4 text-destructive" />
            Report {targetType}
          </DialogTitle>
        </DialogHeader>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <p className="text-sm font-medium">Report submitted</p>
            <p className="text-xs text-muted-foreground">Our moderation team will review it.</p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Reason</Label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full mt-1 h-9 px-2 text-xs bg-background border border-border rounded font-mono"
              >
                <option value="">Select a reason...</option>
                {REPORT_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Additional details (optional)</Label>
              <Textarea
                className="text-xs mt-1"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide any additional context..."
                rows={3}
              />
            </div>
            {targetLabel && (
              <p className="text-[10px] text-muted-foreground">
                Reporting: <span className="font-medium text-foreground/60">{targetLabel}</span>
              </p>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-1.5 text-[11px] text-destructive bg-destructive/5 px-2 py-1.5 rounded">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {errorMsg}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs h-8">Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={!reason || submitting} className="text-xs h-8 gap-1">
                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
