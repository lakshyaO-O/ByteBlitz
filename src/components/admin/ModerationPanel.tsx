'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Loader2, Flag, CheckCircle, XCircle, Search, AlertTriangle,
  Shield, Ban, VolumeX, Trash2, MessageSquareWarning, ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAuth } from 'firebase/auth';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  reporterId: string;
  reporterEmail: string;
  reason: string;
  description: string;
  status: string;
  reportCount: number;
  resolvedBy: string;
  resolvedByEmail: string;
  resolutionNote: string;
  actionTaken: string;
  createdAt: string;
  lastReportedAt: string;
  resolvedAt: string;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type TargetFilter = 'all' | 'user' | 'post' | 'comment' | 'code';
type SortMode = 'newest' | 'mostReported' | 'highPriority';

interface ConfirmAction {
  report: Report;
  action: string;
}

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const TARGET_TYPES: { key: TargetFilter; label: string }[] = [
  { key: 'all', label: 'All Types' },
  { key: 'user', label: 'Users' },
  { key: 'post', label: 'Posts' },
  { key: 'comment', label: 'Comments' },
  { key: 'code', label: 'Code' },
];

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'mostReported', label: 'Most Reported' },
  { key: 'highPriority', label: 'High Priority' },
];

const TARGET_LABELS: Record<string, string> = {
  user: 'User',
  post: 'Post',
  comment: 'Comment',
  code: 'Code Share',
};

const TARGET_COLORS: Record<string, string> = {
  user: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  post: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
  comment: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  code: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

export function ModerationPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [targetFilter, setTargetFilter] = useState<TargetFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [warnReason, setWarnReason] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (targetFilter !== 'all') params.set('targetType', targetFilter);
      params.set('sort', sortMode);

      const res = await fetch(`/api/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, targetFilter, sortMode]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleAction = async () => {
    if (!confirmAction) return;
    const { report, action } = confirmAction;
    setActionLoading(report.id);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const body: Record<string, unknown> = { reportId: report.id, action };
      if (action === 'warn') body.reason = warnReason;
      else if (action === 'mute' || action === 'ban') body.reason = warnReason;

      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== report.id));
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
      setWarnReason('');
    }
  };

  const getConfirmConfig = (report: Report, action: string) => {
    const targetLabel = report.targetLabel || report.targetId;
    switch (action) {
      case 'approve':
        return {
          title: 'Approve Report',
          description: `Mark this report against "${targetLabel}" as valid and resolved.`,
          variant: 'default' as const,
          confirmLabel: 'Approve',
        };
      case 'reject':
        return {
          title: 'Reject Report',
          description: `Dismiss this report against "${targetLabel}" as invalid.`,
          variant: 'default' as const,
          confirmLabel: 'Reject',
        };
      case 'delete':
        return {
          title: 'Delete Content',
          description: `Permanently delete the reported ${report.targetType} "${targetLabel}". This action cannot be undone.`,
          variant: 'destructive' as const,
          confirmLabel: 'Delete',
        };
      case 'warn':
        return {
          title: 'Warn User',
          description: `Send a warning to the user behind "${targetLabel}". This will be logged.`,
          variant: 'warning' as const,
          confirmLabel: 'Send Warning',
        };
      case 'mute':
        return {
          title: 'Mute User',
          description: `Mute the user "${targetLabel}". They will be unable to post or comment until unmuted.`,
          variant: 'destructive' as const,
          confirmLabel: 'Mute',
        };
      case 'ban':
        return {
          title: 'Ban User',
          description: `Permanently ban the user "${targetLabel}". They will lose access to the platform.`,
          variant: 'destructive' as const,
          confirmLabel: 'Ban',
        };
      default:
        return { title: 'Confirm', description: 'Are you sure?', variant: 'default' as const, confirmLabel: 'Confirm' };
    }
  };

  const needsReason = (action: string) => action === 'warn' || action === 'mute' || action === 'ban';

  const filtered = reports.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.reason?.toLowerCase().includes(q) ||
      r.reporterEmail?.toLowerCase().includes(q) ||
      r.targetLabel?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-headline font-black uppercase tracking-tighter">Moderation</h2>
          <p className="text-[10px] text-muted-foreground font-mono">Reported content & user moderation</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-0.5 bg-muted/30 border border-border rounded-lg p-0.5 w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              statusFilter === tab.key
                ? 'bg-background text-foreground shadow-sm border border-border/50'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Search reports..."
            className="pl-8 h-8 text-xs bg-muted/30 border-border"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <XCircle className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {TARGET_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setTargetFilter(t.key)}
              className={cn(
                'px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors',
                targetFilter === t.key
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={sortMode}
          onChange={e => setSortMode(e.target.value as SortMode)}
          className="h-8 px-2 text-[10px] bg-background border border-border rounded-md text-muted-foreground"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>

        <span className="text-[10px] text-muted-foreground font-mono">{filtered.length} reports</span>
      </div>

      {/* Reports List */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center">
              <Flag className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No {statusFilter !== 'all' ? statusFilter : ''} reports found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filtered.map(report => {
                const config = getConfirmConfig(report, 'approve');
                const isHighReportCount = report.reportCount >= 3;
                return (
                  <div key={report.id} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Target & Status badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={cn('text-[9px] font-mono px-1.5 py-0', TARGET_COLORS[report.targetType] || '')}>
                            {TARGET_LABELS[report.targetType] || report.targetType}
                          </Badge>
                          {isHighReportCount && (
                            <Badge variant="outline" className="text-[9px] text-red-500 border-red-500/30 bg-red-500/5 px-1.5 py-0">
                              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                              {report.reportCount}x
                            </Badge>
                          )}
                          <Badge variant="outline" className={cn(
                            'text-[9px] px-1.5 py-0',
                            report.status === 'pending' && 'text-amber-600 border-amber-500/30 bg-amber-500/5',
                            report.status === 'approved' && 'text-emerald-600 border-emerald-500/30 bg-emerald-500/5',
                            report.status === 'rejected' && 'text-muted-foreground border-border/50 bg-muted/20',
                          )}>
                            {report.status === 'pending' && <Flag className="w-2 h-2 mr-0.5" />}
                            {report.status === 'approved' && <CheckCircle className="w-2 h-2 mr-0.5" />}
                            {report.status === 'rejected' && <XCircle className="w-2 h-2 mr-0.5" />}
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </Badge>
                          {report.actionTaken && report.actionTaken !== 'none' && (
                            <Badge variant="outline" className="text-[9px] text-rose-500 border-rose-500/30 bg-rose-500/5 px-1.5 py-0">
                              {report.actionTaken}
                            </Badge>
                          )}
                        </div>

                        {/* Target Label */}
                        <p className="text-xs font-bold font-headline truncate">
                          {report.targetLabel || report.targetId}
                        </p>

                        {/* Reason & Description */}
                        <p className="text-[11px] font-medium text-foreground/80">{report.reason}</p>
                        {report.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2">{report.description}</p>
                        )}

                        {/* Meta info */}
                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60">
                          <span>by {report.reporterEmail || report.reporterId || 'Unknown'}</span>
                          <span>·</span>
                          <span>{report.reportCount} report{report.reportCount !== 1 ? 's' : ''}</span>
                          {report.lastReportedAt && (
                            <>
                              <span>·</span>
                              <span>{new Date(report.lastReportedAt).toLocaleDateString()}</span>
                              <span className="text-[8px]">{new Date(report.lastReportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </>
                          )}
                        </div>

                        {/* Resolution info */}
                        {report.status !== 'pending' && (
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60">
                            <span>Resolved by {report.resolvedByEmail || report.resolvedBy}</span>
                            {report.resolvedAt && <span>· {new Date(report.resolvedAt).toLocaleDateString()}</span>}
                            {report.resolutionNote && <span>· Note: {report.resolutionNote}</span>}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {report.status === 'pending' && (
                        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                          <button
                            onClick={() => setConfirmAction({ report, action: 'approve' })}
                            disabled={actionLoading === report.id}
                            className="px-2 py-1 text-[10px] font-medium text-emerald-600 hover:bg-emerald-500/5 rounded-md transition-colors disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setConfirmAction({ report, action: 'reject' })}
                            disabled={actionLoading === report.id}
                            className="px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-md transition-colors disabled:opacity-60"
                          >
                            Reject
                          </button>
                          <div className="relative group">
                            <button
                              disabled={actionLoading === report.id}
                              className="px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-md transition-colors disabled:opacity-60 flex items-center gap-0.5"
                            >
                              Actions
                              <ChevronDown className="w-2.5 h-2.5" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              <button
                                onClick={() => setConfirmAction({ report, action: 'delete' })}
                                className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-rose-500 hover:bg-rose-500/5 w-full text-left"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete Content
                              </button>
                              <button
                                onClick={() => setConfirmAction({ report, action: 'warn' })}
                                className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-amber-500 hover:bg-amber-500/5 w-full text-left"
                              >
                                <MessageSquareWarning className="w-3 h-3" />
                                Warn User
                              </button>
                              <button
                                onClick={() => setConfirmAction({ report, action: 'mute' })}
                                className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-orange-500 hover:bg-orange-500/5 w-full text-left"
                              >
                                <VolumeX className="w-3 h-3" />
                                Mute
                              </button>
                              <button
                                onClick={() => setConfirmAction({ report, action: 'ban' })}
                                className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-600 hover:bg-red-500/5 w-full text-left"
                              >
                                <Ban className="w-3 h-3" />
                                Ban
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Spam Indicator */}
      {!loading && filtered.filter(r => r.reportCount >= 3 && r.status === 'pending').length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-[10px] text-amber-600/80">
            <strong>{filtered.filter(r => r.reportCount >= 3 && r.status === 'pending').length}</strong> report{filtered.filter(r => r.reportCount >= 3 && r.status === 'pending').length !== 1 ? 's have' : ' has'} been reported 3+ times — potential spam detected.
          </p>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => { if (!open) { setConfirmAction(null); setWarnReason(''); } }}
          {...getConfirmConfig(confirmAction.report, confirmAction.action)}
          onConfirm={handleAction}
          loading={actionLoading === confirmAction.report.id}
        >
          {needsReason(confirmAction.action) && (
            <div className="px-6 pb-4">
              <textarea
                placeholder={
                  confirmAction.action === 'warn' ? 'Warning reason...'
                  : confirmAction.action === 'mute' ? 'Mute reason...'
                  : 'Ban reason...'
                }
                value={warnReason}
                onChange={e => setWarnReason(e.target.value)}
                className="w-full min-h-[60px] text-xs bg-muted/30 border border-border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground/60"
              />
            </div>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
