'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Loader2, RefreshCw, Save, ToggleLeft, Cpu, Brain, Shield,
  AlertTriangle, Gauge, Globe, Bell, Skull, Eye, EyeOff, CheckCircle, XCircle,
  Key, ScrollText, Users, Lock, Unlock, Plus, Trash2, Pencil,
  Search, Terminal, Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAuth } from 'firebase/auth';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { AdminRole, AdminPermission, AuditLog } from '@/types/admin';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

type SettingsTab =
  | 'roles' | 'permissions' | 'judge' | 'flags' | 'maintenance'
  | 'ai' | 'rates' | 'env' | 'apiKeys' | 'notifications'
  | 'systemLogs' | 'auditLogs' | 'danger';

const TABS: { key: SettingsTab; label: string; icon: any }[] = [
  { key: 'roles', label: 'Roles', icon: Shield },
  { key: 'permissions', label: 'Permissions', icon: Lock },
  { key: 'judge', label: 'Judge Config', icon: Cpu },
  { key: 'flags', label: 'Feature Flags', icon: ToggleLeft },
  { key: 'maintenance', label: 'Maintenance', icon: AlertTriangle },
  { key: 'ai', label: 'AI Config', icon: Brain },
  { key: 'rates', label: 'Rate Limits', icon: Gauge },
  { key: 'env', label: 'Environment', icon: Globe },
  { key: 'apiKeys', label: 'API Keys', icon: Key },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'systemLogs', label: 'System Logs', icon: Terminal },
  { key: 'auditLogs', label: 'Audit Logs', icon: ScrollText },
  { key: 'danger', label: 'Danger Zone', icon: Skull },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Admin', moderator: 'Moderator', support: 'Support', user: 'User',
};

const PERMISSION_GROUPS: Record<string, AdminPermission[]> = {
  Users: ['users.read', 'users.write', 'users.ban', 'users.mute', 'users.delete', 'users.role', 'users.password', 'users.session'],
  Problems: ['problems.read', 'problems.write', 'problems.delete', 'problems.publish'],
  Shop: ['shop.read', 'shop.write', 'shop.delete'],
  Challenges: ['challenges.read', 'challenges.write'],
  Settings: ['settings.read', 'settings.write'],
  Analytics: ['analytics.read'],
  Moderation: ['moderation.read', 'moderation.write', 'moderation.delete'],
  Community: ['community.read', 'community.write', 'community.delete'],
  Audit: ['audit.read'],
  Admin: ['admin.manage'],
};

const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flat();

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-destructive border-destructive/30 bg-destructive/10',
  warning: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  info: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
};

export function SystemSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('roles');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [judge, setJudge] = useState<Record<string, any>>({});
  const [maintenance, setMaintenance] = useState<Record<string, any>>({});
  const [rates, setRates] = useState<Record<string, any>>({});
  const [notifications, setNotifications] = useState<Record<string, any>>({});
  const [aiConfig, setAiConfig] = useState<Record<string, any>>({});
  const [environment, setEnvironment] = useState<Record<string, string>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [roleNameInput, setRoleNameInput] = useState('');
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const [configRes, envRes] = await Promise.all([
        fetch('/api/admin/settings?section=all', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/settings?section=environment', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/settings?section=apiKeys', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (configRes.ok) {
        const result = await configRes.json();
        setFlags(result.featureFlags || {});
        setJudge(result.judge || { pistonUrl: '', judge0Url: '', rateLimit: 10, defaultTimeLimitMs: 2000, defaultMemoryLimitKb: 256000 });
        setMaintenance(result.maintenance || { enabled: false, message: '' });
        setRates(result.rateLimits || { judge: 10, api: 100 });
        setNotifications(result.notifications || { email: true, push: true, inApp: true });
        setAiConfig(result.aiQuotas || {});
        setRolePermissions(result.roles || {});
      }

      if (envRes.ok) {
        const envData = await envRes.json();
        setEnvironment(envData.environment || {});
      }

      if (envRes.ok) {
        const keysRes = await envRes.json();
        if (keysRes.apiKeys) setApiKeys(keysRes.apiKeys);
      }
    } catch {}
    setLoading(false);
    setDirty(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveSection = async (section: string, formData: any) => {
    setSaving(section);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast({ variant: 'destructive', title: 'Not authenticated' });
        return;
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ section, data: formData }),
      });

      if (res.ok) {
        setDirty(false);
        toast({ title: 'Settings saved', description: `${section} configuration updated successfully` });
      } else {
        const err = await res.json();
        toast({ variant: 'destructive', title: 'Save failed', description: err.error || 'Could not save settings' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Network error while saving settings' });
    }
    setSaving(null);
  };

  const fetchAuditEntries = useCallback(async () => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch('/api/admin/audit-logs?limit=10', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch {}
  }, []);

  const fetchSystemLogs = useCallback(async () => {
    setFetchingLogs(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch('/api/admin/system-logs?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSystemLogs(data.logs || []);
      }
    } catch {}
    setFetchingLogs(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'systemLogs') fetchSystemLogs();
    if (activeTab === 'auditLogs') fetchAuditEntries();
  }, [activeTab, fetchSystemLogs, fetchAuditEntries]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  }

  const saveAndAudit = async (section: string, formData: any) => {
    await saveSection(section, formData);
    if (activeTab === 'auditLogs') fetchAuditEntries();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-headline font-black uppercase tracking-tighter">System Settings</h2>
          <span className="text-[10px] text-muted-foreground font-mono">Platform configuration</span>
        </div>
        <button onClick={fetchAll} className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-0.5 border-b border-border overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
              activeTab === tab.key
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl">
        {activeTab === 'roles' && renderRoles()}
        {activeTab === 'permissions' && renderPermissions()}
        {activeTab === 'judge' && renderJudge()}
        {activeTab === 'flags' && renderFlags()}
        {activeTab === 'maintenance' && renderMaintenance()}
        {activeTab === 'ai' && renderAI()}
        {activeTab === 'rates' && renderRates()}
        {activeTab === 'env' && renderEnv()}
        {activeTab === 'apiKeys' && renderApiKeys()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'systemLogs' && renderSystemLogs()}
        {activeTab === 'auditLogs' && renderAuditLogs()}
        {activeTab === 'danger' && renderDanger()}
      </div>

      <ConfirmDialog
        open={confirmAction === 'resetAi'}
        onOpenChange={v => { if (!v) setConfirmAction(null); }}
        title="Reset AI Usage Counters"
        description="Reset AI usage counters for all users? They will regain their full daily/monthly limits. This action is logged."
        confirmLabel="Reset All"
        variant="destructive"
        onConfirm={async () => {
          const auth = getAuth();
          const token = await auth.currentUser?.getIdToken();
          if (token) {
            const res = await fetch('/api/admin/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ section: 'danger', data: { _action: 'resetAiUsage' } }),
            });
            if (res.ok) toast({ title: 'AI usage counters reset', description: 'All users have regained their full limits' });
            else toast({ variant: 'destructive', title: 'Failed', description: 'Could not reset AI usage' });
          }
          setConfirmAction(null);
        }}
      />
      <ConfirmDialog
        open={confirmAction === 'clearAudit'}
        onOpenChange={v => { if (!v) setConfirmAction(null); }}
        title="Clear Audit Logs"
        description="Permanently delete all audit log entries? This cannot be undone and will be logged."
        confirmLabel="Delete All"
        variant="destructive"
        onConfirm={async () => {
          const auth = getAuth();
          const token = await auth.currentUser?.getIdToken();
          if (token) {
            const res = await fetch('/api/admin/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ section: 'danger', data: { _action: 'clearAuditLogs' } }),
            });
            if (res.ok) toast({ title: 'Audit logs cleared', description: 'All audit log entries have been permanently deleted' });
            else toast({ variant: 'destructive', title: 'Failed', description: 'Could not clear audit logs' });
          }
          setConfirmAction(null);
        }}
      />
      <ConfirmDialog
        open={confirmAction === 'resetSettings'}
        onOpenChange={v => { if (!v) setConfirmAction(null); }}
        title="Reset All Settings"
        description="Revert all platform settings to defaults? This will clear feature flags, rates, and all config sections."
        confirmLabel="Reset All"
        variant="destructive"
        onConfirm={async () => {
          const auth = getAuth();
          const token = await auth.currentUser?.getIdToken();
          if (token) {
            const res = await fetch('/api/admin/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ section: 'danger', data: { _action: 'resetAllSettings' } }),
            });
            if (res.ok) toast({ title: 'Settings reset', description: 'All platform settings reverted to defaults' });
            else toast({ variant: 'destructive', title: 'Failed', description: 'Could not reset settings' });
          }
          setConfirmAction(null);
        }}
      />
      <ConfirmDialog
        open={confirmAction === 'regenerateKeys'}
        onOpenChange={v => { if (!v) setConfirmAction(null); }}
        title="Regenerate API Keys"
        description="This will invalidate all existing API keys. Services using these keys will stop working until updated. This action is irreversible."
        confirmLabel="Regenerate All"
        variant="destructive"
        onConfirm={async () => {
          const auth = getAuth();
          const token = await auth.currentUser?.getIdToken();
          if (token) {
            const res = await fetch('/api/admin/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ section: 'apiKeys', data: { _action: 'regenerateAll' } }),
            });
            if (res.ok) toast({ title: 'API keys regenerated', description: 'All existing keys have been invalidated' });
            else toast({ variant: 'destructive', title: 'Failed', description: 'Could not regenerate keys' });
          }
          setConfirmAction(null);
        }}
      />
    </div>
  );

  function renderFlags() {
    const items = [
      { key: 'premium_editor', label: 'Premium Code Editor', desc: 'Enhanced code editor with themes and AI' },
      { key: 'analytics_dashboard', label: 'Analytics Dashboard', desc: 'Enable the admin analytics page' },
      { key: 'spectator_mode', label: 'Spectator Mode', desc: 'Allow spectating live arena battles' },
      { key: 'ai_code_review', label: 'AI Code Review', desc: 'AI-powered code review feature' },
      { key: 'daily_login_rewards', label: 'Daily Login Rewards', desc: 'Daily login streak rewards' },
      { key: 'activity_feed', label: 'Activity Feed', desc: 'User activity feed on dashboard' },
      { key: 'chat', label: 'Chat System', desc: 'Enable real-time messaging between users' },
      { key: 'community', label: 'Community Features', desc: 'Posts, comments, and social features' },
      { key: 'hackathons', label: 'Hackathons', desc: 'Hackathon hosting and participation' },
      { key: 'leaderboard', label: 'Leaderboard', desc: 'Global and weekly leaderboards' },
    ];

    return (
      <Section title="Feature Flags" desc="Toggle platform features on and off. Every change is logged.">
        <div className="space-y-0.5">
          {items.map(item => (
            <div key={item.key} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
              <div>
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={flags[item.key] ?? false}
                  onChange={e => {
                    setFlags(prev => ({ ...prev, [item.key]: e.target.checked }));
                    setDirty(true);
                  }}
                />
                <div className="w-8 h-4.5 bg-muted rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-background after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={() => saveAndAudit('featureFlags', flags)} disabled={saving === 'featureFlags' || !dirty} className="h-7 text-[10px] gap-1">
            <Save className="w-3 h-3" /> {saving === 'featureFlags' ? 'Saving...' : dirty ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      </Section>
    );
  }

  function renderJudge() {
    return (
      <Section title="Judge Configuration" desc="Code execution engine settings. Changes are logged as warnings.">
        <div className="space-y-3">
          <Field label="Piston API URL" desc="Self-hosted Piston execution endpoint">
            <Input className="h-8 text-xs font-mono" value={judge.pistonUrl || ''} onChange={e => { setJudge(prev => ({ ...prev, pistonUrl: e.target.value })); setDirty(true); }} placeholder="https://piston.example.com" />
          </Field>
          <Field label="Judge0 API URL" desc="Self-hosted Judge0 CE endpoint">
            <Input className="h-8 text-xs font-mono" value={judge.judge0Url || ''} onChange={e => { setJudge(prev => ({ ...prev, judge0Url: e.target.value })); setDirty(true); }} placeholder="https://judge0.example.com" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Default Time Limit (ms)">
              <Input className="h-8 text-xs font-mono" type="number" value={judge.defaultTimeLimitMs ?? 2000} onChange={e => { setJudge(prev => ({ ...prev, defaultTimeLimitMs: parseInt(e.target.value) || 2000 })); setDirty(true); }} />
            </Field>
            <Field label="Default Memory Limit (KB)">
              <Input className="h-8 text-xs font-mono" type="number" value={judge.defaultMemoryLimitKb ?? 256000} onChange={e => { setJudge(prev => ({ ...prev, defaultMemoryLimitKb: parseInt(e.target.value) || 256000 })); setDirty(true); }} />
            </Field>
            <Field label="Rate Limit (req/60s)">
              <Input className="h-8 text-xs font-mono" type="number" value={judge.rateLimit ?? 10} onChange={e => { setJudge(prev => ({ ...prev, rateLimit: parseInt(e.target.value) || 10 })); setDirty(true); }} />
            </Field>
          </div>
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={() => saveAndAudit('judge', judge)} disabled={saving === 'judge'} className="h-7 text-[10px] gap-1">
            <Save className="w-3 h-3" /> {saving === 'judge' ? 'Saving...' : 'Save Judge Config'}
          </Button>
        </div>
      </Section>
    );
  }

  function renderAI() {
    const features = [
      'aiMentor', 'aiDebugger', 'aiCodeReview', 'aiHints',
      'aiEditorial', 'aiInterviewer', 'resumeReview', 'roadmapGenerator',
    ];
    const tiers = ['free', 'pro', 'elite'];
    const labels: Record<string, string> = {
      aiMentor: 'AI Mentor', aiDebugger: 'AI Debugger', aiCodeReview: 'Code Review',
      aiHints: 'AI Hints', aiEditorial: 'AI Editorial', aiInterviewer: 'AI Interviewer',
      resumeReview: 'Resume Review', roadmapGenerator: 'Roadmap Generator',
    };

    return (
      <Section title="AI Configuration" desc="Per-feature usage limits by subscription tier (null = unlimited). Changes are logged.">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground">Feature</th>
                {tiers.map(t => <th key={t} className="text-center px-2 py-1.5 font-medium text-muted-foreground capitalize" colSpan={2}>{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {features.map(f => (
                <tr key={f} className="border-b border-border/30">
                  <td className="py-2 pr-3 font-medium text-xs">{labels[f] || f}</td>
                  {tiers.map(t => {
                    const val = aiConfig?.[f]?.[t];
                    return (
                      <td key={t} className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-[9px]">D:</span>
                          <input
                            className="w-12 h-6 text-[9px] font-mono bg-muted/20 border border-border rounded px-1 text-center"
                            type="text"
                            value={val?.daily ?? ''}
                            onChange={e => {
                              const v = e.target.value === '' ? null : parseInt(e.target.value);
                              setAiConfig((prev: any) => ({
                                ...prev,
                                [f]: { ...prev?.[f], [t]: { ...prev?.[f]?.[t], daily: v } },
                              }));
                              setDirty(true);
                            }}
                            placeholder="∞"
                          />
                          <span className="text-muted-foreground text-[9px]">M:</span>
                          <input
                            className="w-12 h-6 text-[9px] font-mono bg-muted/20 border border-border rounded px-1 text-center"
                            type="text"
                            value={val?.monthly ?? ''}
                            onChange={e => {
                              const v = e.target.value === '' ? null : parseInt(e.target.value);
                              setAiConfig((prev: any) => ({
                                ...prev,
                                [f]: { ...prev?.[f], [t]: { ...prev?.[f]?.[t], monthly: v } },
                              }));
                              setDirty(true);
                            }}
                            placeholder="∞"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={() => saveAndAudit('aiQuotas', aiConfig)} disabled={saving === 'aiQuotas'} className="h-7 text-[10px] gap-1">
            <Save className="w-3 h-3" /> {saving === 'aiQuotas' ? 'Saving...' : 'Save AI Config'}
          </Button>
        </div>
      </Section>
    );
  }

  function renderRoles() {
    const allRoles = Object.keys(ROLE_LABELS);
    const editableRoles = allRoles.filter(r => r !== 'super_admin');

    return (
      <Section title="Roles & Permissions" desc="Manage roles and their assigned permissions. Changes are logged.">
        <div className="space-y-4">
          {allRoles.map(role => {
            const perms = role === 'super_admin' ? ALL_PERMISSIONS : (rolePermissions[role] || []);
            return (
              <div key={role} className="border border-border/50 rounded-lg overflow-hidden">
                <div className={cn(
                  'px-3 py-2 flex items-center justify-between border-b border-border/30',
                  role === 'super_admin' ? 'bg-amber-500/5' : 'bg-muted/10',
                )}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{ROLE_LABELS[role] || role}</span>
                    <Badge variant="outline" className="text-[8px] font-mono">{role}</Badge>
                    <span className="text-[9px] text-muted-foreground">{perms.length} permissions</span>
                  </div>
                  {role !== 'super_admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[9px] gap-1"
                      onClick={() => {
                        setEditingRole(role);
                        setRoleNameInput(role);
                      }}
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                  )}
                </div>
                <div className="p-3">
                  {role === 'super_admin' ? (
                    <p className="text-[9px] text-muted-foreground italic">Has all permissions (god mode)</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {ALL_PERMISSIONS.map(p => {
                        const has = perms.includes(p);
                        return (
                          <button
                            key={p}
                            onClick={async () => {
                              const updated = has
                                ? perms.filter(x => x !== p)
                                : [...perms, p];
                              const newRoles = { ...rolePermissions, [role]: updated };
                              setRolePermissions(newRoles);
                              await saveAndAudit('roles', newRoles);
                            }}
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[8px] font-mono border transition-colors',
                              has
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-muted/10 border-border/30 text-muted-foreground/50 hover:text-foreground/70',
                            )}
                          >
                            {has ? <CheckCircle className="w-2 h-2 inline mr-0.5" /> : <XCircle className="w-2 h-2 inline mr-0.5" />}
                            {p.split('.').pop()}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    );
  }

  function renderPermissions() {
    const [selectedRole, setSelectedRole] = useState<string>(Object.keys(ROLE_LABELS)[0]);
    const [userSearch, setUserSearch] = useState('');
    const [userResults, setUserResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const searchUsers = async () => {
      if (!userSearch.trim()) return;
      setSearching(true);
      try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(userSearch)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserResults(data.results || []);
        }
      } catch {}
      setSearching(false);
    };

    return (
      <Section title="Permission Manager" desc="Grant or revoke individual permissions for users and roles. Every change is logged.">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-2">Select Role to Edit</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(ROLE_LABELS).map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={cn(
                    'px-2.5 py-1 rounded text-[10px] font-medium border transition-colors',
                    selectedRole === r
                      ? 'bg-foreground/10 border-foreground/30 text-foreground'
                      : 'bg-muted/10 border-border/30 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-border/50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-muted-foreground mb-2">
              Permissions for <span className="text-foreground font-bold">{ROLE_LABELS[selectedRole]}</span>
            </p>
            {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
              <div key={group} className="mb-2 last:mb-0">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{group}</p>
                <div className="flex flex-wrap gap-1">
                  {perms.map(p => {
                    const rolePerms = selectedRole === 'super_admin'
                      ? ALL_PERMISSIONS
                      : (rolePermissions[selectedRole] || []);
                    const has = selectedRole === 'super_admin' || rolePerms.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={async () => {
                          if (selectedRole === 'super_admin') return;
                          const updated = has
                            ? rolePerms.filter(x => x !== p)
                            : [...rolePerms, p];
                          const newRoles = { ...rolePermissions, [selectedRole]: updated };
                          setRolePermissions(newRoles);
                          await saveAndAudit('roles', newRoles);
                        }}
                        disabled={selectedRole === 'super_admin'}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[8px] font-mono border transition-colors',
                          has
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-muted/10 border-border/30 text-muted-foreground/40',
                          selectedRole === 'super_admin' && 'opacity-60 cursor-not-allowed',
                        )}
                      >
                        {has ? '+' : '−'} {p.split('.').pop()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/30 pt-3">
            <p className="text-[10px] font-medium text-muted-foreground mb-2">Grant Permission to User</p>
            <div className="flex gap-2">
              <Input
                placeholder="Search user by email, name, or UID..."
                className="h-8 text-xs font-mono flex-1"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchUsers()}
              />
              <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={searchUsers} disabled={searching}>
                {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              </Button>
            </div>
            {userResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {userResults.map((u: any) => (
                  <div key={u.uid || u.id} className="flex items-center justify-between p-2 rounded border border-border/30 bg-muted/10">
                    <div>
                      <p className="text-[10px] font-medium">{u.displayName || u.email || u.uid}</p>
                      <p className="text-[8px] text-muted-foreground font-mono">{u.email} · {u.uid}</p>
                    </div>
                    <Badge variant="outline" className="text-[8px]">{u.role || 'user'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>
    );
  }

  function renderMaintenance() {
    return (
      <Section title="Maintenance Mode" desc="Put the platform in maintenance mode. Only admins can access when enabled. Changes are logged.">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-xs font-medium">Maintenance Mode</p>
              <p className="text-[10px] text-muted-foreground">When enabled, only admins can access the platform</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={maintenance.enabled ?? false}
                onChange={e => { setMaintenance(prev => ({ ...prev, enabled: e.target.checked })); setDirty(true); }}
              />
              <div className={cn('w-8 h-4.5 rounded-full after:content-[""] after:absolute after:top-0.5 after:start-0.5 after:bg-background after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full', maintenance.enabled ? 'bg-amber-500' : 'bg-muted')} />
            </label>
          </div>
          <Field label="Maintenance Message" desc="Shown to users when maintenance is active">
            <textarea
              className="w-full min-h-[60px] text-xs bg-muted/20 border border-border rounded-md px-3 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20"
              value={maintenance.message || ''}
              onChange={e => { setMaintenance(prev => ({ ...prev, message: e.target.value })); setDirty(true); }}
              placeholder="We're performing scheduled maintenance. Please check back shortly."
            />
          </Field>
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={() => saveAndAudit('maintenance', maintenance)} disabled={saving === 'maintenance'} className="h-7 text-[10px] gap-1">
            <Save className="w-3 h-3" /> {saving === 'maintenance' ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Section>
    );
  }

  function renderRates() {
    return (
      <Section title="Rate Limits" desc="API and service rate limiting configuration. Changes are logged.">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Judge Rate Limit" desc="Max submissions per 60s window per user">
            <Input className="h-8 text-xs font-mono" type="number" value={rates.judge ?? 10} onChange={e => { setRates(prev => ({ ...prev, judge: parseInt(e.target.value) || 10 })); setDirty(true); }} />
          </Field>
          <Field label="API Rate Limit" desc="Max API requests per minute">
            <Input className="h-8 text-xs font-mono" type="number" value={rates.api ?? 100} onChange={e => { setRates(prev => ({ ...prev, api: parseInt(e.target.value) || 100 })); setDirty(true); }} />
          </Field>
          <Field label="Auth Rate Limit" desc="Max auth attempts per minute per IP">
            <Input className="h-8 text-xs font-mono" type="number" value={rates.auth ?? 20} onChange={e => { setRates(prev => ({ ...prev, auth: parseInt(e.target.value) || 20 })); setDirty(true); }} />
          </Field>
          <Field label="AI Rate Limit" desc="Max AI requests per minute per user">
            <Input className="h-8 text-xs font-mono" type="number" value={rates.ai ?? 30} onChange={e => { setRates(prev => ({ ...prev, ai: parseInt(e.target.value) || 30 })); setDirty(true); }} />
          </Field>
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={() => saveAndAudit('rateLimits', rates)} disabled={saving === 'rateLimits'} className="h-7 text-[10px] gap-1">
            <Save className="w-3 h-3" /> {saving === 'rateLimits' ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Section>
    );
  }

  function renderEnv() {
    const envEntries = Object.entries(environment);
    return (
      <Section title="Environment Status" desc="Current environment configuration (read-only)">
        <div className="space-y-0.5">
          {envEntries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <span className="text-[10px] font-mono text-foreground/80">{key}</span>
              <span className={cn(
                'text-[10px] font-mono',
                value === 'not set' || value === '' ? 'text-muted-foreground/40 italic' : 'text-foreground',
              )}>
                {value || 'not set'}
              </span>
            </div>
          ))}
        </div>
      </Section>
    );
  }

  function renderApiKeys() {
    const keyEntries = Object.entries(apiKeys);
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});

    return (
      <Section title="API Keys" desc="Platform API keys and secrets. All values are masked. Changes are logged as critical.">
        <div className="space-y-2 mb-4">
          {keyEntries.length === 0 ? (
            <p className="text-[10px] text-muted-foreground italic">No API key data available</p>
          ) : (
            keyEntries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-[10px] font-mono text-foreground/80">{key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-foreground/60">
                    {revealed[key] ? value : maskKeyValue(value)}
                  </span>
                  <button
                    onClick={() => setRevealed(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title={revealed[key] ? 'Hide' : 'Show'}
                  >
                    {revealed[key] ? <EyeOff className="w-3 h-3 text-muted-foreground" /> : <Eye className="w-3 h-3 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <p className="text-[10px] text-amber-400/80">
            API keys are stored securely server-side. To update keys, modify your environment variables. Regenerating keys will invalidate existing ones.
          </p>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setConfirmAction('regenerateKeys')}
            className="h-7 text-[10px] gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Regenerate All Keys
          </Button>
        </div>
      </Section>
    );
  }

  function renderNotifications() {
    return (
      <Section title="Notification Settings" desc="Default notification channels and preferences. Changes are logged.">
        <div className="space-y-2">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Send notifications via email' },
            { key: 'push', label: 'Push Notifications', desc: 'Send browser push notifications' },
            { key: 'inApp', label: 'In-App Notifications', desc: 'Show notifications within the app' },
            { key: 'sms', label: 'SMS Notifications', desc: 'Send SMS for critical alerts' },
            { key: 'discord', label: 'Discord Webhook', desc: 'Post notifications to a Discord channel' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications[item.key] ?? true}
                  onChange={e => { setNotifications(prev => ({ ...prev, [item.key]: e.target.checked })); setDirty(true); }}
                />
                <div className="w-8 h-4.5 bg-muted rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-background after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={() => saveAndAudit('notifications', notifications)} disabled={saving === 'notifications'} className="h-7 text-[10px] gap-1">
            <Save className="w-3 h-3" /> {saving === 'notifications' ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Section>
    );
  }

  function renderSystemLogs() {
    const filtered = systemLogs.filter(log => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.level?.toLowerCase().includes(q) ||
        log.message?.toLowerCase().includes(q) ||
        log.source?.toLowerCase().includes(q) ||
        log.service?.toLowerCase().includes(q)
      );
    });

    return (
      <Section title="System Logs" desc="Server-side application logs for monitoring and debugging">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Filter logs..."
              className="pl-7 h-7 text-[10px] font-mono bg-muted/30 border-border"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={fetchSystemLogs} disabled={fetchingLogs}>
            <RefreshCw className={cn('w-3 h-3', fetchingLogs && 'animate-spin')} /> Refresh
          </Button>
        </div>
        {fetchingLogs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <Terminal className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">No system logs found</p>
          </div>
        ) : (
          <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
            {filtered.map((log, i) => {
              const levelColor = log.level === 'error' || log.level === 'critical'
                ? 'text-destructive'
                : log.level === 'warn'
                  ? 'text-yellow-400'
                  : 'text-muted-foreground';
              return (
                <div key={log.id || i} className="flex items-start gap-2 py-1.5 border-b border-border/10 last:border-0 font-mono text-[9px]">
                  <span className={cn('shrink-0 w-12', levelColor)}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}
                  </span>
                  <span className={cn('shrink-0 w-14 uppercase font-bold', levelColor)}>{log.level || 'info'}</span>
                  <span className="shrink-0 text-muted-foreground/50 w-20 truncate" title={log.source || log.service}>{log.source || log.service || 'app'}</span>
                  <span className="text-foreground/80 break-words">{log.message || JSON.stringify(log)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    );
  }

  function renderAuditLogs() {
    return (
      <Section title="Audit Logs" desc="Immutable record of all admin actions. Only the last 10 entries shown.">
        {auditLogs.length === 0 ? (
          <div className="py-8 text-center">
            <ScrollText className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">No audit entries found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {auditLogs.map(log => (
              <div key={log.id} className="flex items-center gap-2 py-1.5 border-b border-border/10 last:border-0 text-[9px] font-mono">
                <span className="text-muted-foreground/50 shrink-0">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                </span>
                <Badge variant="outline" className={cn('text-[8px] font-mono shrink-0', SEVERITY_COLORS[log.severity] || '')}>
                  {log.severity}
                </Badge>
                <span className="font-medium shrink-0">{log.action}</span>
                <span className="text-muted-foreground">by</span>
                <span className="text-foreground/80">{log.performedByEmail || log.performedBy}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-foreground/80 truncate">{log.targetLabel || log.targetId}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Link href="/admin/audit-logs">
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
              <ScrollText className="w-3 h-3" /> View Full Audit Logs
            </Button>
          </Link>
        </div>
      </Section>
    );
  }

  function renderDanger() {
    return (
      <Section title="Danger Zone" desc="Irreversible destructive actions. All actions are logged with critical severity.">
        <div className="space-y-3">
          <DangerItem
            title="Reset All AI Usage Counters"
            desc="Resets AI usage counters for all users. They will regain their full daily/monthly limits."
            onAction={() => setConfirmAction('resetAi')}
          />
          <DangerItem
            title="Clear All Audit Logs"
            desc="Permanently delete all audit log entries. This cannot be undone."
            onAction={() => setConfirmAction('clearAudit')}
          />
          <DangerItem
            title="Reset Platform Settings to Defaults"
            desc="Reverts all config sections to default values. Feature flags and settings will be lost."
            onAction={() => setConfirmAction('resetSettings')}
          />
          <DangerItem
            title="Regenerate All API Keys"
            desc="Invalidates all existing API keys. External services will be disrupted until updated."
            onAction={() => setConfirmAction('regenerateKeys')}
          />
        </div>
        <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 mb-1">
            <Skull className="w-4 h-4 text-red-500" />
            <p className="text-xs font-bold text-red-500">System Reset</p>
          </div>
          <p className="text-[10px] text-red-400/80">
            These actions are irreversible and will be logged with critical severity. Use with extreme caution.
          </p>
        </div>
      </Section>
    );
  }
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-xs font-headline font-bold">{title}</h3>
          {desc && <p className="text-[10px] text-muted-foreground">{desc}</p>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{label}</label>
      {desc && <p className="text-[9px] text-muted-foreground/60 mb-1">{desc}</p>}
      {children}
    </div>
  );
}

function DangerItem({ title, desc, onAction }: { title: string; desc: string; onAction: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5">
      <div>
        <p className="text-xs font-medium text-red-500">{title}</p>
        <p className="text-[10px] text-red-400/70">{desc}</p>
      </div>
      <Button variant="destructive" size="sm" onClick={onAction} className="h-7 text-[10px] shrink-0">Execute</Button>
    </div>
  );
}

function maskKeyValue(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  return value.slice(0, 4) + '••••••••' + value.slice(-4);
}

const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  super_admin: ['*'],
  admin: [
    'users.read', 'users.write', 'users.ban', 'users.mute', 'users.role', 'users.password', 'users.session',
    'problems.read', 'problems.write', 'problems.delete', 'problems.publish',
    'shop.read', 'shop.write', 'shop.delete',
    'challenges.read', 'challenges.write',
    'settings.read', 'settings.write',
    'analytics.read',
    'moderation.read', 'moderation.write',
    'community.read', 'community.write', 'community.delete',
    'audit.read',
  ],
  moderator: [
    'users.read', 'users.mute',
    'problems.read', 'problems.write', 'problems.publish',
    'moderation.read', 'moderation.write', 'moderation.delete',
    'community.read', 'community.write', 'community.delete',
    'analytics.read',
  ],
  support: ['users.read', 'moderation.read', 'community.read'],
  user: [],
};
