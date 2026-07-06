'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Flag, CheckCircle, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAuth } from 'firebase/auth';

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  reason: string;
  description: string;
  reportedBy: string;
  reportedByEmail: string;
  resolved: boolean;
  resolvedBy: string;
  resolution: string;
  createdAt: string;
  resolvedAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (filter === 'pending') params.set('resolved', 'false');
      else if (filter === 'resolved') params.set('resolved', 'true');

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
  }, [filter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleResolve = async (reportId: string, action: 'resolve' | 'dismiss') => {
    setActionLoading(reportId);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reportId, action, resolution: action === 'resolve' ? 'Accepted' : 'Dismissed' }),
      });

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, resolved: true, resolution: action === 'resolve' ? 'Accepted' : 'Dismissed' } : r));
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = reports.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.reason?.toLowerCase().includes(q) ||
      r.reportedBy?.toLowerCase().includes(q) ||
      r.targetLabel?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">User-generated content reports</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
          <Input
            placeholder="Search reports..."
            className="pl-8 h-8 text-xs"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="h-8 px-2 text-xs bg-background border border-border rounded"
        >
          <option value="all">All Reports</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
        <span className="text-[10px] text-muted-foreground">{filtered.length} reports</span>
      </div>

      <div className="rounded-lg border border-border divide-y divide-border">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-foreground/40" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <Flag className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No reports found</p>
          </div>
        ) : (
          filtered.map(report => (
            <div key={report.id} className="px-3 py-3 hover:bg-foreground/[0.02] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-foreground">{report.reason || 'No reason'}</span>
                    <Badge variant="outline" className={cn(
                      'text-[9px]',
                      report.resolved ? 'text-emerald-600 border-emerald-500/30' : 'text-amber-600 border-amber-500/30',
                    )}>
                      {report.resolved ? 'Resolved' : 'Pending'}
                    </Badge>
                  </div>
                  {report.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{report.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/60">
                    <span>by {report.reportedBy || report.reportedByEmail || 'Unknown'}</span>
                    <span>·</span>
                    <span>{report.targetType}: {report.targetLabel || report.targetId}</span>
                    <span>·</span>
                    <span>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
                {!report.resolved && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/5"
                      onClick={() => handleResolve(report.id, 'resolve')}
                      disabled={actionLoading === report.id}
                    >
                      {actionLoading === report.id ? '...' : 'Accept'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleResolve(report.id, 'dismiss')}
                      disabled={actionLoading === report.id}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
                {report.resolved && (
                  <span className="text-[10px] text-muted-foreground/40 shrink-0">{report.resolution}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
