'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search, X, Shield, ShieldBan, ShieldCheck, UserCog, Ban, CheckCircle2,
  Loader2, ChevronDown, ChevronUp, RefreshCw, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fetchAllUsers, updateUserRole, toggleBanUser, updateUserProfile } from '@/services/admin';
import { useUser } from '@/firebase/auth/use-user';
import type { UserProfile, SubscriptionTier } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLES = ['user', 'moderator', 'admin', 'super_admin'];
const SUB_TIERS: SubscriptionTier[] = ['free', 'pro', 'elite'];

export function UsersManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [subFilter, setSubFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const { user } = useUser();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = useMemo(() => {
    let f = users;
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(u =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.uid?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') {
      if (roleFilter === 'admin') f = f.filter(u => u.isAdmin || u.role === 'admin' || u.role === 'super_admin');
      else if (roleFilter === 'moderator') f = f.filter(u => u.role === 'moderator');
      else if (roleFilter === 'banned') f = f.filter(u => (u as any).banned);
      else f = f.filter(u => !u.isAdmin && (!u.role || u.role === 'user'));
    }
    if (subFilter !== 'all') {
      f = f.filter(u => (u.subscriptionTier || 'free') === subFilter);
    }
    return f.sort((a, b) => ((b.xp || 0) - (a.xp || 0)));
  }, [users, search, roleFilter, subFilter]);

  const handleRoleChange = async (uid: string, role: string) => {
    await updateUserRole(uid, role);
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, role, isAdmin: role === 'super_admin' || role === 'admin' } : u));
  };

  const handleBanToggle = async (uid: string, banned: boolean) => {
    await toggleBanUser(uid, banned);
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, banned } as any : u));
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    await updateUserProfile(editUser.id, editUser);
    setUsers(prev => prev.map(u => u.id === editUser.id ? editUser : u));
    setEditUser(null);
  };

  const getProvider = (u: UserProfile): string => {
    if (u.githubUrl) return 'Google';
    return u.email?.includes('@') ? 'Email' : 'Guest';
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or UID..."
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
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="h-8 px-2 text-xs bg-muted/50 border border-border rounded font-mono"
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
          <option value="banned">Banned</option>
        </select>
        <select
          value={subFilter}
          onChange={e => setSubFilter(e.target.value)}
          className="h-8 px-2 text-xs bg-muted/50 border border-border rounded font-mono"
        >
          <option value="all">All Subs</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="elite">Elite</option>
        </select>
        <Button variant="outline" size="sm" onClick={loadUsers} className="h-8 gap-1 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
        <span className="text-[10px] text-muted-foreground font-mono">{filtered.length} users</span>
      </div>

      {/* Table */}
      <Card className="bg-card/50 border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground">User</th>
                <th className="text-left px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground hidden md:table-cell">UID</th>
                <th className="text-left px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground hidden lg:table-cell">Provider</th>
                <th className="text-left px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="text-center px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground">XP</th>
                <th className="text-center px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground hidden sm:table-cell">ELO</th>
                <th className="text-center px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground hidden sm:table-cell">Streak</th>
                <th className="text-center px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground hidden md:table-cell">Sub</th>
                <th className="text-center px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground">Role</th>
                <th className="text-center px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground">Status</th>
                <th className="text-right px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const isBanned = (u as any).banned;
                const isExpanded = expandedId === u.id;
                const userRole = u.role || (u.isAdmin ? 'admin' : 'user');
                return (
                  <React.Fragment key={u.id}>
                    <tr
                      className={cn('border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer', isBanned && 'opacity-50')}
                      onClick={() => setExpandedId(isExpanded ? null : u.id)}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                            {u.username?.[0] || u.email?.[0] || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[120px]">{u.username || u.email?.split('@')[0] || 'Unknown'}</p>
                            <p className="text-[9px] text-muted-foreground truncate max-w-[120px]">{u.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground hidden md:table-cell">
                        <span className="truncate max-w-[80px] inline-block">{u.uid || u.id}</span>
                      </td>
                      <td className="px-3 py-2.5 hidden lg:table-cell">
                        <Badge variant="outline" className="text-[8px] font-mono">{getProvider(u)}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold">{u.xp || 0}</td>
                      <td className="px-3 py-2.5 text-center font-mono hidden sm:table-cell">{u.rating || 0}</td>
                      <td className="px-3 py-2.5 text-center font-mono hidden sm:table-cell">{u.streak || 0}</td>
                      <td className="px-3 py-2.5 text-center hidden md:table-cell">
                        <span className={cn('text-[9px] font-bold uppercase tracking-widest', (u.subscriptionTier || 'free') === 'pro' ? 'text-yellow-400' : (u.subscriptionTier || 'free') === 'elite' ? 'text-purple-400' : 'text-muted-foreground')}>
                          {u.subscriptionTier || 'free'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn('text-[9px] font-bold uppercase tracking-widest', userRole === 'super_admin' ? 'text-destructive' : userRole === 'admin' ? 'text-primary' : userRole === 'moderator' ? 'text-yellow-400' : 'text-muted-foreground')}>
                          {userRole}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {isBanned ? (
                          <Ban className="w-3.5 h-3.5 text-destructive mx-auto" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 inline text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 inline text-muted-foreground" />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={11} className="px-4 py-4 bg-muted/10">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Role */}
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Role</Label>
                              <select
                                value={userRole}
                                onChange={e => handleRoleChange(u.id, e.target.value)}
                                className="w-full mt-1 h-8 px-2 text-xs bg-background border border-border rounded font-mono"
                                disabled={u.id === user?.uid}
                              >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                            {/* Ban */}
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Account Status</Label>
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  variant={isBanned ? 'destructive' : 'outline'}
                                  size="sm"
                                  onClick={() => handleBanToggle(u.id, !isBanned)}
                                  className="text-xs h-8 gap-1"
                                  disabled={u.id === user?.uid}
                                >
                                  {isBanned ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldBan className="w-3.5 h-3.5" />}
                                  {isBanned ? 'Unban' : 'Ban'}
                                </Button>
                                <span className={cn('text-[10px]', isBanned ? 'text-destructive' : 'text-emerald-400')}>
                                  {isBanned ? 'Banned' : 'Active'}
                                </span>
                              </div>
                            </div>
                            {/* Edit */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setEditUser({...u})} className="text-xs h-8 gap-1">
                                  <UserCog className="w-3.5 h-3.5" /> Edit Profile
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                  <DialogTitle className="text-sm font-headline">Edit User: {editUser?.username || editUser?.email}</DialogTitle>
                                </DialogHeader>
                                {editUser && (
                                  <div className="space-y-3 py-2">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label className="text-[10px]">Username</Label>
                                        <Input className="h-8 text-xs mt-1" value={editUser.username || ''} onChange={e => setEditUser({ ...editUser, username: e.target.value })} />
                                      </div>
                                      <div>
                                        <Label className="text-[10px]">Email</Label>
                                        <Input className="h-8 text-xs mt-1" value={editUser.email || ''} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                      <div>
                                        <Label className="text-[10px]">XP</Label>
                                        <Input className="h-8 text-xs mt-1" type="number" value={editUser.xp || 0} onChange={e => setEditUser({ ...editUser, xp: parseInt(e.target.value) || 0 })} />
                                      </div>
                                      <div>
                                        <Label className="text-[10px]">Coins</Label>
                                        <Input className="h-8 text-xs mt-1" type="number" value={editUser.coins || 0} onChange={e => setEditUser({ ...editUser, coins: parseInt(e.target.value) || 0 })} />
                                      </div>
                                      <div>
                                        <Label className="text-[10px]">DevCoins</Label>
                                        <Input className="h-8 text-xs mt-1" type="number" value={editUser.devcoins || 0} onChange={e => setEditUser({ ...editUser, devcoins: parseInt(e.target.value) || 0 })} />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label className="text-[10px]">Level</Label>
                                        <Input className="h-8 text-xs mt-1" type="number" value={editUser.level || 0} onChange={e => setEditUser({ ...editUser, level: parseInt(e.target.value) || 0 })} />
                                      </div>
                                      <div>
                                        <Label className="text-[10px]">Rating (ELO)</Label>
                                        <Input className="h-8 text-xs mt-1" type="number" value={editUser.rating || 0} onChange={e => setEditUser({ ...editUser, rating: parseInt(e.target.value) || 0 })} />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label className="text-[10px]">Tier</Label>
                                        <Input className="h-8 text-xs mt-1" value={editUser.tier || 'Beginner'} onChange={e => setEditUser({ ...editUser, tier: e.target.value as any })} />
                                      </div>
                                      <div>
                                        <Label className="text-[10px]">Subscription</Label>
                                        <select
                                          value={editUser.subscriptionTier || 'free'}
                                          onChange={e => setEditUser({ ...editUser, subscriptionTier: e.target.value as SubscriptionTier })}
                                          className="w-full mt-1 h-8 px-2 text-xs bg-background border border-border rounded font-mono"
                                        >
                                          {SUB_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-[10px]">Bio</Label>
                                      <Textarea className="text-xs mt-1" value={editUser.bio || ''} onChange={e => setEditUser({ ...editUser, bio: e.target.value })} rows={2} />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                      <Button variant="outline" size="sm" onClick={() => setEditUser(null)} className="text-xs">Cancel</Button>
                                      <Button size="sm" onClick={handleSaveEdit} className="text-xs">Save Changes</Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
