'use client';

import React, { useState, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import {
  Search, Loader2, User, Mail, Calendar, Clock, Shield,
  Award, Zap, Flame, Target, Code2, MessageSquare, Flag,
  Users, Brain, BarChart3, Ban, VolumeX, Trash2, Key,
  LogOut, ArrowUpDown, CheckCircle, XCircle, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface UserProfile {
  id: string; uid: string; publicId: string;
  username: string; email: string; photoURL: string; bio: string;
  role: string; isAdmin: boolean; banned: boolean; muted: boolean;
  subscriptionTier: string; emailVerified: boolean;
  createdAt: string; lastActive: string; lastLoginDate: string;
  xp: number; level: number; rank: number; rating: number; highestRating: number;
  tier: string; streak: number; dailyLoginStreak: number; longestStreak: number;
  coins: number; devcoins: number;
  wins: number; losses: number; draws: number;
  problemsSolved: number; problemsAttempted: number; accuracy: number;
  preferredLanguage: string; onlineStatus: string;
  badge: string; title: string;
  learningGoals: string[]; badges: string[]; achievements: string[];
  contestHistory: string[]; totalCodingTime: number;
  onboardingCompleted: boolean;
  referralCode: string; referredBy: string;
  githubUrl: string; linkedinUrl: string; twitterUrl: string; websiteUrl: string;
  editorTheme: string; editorFontSize: number;
  activeRoomId: string | null; userAgent: string | null;
}

interface InspectorData {
  profile: UserProfile;
  stats: {
    submissions: number; acceptedSubs: number; acceptedRate: number;
    friendsCount: number; problemsSolved: number; problemsAttempted: number;
    totalCodingTime: number;
  };
  submissions: Array<{
    id: string; problemId: string; language: string; verdict: string;
    passedTestCases: number; totalTestCases: number;
    executionTimeMs: number; submittedAt: string;
  }>;
  languagesUsed: string[];
  aiUsage: Record<string, { daily: number; total: number }>;
  communityPosts: Array<{ id: string; title: string; type: string; likes: number; comments: number; createdAt: string }>;
  forumThreads: Array<{ id: string; title: string; replies: number; createdAt: string }>;
  progress: Array<{ problemId: string; solved: boolean; attempted: boolean }>;
  auditLogs: Array<{ id: string; action: string; performedBy: string; performedByEmail: string; severity: string; timestamp: string }>;
  session: { activeRoom: string } | null;
}

type ActionType = 'ban' | 'unban' | 'mute' | 'unmute' | 'delete' | 'resetPassword' | 'forceLogout' | 'promote' | 'demote';

export function UserInspector() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InspectorData | null>(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  // Action state
  const [confirmAction, setConfirmAction] = useState<{ type: ActionType; label: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [muteReason, setMuteReason] = useState('');

  const fetchUser = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    setNotFound(false);
    setData(null);

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`/api/admin/users/inspector?uid=${encodeURIComponent(searchQuery.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load');
      }

      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) fetchUser(query.trim());
  };

  const handleAction = async () => {
    if (!confirmAction || !data) return;
    setActionLoading(true);
    setActionError('');

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const body: any = {
        action: confirmAction.type,
        targetUid: data.profile.uid || data.profile.id,
        data: {},
      };

      if (confirmAction.type === 'resetPassword' && passwordValue) {
        body.data.newPassword = passwordValue;
      }
      if ((confirmAction.type === 'mute' || confirmAction.type === 'ban') && muteReason) {
        body.data.reason = muteReason;
      }
      if (confirmAction.type === 'promote') {
        body.data = { role: 'admin' };
        body.action = 'updateRole';
      }
      if (confirmAction.type === 'demote') {
        body.data = { role: 'user' };
        body.action = 'updateRole';
      }

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Action failed');

      // Refresh user data
      await fetchUser(data.profile.uid || data.profile.id);
      setConfirmAction(null);
      setPasswordValue('');
      setMuteReason('');
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getActionConfig = (type: ActionType): { title: string; description: string; variant: 'destructive' | 'warning' | 'default'; confirmLabel: string } => {
    const username = data?.profile?.username || data?.profile?.email || 'this user';
    switch (type) {
      case 'ban': return { title: 'Ban User', description: `Ban "${username}"? They will be unable to access the platform.`, variant: 'destructive', confirmLabel: 'Ban' };
      case 'unban': return { title: 'Unban User', description: `Unban "${username}"? They will regain platform access.`, variant: 'default', confirmLabel: 'Unban' };
      case 'mute': return { title: 'Mute User', description: `Mute "${username}"? They will be unable to post or comment.`, variant: 'warning', confirmLabel: 'Mute' };
      case 'unmute': return { title: 'Unmute User', description: `Unmute "${username}"? They will regain posting ability.`, variant: 'default', confirmLabel: 'Unmute' };
      case 'delete': return { title: 'Delete User', description: `Permanently delete "${username}"? This is irreversible.`, variant: 'destructive', confirmLabel: 'Delete' };
      case 'resetPassword': return { title: 'Reset Password', description: `Set a new password for "${username}".`, variant: 'warning', confirmLabel: 'Reset' };
      case 'forceLogout': return { title: 'Force Logout', description: `Force "${username}" to log out of all sessions?`, variant: 'warning', confirmLabel: 'Force Logout' };
      case 'promote': return { title: 'Promote User', description: `Promote "${username}" to admin? They will gain admin panel access.`, variant: 'warning', confirmLabel: 'Promote' };
      case 'demote': return { title: 'Demote User', description: `Demote "${username}" to user? They will lose admin panel access.`, variant: 'warning', confirmLabel: 'Demote' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">User Inspector</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Search and inspect user profiles</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Search by UID, username, or email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={cn(
              'w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background',
              'text-sm text-foreground placeholder:text-muted-foreground/40',
              'focus:outline-none focus:ring-1 focus:ring-foreground/10 focus:border-foreground/20',
            )}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="h-10 px-4 rounded-lg border border-border bg-background text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/[0.02] disabled:opacity-40 transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
        </button>
      </form>

      {/* Error / Not Found */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-xs text-red-600 dark:text-red-500">{error}</p>
        </div>
      )}

      {notFound && (
        <div className="rounded-lg border border-border p-6 text-center">
          <User className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">User not found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">No user matches your search query</p>
        </div>
      )}

      {/* Profile */}
      {data && (
        <>
          {/* Profile Header */}
          <div className="rounded-lg border border-border bg-background p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-foreground/5 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                {data.profile.photoURL ? (
                  <img src={data.profile.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-medium text-foreground/40">
                    {(data.profile.username?.[0] || data.profile.email?.[0] || '?').toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-foreground">
                    {data.profile.username || 'Unknown'}
                  </h2>
                  <span className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded',
                    data.profile.role === 'super_admin' && 'text-red-600 bg-red-500/5',
                    data.profile.role === 'admin' && 'text-foreground bg-foreground/5',
                    data.profile.role === 'moderator' && 'text-amber-600 bg-amber-500/5',
                    data.profile.role === 'support' && 'text-cyan-600 bg-cyan-500/5',
                    !['super_admin', 'admin', 'moderator', 'support'].includes(data.profile.role) && 'text-muted-foreground bg-foreground/5',
                  )}>
                    {data.profile.role || 'user'}
                  </span>
                  {data.profile.banned && (
                    <span className="text-[10px] font-medium text-red-600 bg-red-500/5 px-1.5 py-0.5 rounded">Banned</span>
                  )}
                  {data.profile.muted && (
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-500/5 px-1.5 py-0.5 rounded">Muted</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span>{data.profile.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground/60">
                  <Calendar className="w-3 h-3" />
                  <span>Joined {data.profile.createdAt ? new Date(data.profile.createdAt).toLocaleDateString() : '—'}</span>
                  <Clock className="w-3 h-3 ml-2" />
                  <span>Last active {data.profile.lastActive ? new Date(data.profile.lastActive).toLocaleDateString() : '—'}</span>
                </div>
                {data.profile.bio && (
                  <p className="text-xs text-muted-foreground/70 mt-2">{data.profile.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'XP', value: data.profile.xp.toLocaleString(), icon: Zap },
              { label: 'Level', value: data.profile.level, icon: BarChart3 },
              { label: 'Rating', value: data.profile.rating, icon: Target },
              { label: 'Rank', value: `#${data.profile.rank || '—'}`, icon: Award },
              { label: 'Streak', value: data.profile.streak, icon: Flame },
              { label: 'Longest', value: data.profile.longestStreak || data.profile.dailyLoginStreak || 0, icon: Flame },
              { label: 'Solved', value: data.stats.problemsSolved, icon: CheckCircle },
              { label: 'Accepted', value: `${data.stats.acceptedRate}%`, icon: Target },
              { label: 'Friends', value: data.stats.friendsCount, icon: Users },
              { label: 'Coding Time', value: `${Math.round(data.stats.totalCodingTime / 3600)}h`, icon: Clock },
              { label: 'Wins', value: data.profile.wins, icon: Award },
              { label: 'Losses', value: data.profile.losses, icon: XCircle },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground font-medium">{stat.label}</span>
                  <stat.icon className="w-3 h-3 text-muted-foreground/40" />
                </div>
                <span className="text-sm font-semibold text-foreground">{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submissions */}
            <section>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-muted-foreground/40" />
                Submission History
              </h3>
              <div className="rounded-lg border border-border divide-y divide-border max-h-[300px] overflow-y-auto">
                {data.submissions.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground">No submissions</div>
                ) : (
                  data.submissions.slice(0, 10).map(sub => (
                    <div key={sub.id} className="flex items-center justify-between px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          sub.verdict === 'Accepted' ? 'bg-emerald-500' : 'bg-red-500',
                        )} />
                        <span className="text-foreground truncate">{sub.language || '—'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground shrink-0">
                        <span>{sub.executionTimeMs}ms</span>
                        <span className={cn(
                          sub.verdict === 'Accepted' ? 'text-emerald-600' : 'text-red-600',
                        )}>{sub.verdict}</span>
                        <span>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Languages */}
            <section>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-muted-foreground/40" />
                Languages Used
              </h3>
              <div className="rounded-lg border border-border p-4">
                {data.languagesUsed.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No languages used</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {data.languagesUsed.map(lang => (
                      <span key={lang} className="text-[10px] font-medium px-2 py-1 rounded bg-foreground/5 text-foreground/70">
                        {lang}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Community Posts */}
            <section>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/40" />
                Community Posts
              </h3>
              <div className="rounded-lg border border-border divide-y divide-border max-h-[200px] overflow-y-auto">
                {data.communityPosts.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground">No posts</div>
                ) : (
                  data.communityPosts.map(post => (
                    <div key={post.id} className="px-3 py-2">
                      <p className="text-xs font-medium text-foreground truncate">{post.title || 'Untitled'}</p>
                      <p className="text-[10px] text-muted-foreground">{post.likes} likes · {post.comments} comments</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Forum Threads */}
            <section>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/40" />
                Forum Threads
              </h3>
              <div className="rounded-lg border border-border divide-y divide-border max-h-[200px] overflow-y-auto">
                {data.forumThreads.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground">No threads</div>
                ) : (
                  data.forumThreads.map(thread => (
                    <div key={thread.id} className="px-3 py-2">
                      <p className="text-xs font-medium text-foreground truncate">{thread.title || 'Untitled'}</p>
                      <p className="text-[10px] text-muted-foreground">{thread.replies} replies</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Achievements & Badges */}
            <section>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-muted-foreground/40" />
                Achievements
              </h3>
              <div className="rounded-lg border border-border p-4">
                {data.profile.achievements && data.profile.achievements.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {data.profile.achievements.map((a, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded bg-foreground/5 text-foreground/70">{a}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No achievements</p>
                )}
              </div>
            </section>

            {/* Contest History */}
            <section>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Flag className="w-3.5 h-3.5 text-muted-foreground/40" />
                Contest History
              </h3>
              <div className="rounded-lg border border-border p-4">
                {data.profile.contestHistory && data.profile.contestHistory.length > 0 ? (
                  <div className="space-y-1">
                    {data.profile.contestHistory.slice(0, 10).map((c, i) => (
                      <p key={i} className="text-xs text-foreground/70">{c}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No contest history</p>
                )}
              </div>
            </section>

            {/* AI Usage */}
            <section>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-muted-foreground/40" />
                AI Usage
              </h3>
              <div className="rounded-lg border border-border p-4">
                {Object.keys(data.aiUsage).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No AI usage</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(data.aiUsage).map(([feature, usage]) => (
                      <div key={feature} className="flex items-center justify-between text-xs">
                        <span className="text-foreground capitalize">{feature}</span>
                        <span className="text-muted-foreground">{usage.total} total</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Audit Logs */}
            <section>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-muted-foreground/40" />
                Recent Audit Logs
              </h3>
              <div className="rounded-lg border border-border divide-y divide-border max-h-[200px] overflow-y-auto">
                {data.auditLogs.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground">No audit logs</div>
                ) : (
                  data.auditLogs.map(log => (
                    <div key={log.id} className="px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-[10px] font-medium',
                          log.severity === 'critical' && 'text-red-600',
                          log.severity === 'warning' && 'text-amber-600',
                          log.severity === 'info' && 'text-muted-foreground',
                        )}>{log.action}</span>
                        <span className="text-muted-foreground/60">by {log.performedByEmail || log.performedBy}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/40">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Session */}
            {data.session && (
              <section>
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />
                  Session
                </h3>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-foreground">Active room: {data.session.activeRoom}</p>
                </div>
              </section>
            )}
          </div>

          {/* Admin Actions */}
          <section>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-muted-foreground/40" />
              Admin Actions
            </h3>
            <div className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap gap-2">
                {data.profile.banned ? (
                  <ActionButton icon={CheckCircle} label="Unban" onClick={() => setConfirmAction({ type: 'unban', label: 'Unban' })} variant="default" />
                ) : (
                  <ActionButton icon={Ban} label="Ban" onClick={() => setConfirmAction({ type: 'ban', label: 'Ban' })} variant="destructive" />
                )}
                {data.profile.muted ? (
                  <ActionButton icon={VolumeX} label="Unmute" onClick={() => setConfirmAction({ type: 'unmute', label: 'Unmute' })} variant="default" />
                ) : (
                  <ActionButton icon={VolumeX} label="Mute" onClick={() => setConfirmAction({ type: 'mute', label: 'Mute' })} variant="warning" />
                )}
                <ActionButton icon={Trash2} label="Delete" onClick={() => setConfirmAction({ type: 'delete', label: 'Delete' })} variant="destructive" />
                <ActionButton icon={Key} label="Reset Password" onClick={() => setConfirmAction({ type: 'resetPassword', label: 'Reset Password' })} variant="warning" />
                <ActionButton icon={LogOut} label="Force Logout" onClick={() => setConfirmAction({ type: 'forceLogout', label: 'Force Logout' })} variant="warning" />
                {data.profile.role !== 'admin' && data.profile.role !== 'super_admin' ? (
                  <ActionButton icon={ArrowUpDown} label="Promote" onClick={() => setConfirmAction({ type: 'promote', label: 'Promote to Admin' })} variant="warning" />
                ) : (
                  <ActionButton icon={ArrowUpDown} label="Demote" onClick={() => setConfirmAction({ type: 'demote', label: 'Demote to User' })} variant="warning" />
                )}
              </div>

              {actionError && (
                <p className="text-xs text-red-600 mt-2">{actionError}</p>
              )}
            </div>
          </section>

          {/* Confirmation Dialog */}
          {confirmAction && (
            <ConfirmDialog
              open={true}
              onOpenChange={(open) => { if (!open) { setConfirmAction(null); setActionError(''); } }}
              {...getActionConfig(confirmAction.type)}
              onConfirm={handleAction}
              loading={actionLoading}
            >
              {(confirmAction.type === 'resetPassword') && (
                <div className="mt-3">
                  <input
                    type="password"
                    placeholder="New password"
                    value={passwordValue}
                    onChange={e => setPasswordValue(e.target.value)}
                    className="w-full h-8 px-3 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground/10"
                  />
                </div>
              )}
              {(confirmAction.type === 'mute' || confirmAction.type === 'ban') && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={muteReason}
                    onChange={e => setMuteReason(e.target.value)}
                    className="w-full h-8 px-3 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground/10"
                  />
                </div>
              )}
            </ConfirmDialog>
          )}
        </>
      )}
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, variant }: {
  icon: any; label: string; onClick: () => void; variant: 'default' | 'destructive' | 'warning';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
        variant === 'destructive' && 'border-red-500/20 text-red-600 hover:bg-red-500/5',
        variant === 'warning' && 'border-amber-500/20 text-amber-600 hover:bg-amber-500/5',
        variant === 'default' && 'border-border text-foreground/70 hover:bg-foreground/[0.02]',
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}
