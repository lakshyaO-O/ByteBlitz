'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Code2, Calendar, ShoppingBag, Brain,
  BarChart3, Settings, ChevronLeft, LogOut, Menu, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/problems', label: 'Problems', icon: Code2 },
  { href: '/admin/challenges', label: 'Challenges', icon: Calendar },
  { href: '/admin/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/admin/ai-usage', label: 'AI Usage', icon: Brain },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function AdminSidebar({ collapsed, onNav }: { collapsed: boolean; onNav?: () => void }) {
  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const initials = user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A';

  return (
    <div className="flex flex-col h-full bg-card/60 backdrop-blur-sm">
      <div className={cn('border-b border-border/50 shrink-0 flex items-center', collapsed ? 'justify-center p-3' : 'px-4 py-3')}>
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold font-headline">DevRann</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-primary">Super Admin</p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/30',
              )}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn('border-t border-border/50 shrink-0', collapsed ? 'p-2' : 'p-3')}>
        <div className={cn('space-y-2', collapsed && 'flex flex-col items-center')}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-muted/15">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{user?.displayName || 'Admin'}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Super Admin</p>
              </div>
            </div>
          )}
          <button
            onClick={async () => {
              if (auth) await signOut(auth);
              router.push('/');
            }}
            className={cn(
              'flex items-center gap-2 w-full text-xs text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg px-3 py-2 transition-colors',
              collapsed && 'justify-center px-0',
            )}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  const pageTitle = NAV_ITEMS.find(i => pathname === i.href || pathname.startsWith(i.href + '/'))?.label || 'Admin';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border/50 transition-all duration-300 relative',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <AdminSidebar collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed(p => !p)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 p-1 rounded-full border border-border/40 bg-card hover:bg-muted/40 transition-colors z-10"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn('w-3.5 h-3.5 text-muted-foreground/50 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <button className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-card border border-border/40">
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar collapsed={false} onNav={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 sm:px-6 border-b border-border/40 bg-background/80 backdrop-blur-lg shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold font-headline uppercase tracking-wider">{pageTitle}</h1>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="w-3 h-3 text-primary" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-primary">Super Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Back to Site
            </Link>
            {user && (
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                  {user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A'}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
