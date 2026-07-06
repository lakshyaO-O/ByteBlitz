'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Code2, Gavel, Users2, Flag,
  BarChart3, Settings, ScrollText, ChevronLeft, LogOut, Shield,
  ExternalLink, Sun, Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import type { AdminRole } from '@/types/admin';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  minRole: AdminRole;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, minRole: 'admin' },
  { href: '/admin/users', label: 'Users', icon: Users, minRole: 'support' },
  { href: '/admin/problems', label: 'Problems', icon: Code2, minRole: 'moderator' },
  { href: '/admin/judge', label: 'Judge', icon: Gavel, minRole: 'moderator' },
  { href: '/admin/community', label: 'Community', icon: Users2, minRole: 'moderator' },
  { href: '/admin/moderation', label: 'Moderation', icon: Flag, minRole: 'moderator' },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, minRole: 'admin' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, minRole: 'admin' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, minRole: 'admin' },
];

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  support: 'Support',
  user: 'User',
};

const ROLE_LEVELS: Record<AdminRole, number> = {
  super_admin: 100,
  admin: 80,
  moderator: 50,
  support: 30,
  user: 0,
};

export function AdminSidebar({ collapsed, onNav }: { collapsed: boolean; onNav?: () => void }) {
  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<AdminRole>('user');
  const [dark, setDark] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadRole = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role || 'user');
        }
      } catch {
        // fallback: keep default 'user' role
      }
    };
    loadRole();
  }, [user]);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      setDark(stored === 'dark');
      document.documentElement.classList.toggle('dark', stored === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const initials = user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A';
  const roleLabel = ROLE_LABELS[userRole] || 'User';

  const visibleItems = NAV_ITEMS.filter(item => {
    if (userRole === 'super_admin') return true;
    return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[item.minRole] || 0);
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className={cn('border-b border-border shrink-0', collapsed ? 'px-3 py-4' : 'px-4 py-4')}>
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-foreground/5 border border-border flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-foreground/60" />
          </div>
          {!collapsed && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-foreground">DevRann</span>
              <span className="text-[10px] text-muted-foreground/50 font-medium">admin</span>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {visibleItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-foreground/5 text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]',
              )}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground/60')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn('border-t border-border shrink-0', collapsed ? 'p-2' : 'p-3')}>
        <div className={cn('space-y-1', collapsed && 'flex flex-col items-center')}>
          {/* Back to Site */}
          <Link
            href="/"
            className={cn(
              'flex items-center gap-2 w-full text-xs text-muted-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.02] rounded-md px-2 py-1.5 transition-colors',
              collapsed && 'justify-center px-0',
            )}
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Back to site</span>}
          </Link>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-2 w-full text-xs text-muted-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.02] rounded-md px-2 py-1.5 transition-colors',
              collapsed && 'justify-center px-0',
            )}
          >
            {dark ? <Sun className="w-3.5 h-3.5 shrink-0" /> : <Moon className="w-3.5 h-3.5 shrink-0" />}
            {!collapsed && <span>{dark ? 'Light mode' : 'Dark mode'}</span>}
          </button>

          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-md bg-foreground/[0.02] border border-border/50 mt-1.5">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback className="text-[8px] font-medium bg-foreground/5 text-foreground/60">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate text-foreground/80">{user?.displayName || 'Admin'}</p>
                <p className="text-[9px] text-muted-foreground/50 truncate">{roleLabel}</p>
              </div>
            </div>
          )}
          <button
            onClick={async () => {
              if (auth) await signOut(auth);
              router.push('/');
            }}
            className={cn(
              'flex items-center gap-2 w-full text-xs text-muted-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.02] rounded-md px-2 py-1.5 transition-colors',
              collapsed && 'justify-center px-0',
            )}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
