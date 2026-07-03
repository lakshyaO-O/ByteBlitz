'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Swords, Trophy, Settings, Menu, LogOut,
  Users, BarChart3, UserCircle, Bell, Search, Gamepad2,
  ChevronLeft, Code2, LogIn, UserPlus, GraduationCap, BookOpen,
  Crown, Sparkles, Bug, Brain, Briefcase, MessageCircle,
  Share2, Globe, Rocket, Store, MessageSquare, Eye,
  ChevronDown, ChevronRight, Lightbulb, X, Gem,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase/provider';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { getTier, getTierColor } from '@/lib/utils';
import { useSidebar } from '@/components/layout/SidebarContext';
import type { Tier } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
}

interface NavSection {
  label?: string;
  items: NavItem[];
  collapsible?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'CODING',
    items: [
      { href: '/arena', label: 'Arena', icon: Swords },
      { href: '/arena/custom-study', label: 'Study Room', icon: BookOpen },
      { href: '/practice', label: 'Practice', icon: Code2 },
      { href: '/learning', label: 'Learning', icon: GraduationCap },
      { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  {
    label: 'AI TOOLS',
    items: [
      { href: '/ai-mentor', label: 'AI Mentor', icon: Sparkles },
      { href: '/ai-code-review', label: 'Code Review', icon: Code2 },
      { href: '/ai-debugger', label: 'AI Debugger', icon: Bug },
      { href: '/ai-interviewer', label: 'AI Interviewer', icon: Brain },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { href: '/community', label: 'Community', icon: MessageCircle },
      { href: '/forum', label: 'Forum', icon: Globe },
      { href: '/code-share', label: 'Code Share', icon: Share2 },
    ],
  },
  {
    label: 'CAREER',
    items: [
      { href: '/career-hub', label: 'Career Hub', icon: Briefcase },
    ],
  },
  {
    label: 'EVENTS',
    items: [
      { href: '/hackathons', label: 'Hackathons', icon: Rocket },
    ],
  },
  {
    label: 'GAMIFICATION',
    items: [
      { href: '/missions', label: 'Missions', icon: Lightbulb },
      { href: '/shop', label: 'Shop', icon: Store },
      { href: '/progress', label: 'Progress', icon: BarChart3 },
    ],
  },
  {
    label: 'SOCIAL',
    items: [
      { href: '/chats', label: 'Messages', icon: MessageSquare },
      { href: '/friends', label: 'Friends', icon: Users },
      { href: '/rooms', label: 'Rooms', icon: Gamepad2 },
    ],
  },
  {
    items: [
      { href: '/profile', label: 'My Profile', icon: UserCircle },
      { href: '/monetization', label: 'Premium', icon: Crown },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/* ─── Top header with notification bell ─── */

function TopHeader({
  user,
  unread,
}: {
  user: any;
  unread: number;
}) {
  const [devCoinBalance, setDevCoinBalance] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    import('@/services/shop').then(({ getDevCoinBalance }) => {
      getDevCoinBalance(user.uid).then(setDevCoinBalance);
    });
  }, [user?.uid]);

  return (
    <div className="sticky top-0 z-40 flex items-center justify-end gap-3 px-4 sm:px-6 lg:px-8 h-14 border-b border-border/40 bg-background/80 backdrop-blur-lg shrink-0">
      {user && (
        <Link
          href="/shop"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
        >
          <Gem className="w-4 h-4" />
          <span className="text-sm font-bold font-headline">{devCoinBalance.toLocaleString()}</span>
        </Link>
      )}
      <Link
        href="/notifications"
        className="relative p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    </div>
  );
}

/* ─── Sidebar search bar ─── */

function SidebarSearch({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/search');
    }
  };

  if (collapsed) {
    return (
      <Link
        href="/search"
        className="flex items-center justify-center w-full h-10 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-colors"
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
      </Link>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-3 pb-3">
      <div
        className={cn(
          'flex items-center gap-2 px-3 h-10 rounded-lg border transition-all duration-200',
          focused
            ? 'border-primary/40 bg-muted/20'
            : 'border-border/40 bg-muted/10 hover:border-border/60'
        )}
      >
        <Search className="w-4 h-4 shrink-0 text-muted-foreground/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search challenges, users..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 outline-none min-w-0"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </form>
  );
}

/* ─── Animated nav link ─── */

function NavLink({
  item,
  collapsed,
  onNav,
  isActive,
  activeRef,
}: {
  item: NavItem;
  collapsed: boolean;
  onNav: () => void;
  isActive: boolean;
  activeRef?: (el: HTMLAnchorElement | null) => void;
}) {
  return (
    <div className="relative">
      <Link
        ref={isActive ? activeRef : undefined}
        href={item.href}
        onClick={onNav}
        className={cn(
          'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/30'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="nav-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(26,238,255,0.4)]"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <item.icon className={cn('w-4.5 h-4.5 shrink-0 relative', isActive && 'text-primary')} />
        {!collapsed && (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary shrink-0">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    </div>
  );
}

/* ─── Sidebar content (extracted to prevent remount) ─── */

function SidebarContent({
  collapsed,
  collapsedSections,
  onToggleSection,
  pathname,
  user,
  profileData,
  initials,
  tier,
  onNav,
  onLogout,
  activeItemRef,
  navRef,
  onNavScroll,
}: {
  collapsed: boolean;
  collapsedSections: Record<string, boolean>;
  onToggleSection: (label: string) => void;
  pathname: string;
  user: any;
  profileData: any;
  initials: string;
  tier: Tier;
  onNav: () => void;
  onLogout: () => void;
  activeItemRef: (el: HTMLAnchorElement | null) => void;
  navRef?: React.Ref<HTMLDivElement>;
  onNavScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}) {
  const displayName = profileData?.username || user?.displayName || user?.email?.split('@')[0] || 'Player';

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="border-b border-border/50 shrink-0 p-3">
        <Link
          href="/"
          className={cn('flex items-center group', collapsed ? 'justify-center' : 'justify-center')}
        >
          <img
            src="/icons/icon.svg"
            alt="DevRann"
            className="h-10 w-10 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-3deg]"
          />
        </Link>
      </div>

      {/* Search */}
      <div className="border-b border-border/30 shrink-0 pt-3">
        <SidebarSearch collapsed={collapsed} />
      </div>

      {/* Guest badge */}
      {!user && !collapsed && (
        <div className="px-4 py-2 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded">
            <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Guest Mode</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav ref={navRef} onScroll={onNavScroll} className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {NAV_SECTIONS.map((section, idx) => {
          const sectionLabel = section.label || `section-${idx}`;
          const isCollapsed = collapsedSections[sectionLabel];
          const hasActive = section.items.some(
            (item) => pathname === item.href || pathname.startsWith(item.href + '/')
          );

          return (
            <div key={sectionLabel} className={cn('mb-0.5', hasActive && '')}>
              {section.label && !collapsed && (
                <button
                  onClick={() => onToggleSection(sectionLabel)}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-colors',
                    hasActive
                      ? 'text-primary/60'
                      : 'text-muted-foreground/40 hover:text-muted-foreground/70'
                  )}
                >
                  <span>{section.label}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
              {(!collapsed || !section.label) && (!section.label || !isCollapsed) && (
                <div className={cn('space-y-0.5', section.label && !collapsed ? 'mt-0.5' : '')}>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      collapsed={collapsed}
                      onNav={onNav}
                      isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                      activeRef={activeItemRef}
                    />
                  ))}
                </div>
              )}
              {collapsed && !section.label && (
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      collapsed={collapsed}
                      onNav={onNav}
                      isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                      activeRef={activeItemRef}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom profile / auth */}
      <div className={cn('border-t border-border/50 shrink-0', collapsed ? 'p-2' : 'p-3')}>
        {user ? (
          <div className="space-y-2">
            {!collapsed && profileData && (
              <div className="px-3 py-2.5 rounded-lg bg-muted/15 border border-border/30">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 shrink-0 border border-primary/30 ring-1 ring-primary/10">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-sm font-bold truncate">{displayName}</p>
                    <p className={cn('text-[10px] font-bold uppercase tracking-widest truncate', getTierColor(tier))}>
                      {tier}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors',
                collapsed ? 'justify-center px-0 h-10' : 'justify-start gap-2'
              )}
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </Button>
          </div>
        ) : (
          <div className={cn('space-y-2', collapsed && 'flex flex-col items-center')}>
            <Link
              href="/auth?mode=register"
              className={cn(
                'flex items-center justify-center gap-2 w-full h-10 text-sm font-headline font-bold text-background bg-primary hover:bg-primary/90 transition-colors uppercase tracking-wider rounded-lg',
                collapsed && 'w-10 h-10 p-0'
              )}
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              {!collapsed && 'Create Account'}
            </Link>
            <Link
              href="/auth?mode=login"
              className={cn(
                'flex items-center justify-center gap-2 w-full h-10 text-sm font-headline font-bold text-foreground border border-border hover:bg-muted transition-colors uppercase tracking-wider rounded-lg',
                collapsed && 'w-10 h-10 p-0'
              )}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!collapsed && 'Sign In'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shell ─── */

export function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [unread] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const {
    collapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
    collapsedSections,
    toggleSection,
    setScrollPosition,
  } = useSidebar();

  useEffect(() => {
    if (!firestore || !user) return;
    const ref = doc(firestore, 'users', user.uid);
    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
      })
      .catch(() => {});
  }, [firestore, user]);

  const profileData = profile;

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    router.push('/');
  };

  const initials = profileData?.username || user?.displayName || user?.email?.split('@')[0] || 'Player';
  const displayParts = initials.split(' ');
  const initialsStr = displayParts
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const tier = profileData ? getTier(profileData.rating) : 'Beginner';

  const closeMobile = useCallback(() => setIsMobileMenuOpen(false), []);

  /* save sidebar scroll position on scroll */
  const handleNavScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollPosition(e.currentTarget.scrollTop);
    },
    [setScrollPosition]
  );

  /* keep active nav item in view — only scroll if out of view, don't center aggressively */
  const activeItemRef = useCallback(
    (el: HTMLAnchorElement | null) => {
      if (!el) return;
      const nav = navRef.current;
      if (!nav) return;
      const navRect = nav.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      if (elRect.top < navRect.top || elRect.bottom > navRect.bottom) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    },
    []
  );

  /* restore sidebar scroll on mount */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const saved = sessionStorage.getItem('devrann-sidebar-scroll');
    if (saved) {
      nav.scrollTop = parseInt(saved, 10) || 0;
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border/50 bg-card/40 backdrop-blur-sm transition-all duration-300 relative',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent
          collapsed={sidebarCollapsed}
          collapsedSections={collapsedSections}
          onToggleSection={toggleSection}
          pathname={pathname}
          user={user}
          profileData={profileData}
          initials={initialsStr}
          tier={tier}
          onNav={closeMobile}
          onLogout={handleLogout}
          activeItemRef={activeItemRef}
          navRef={navRef}
          onNavScroll={handleNavScroll}
        />

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 p-1.5 rounded-full border border-border/40 hover:bg-muted/40 transition-colors hidden lg:block z-10 bg-card/70"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn(
              'w-4 h-4 text-muted-foreground/50 transition-transform duration-300',
              sidebarCollapsed && 'rotate-180'
            )}
          />
        </button>
      </aside>

      {/* Mobile sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
            <SidebarContent
              collapsed={false}
              collapsedSections={collapsedSections}
              onToggleSection={toggleSection}
              pathname={pathname}
              user={user}
              profileData={profileData}
              initials={initialsStr}
              tier={tier}
              onNav={closeMobile}
              onLogout={handleLogout}
              activeItemRef={activeItemRef}
            />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopHeader user={user} unread={unread} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
