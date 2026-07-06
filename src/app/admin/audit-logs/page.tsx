'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Search, X, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchAuditLogs } from '@/services/admin';
import type { AuditLog } from '@/types/admin';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-destructive border-destructive/30 bg-destructive/10',
  warning: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  info: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
};

const SEVERITY_ICONS: Record<string, any> = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
};

const ACTION_LABELS: Record<string, string> = {
  'user.role.change': 'Role Change',
  'user.ban': 'User Banned',
  'user.unban': 'User Unbanned',
  'user.delete': 'User Deleted',
  'user.update': 'User Updated',
  'problem.create': 'Problem Created',
  'problem.update': 'Problem Updated',
  'problem.delete': 'Problem Deleted',
  'problem.publish': 'Problem Published',
  'problem.unpublish': 'Problem Unpublished',
  'shop.create': 'Shop Item Created',
  'shop.update': 'Shop Item Updated',
  'shop.delete': 'Shop Item Deleted',
  'challenge.set': 'Challenge Set',
  'settings.update': 'Settings Updated',
  'moderation.action': 'Moderation Action',
  'community.delete': 'Content Deleted',
  'announcement.create': 'Announcement Created',
  'admin.promote': 'Admin Promoted',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const [error, setError] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (severityFilter !== 'all') params.severity = severityFilter;
      if (targetFilter !== 'all') params.targetType = targetFilter;
      const result = await fetchAuditLogs(params);
      setLogs(result.logs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [severityFilter, targetFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.performedByEmail?.toLowerCase().includes(q) ||
      log.targetLabel?.toLowerCase().includes(q) ||
      log.targetId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-headline font-black uppercase tracking-tighter">Audit Logs</h2>
          <p className="text-[10px] text-muted-foreground font-mono">Immutable record of all admin actions</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search actions, emails, targets..."
            className="pl-8 h-8 text-xs bg-muted/50 border-border"
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
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
          className="h-8 px-2 text-xs bg-muted/50 border border-border rounded font-mono"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={targetFilter}
          onChange={e => setTargetFilter(e.target.value)}
          className="h-8 px-2 text-xs bg-muted/50 border border-border rounded font-mono"
        >
          <option value="all">All Targets</option>
          <option value="user">User</option>
          <option value="problem">Problem</option>
          <option value="shop_item">Shop</option>
          <option value="challenge">Challenge</option>
          <option value="setting">Setting</option>
          <option value="community">Community</option>
          <option value="moderation">Moderation</option>
        </select>
        <span className="text-[10px] text-muted-foreground font-mono">{filtered.length} entries</span>
      </div>

      <Card className="bg-card/50 border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center">
              <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No audit log entries found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filtered.map(log => {
                const SeverityIcon = SEVERITY_ICONS[log.severity] || Info;
                const sevColor = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.info;
                return (
                  <div key={log.id} className="p-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn('p-1.5 rounded-full border', sevColor)}>
                        <SeverityIcon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-headline">
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                          <Badge variant="outline" className={cn('text-[8px] font-mono', sevColor)}>
                            {log.severity}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground space-x-1">
                          <span className="font-medium">{log.performedByEmail || log.performedBy}</span>
                          <span>→</span>
                          <span>{log.targetLabel || log.targetId}</span>
                          <span className="text-[8px] uppercase">({log.targetType})</span>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="mt-1 text-[9px] font-mono text-muted-foreground/60">
                            {JSON.stringify(log.details).slice(0, 200)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
