'use client';

import React, { useEffect, useState } from 'react';
import { Users, Code2, ShoppingBag, Crown, ShieldBan, Shield, Zap, Coins, Activity, ArrowUpRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getAdminDashboardStats } from '@/services/admin';
import { useUser } from '@/firebase/auth/use-user';

interface DashboardStats {
  totalUsers: number;
  totalProblems: number;
  proUsers: number;
  shopItems: number;
  bannedUsers: number;
  admins: number;
  totalXp: number;
  totalCoins: number;
  activeUsers: number;
  recentUsers: any[];
}

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { key: 'totalProblems', label: 'Problems', icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { key: 'proUsers', label: 'Pro Users', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { key: 'shopItems', label: 'Shop Items', icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { key: 'activeUsers', label: 'Active (7d)', icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  { key: 'bannedUsers', label: 'Banned', icon: ShieldBan, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  { key: 'admins', label: 'Admins', icon: Shield, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  { key: 'totalXp', label: 'Total XP', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', fmt: (v: number) => v.toLocaleString() },
  { key: 'totalCoins', label: 'Total DevCoins', icon: Coins, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', fmt: (v: number) => v.toLocaleString() },
];

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getAdminDashboardStats().then(data => {
      if (data) setStats(data as DashboardStats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-muted-foreground text-sm">Failed to load dashboard data.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-headline font-black uppercase tracking-tighter">Platform Overview</h2>
        <span className="text-[10px] text-muted-foreground font-mono">Live</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map(card => {
          const value = (stats as any)[card.key];
          const formatted = card.fmt ? card.fmt(value) : value ?? 0;
          const Icon = card.icon;
          return (
            <Card key={card.key} className={cn('bg-card/50 border', card.border)}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{card.label}</span>
                  <Icon className={cn('w-4 h-4', card.color)} />
                </div>
                <p className={cn('text-2xl font-black font-headline', card.color)}>{formatted}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Users */}
      {stats.recentUsers.length > 0 && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Newest Users</h3>
            <div className="space-y-2">
              {stats.recentUsers.slice(0, 10).map((u: any) => (
                <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                      {u.username?.[0] || u.email?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.username || u.email?.split('@')[0] || 'Unknown'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground">
                    <span>XP: {u.xp || 0}</span>
                    <span>{u.tier || 'Beginner'}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
