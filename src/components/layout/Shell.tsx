'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Swords, Trophy, Settings, Menu, LogOut,
  Users, BarChart3, UserCircle, Bell, Search,
  ChevronLeft, Code2, LogIn, UserPlus, GraduationCap, BookOpen,
  Crown, Sparkles, Bug, Target, MessageCircle, MessageSquare,
  Share2, Globe, Eye,
  ChevronDown, X, Gem,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
      { href: '/practice', label: 'Practice', icon: Code2 },
      { href: '/arena', label: 'Arena', icon: Swords },
      { href: '/learning', label: 'Learn', icon: GraduationCap },
      { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { href: '/ai-mentor', label: 'AI Mentor', icon: Sparkles },
      { href: '/ai-code-review', label: 'Code Review', icon: Code2 },
      { href: '/problems', label: 'Problems', icon: BookOpen },
      { href: '/challenges', label: 'Challenges', icon: Target },
    ],
  },
  {
    label: 'LEARN',
    items: [
      { href: '/learn/concepts', label: 'Encyclopedia', icon: BookOpen },
      { href: '/analytics/learning', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { href: '/community', label: 'Feed', icon: MessageCircle },
      { href: '/hub', label: 'Hub', icon: Bug },
      { href: '/friends', label: 'Friends', icon: Users },
      { href: '/forum', label: 'Forum', icon: Globe },
      { href: '/code-share', label: 'Code Share', icon: Share2 },
      { href: '/chats', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    items: [
      { href: '/profile', label: 'Profile', icon: UserCircle },
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/monetization', label: 'Premium', icon: Crown },
    ],
  },
];

function TopHeader({ user, unread }: { user: any; unread: number }) {
  const [devCoinBalance, setDevCoinBalance] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    import('@/services/shop').then(({ getDevCoinBalance }) => {
      getDevCoinBalance(user.uid).then(setDevCoinBalance);
    });
  }, [user?.uid]);

  return (
    <div className="sticky top-0 z-40 flex items-center justify-end gap-3 px-6 h-12 border-b border-border/60 bg-background/80 backdrop-blur-sm shrink-0">
      {user && (
        <Link
          href="/shop"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/30 border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Gem className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{devCoinBalance.toLocaleString()}</span>
        </Link>
      )}
      <Link
        href="/notifications"
        className="relative p-1.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-[9px] font-semibold text-primary-foreground flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    </div>
  );
}

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
        className="flex items-center justify-center w-full h-9 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
      </Link>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-3 pb-2">
      <div
        className={cn(
          'flex items-center gap-2 px-2.5 h-9 rounded-md border transition-all duration-200',
          focused
            ? 'border-primary/40 bg-muted/20'
            : 'border-border/60 bg-muted/10 hover:border-border/80'
        )}
      >
        <Search className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search..."
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </form>
  );
}

function NavLink({
  item, collapsed, onNav, isActive, activeRef,
}: {
  item: NavItem;
  collapsed: boolean;
  onNav: () => void;
  isActive: boolean;
  activeRef?: (el: HTMLAnchorElement | null) => void;
}) {
  return (
    <Link
      ref={isActive ? activeRef : undefined}
      href={item.href}
      onClick={onNav}
      className={cn(
        'relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150',
        isActive
          ? 'text-foreground bg-secondary font-medium'
          : 'text-muted-foreground/80 hover:text-foreground hover:bg-muted/50'
      )}
    >
      <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground/70')} />
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function SidebarContent({
  collapsed, collapsedSections, onToggleSection, pathname,
  user, profileData, initials, tier, onNav, onLogout,
  activeItemRef, navRef, onNavScroll,
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
      <div className="shrink-0 px-3 py-2.5 border-b border-border/50">
        <Link
          href="/"
          className="flex items-center justify-center"
        >
          <img
            src="/logo.svg"
            alt="DevRann"
            className="h-9 w-9 shrink-0"
          />
        </Link>
      </div>

      <div className="shrink-0 pt-2">
        <SidebarSearch collapsed={collapsed} />
      </div>

      {!user && !collapsed && (
        <div className="px-4 py-2 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-muted/30 border border-border/70 rounded-md">
            <Eye className="w-3 h-3 text-muted-foreground/80 shrink-0" />
            <span className="text-[10px] font-medium text-muted-foreground">Guest Mode</span>
          </div>
        </div>
      )}

      <nav ref={navRef} onScroll={onNavScroll} className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin">
        {NAV_SECTIONS.map((section, idx) => {
          const sectionLabel = section.label || `section-${idx}`;
          const isCollapsed = collapsedSections[sectionLabel];
          const hasActive = section.items.some(
            (item) => pathname === item.href || pathname.startsWith(item.href + '/')
          );
          const showLabel = section.label && !collapsed;
          const showItems = !section.label || !isCollapsed || collapsed;

          return (
            <div key={sectionLabel} className="mb-px">
              {showLabel && (
                <button
                  onClick={() => onToggleSection(sectionLabel)}
                  className={cn(
                    'flex items-center justify-between w-full px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors',
                    hasActive
                      ? 'text-primary/60'
                      : 'text-muted-foreground/60 hover:text-muted-foreground/80'
                  )}
                >
                  <span>{section.label}</span>
                  <ChevronDown
                    className={cn(
                      'w-2.5 h-2.5 transition-transform duration-200',
                      isCollapsed && '-rotate-90'
                    )}
                  />
                </button>
              )}
              <AnimatePresence initial={false}>
                {showItems && (
                  <motion.div
                    key={sectionLabel}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12, ease: 'easeOut' }}
                  >
                    <div className={cn('space-y-0.5', showLabel && 'mt-0.5')}>
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className={cn('border-t border-border/50 shrink-0', collapsed ? 'p-2' : 'p-3')}>
        {user ? (
          <div className="space-y-1.5">
            {!collapsed && profileData && (
              <div className="px-3 py-2 rounded-md bg-muted/20 border border-border/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0 border border-primary/20 ring-1 ring-primary/5">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-xs font-semibold truncate">{displayName}</p>
                    <p className={cn('text-[10px] font-medium truncate', getTierColor(tier))}>
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
                'w-full text-muted-foreground/70 hover:text-destructive hover:bg-destructive/20 transition-colors',
                collapsed ? 'justify-center px-0 h-9' : 'justify-start gap-2'
              )}
              onClick={onLogout}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span className="text-xs">Logout</span>}
            </Button>
          </div>
        ) : (
          <div className={cn('space-y-1.5', collapsed && 'flex flex-col items-center')}>
            <Link
              href="/auth?mode=register"
              className={cn(
                'flex items-center justify-center gap-2 w-full h-9 text-xs font-semibold text-background bg-primary hover:bg-primary/90 transition-colors rounded-md',
                collapsed && 'w-9 h-9 p-0'
              )}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && 'Create Account'}
            </Link>
            <Link
              href="/auth?mode=login"
              className={cn(
                'flex items-center justify-center gap-2 w-full h-9 text-xs font-semibold text-foreground border border-border/80 hover:bg-muted/60 hover:border-border transition-colors rounded-md',
                collapsed && 'w-9 h-9 p-0'
              )}
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && 'Sign In'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

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
      .catch((err) => console.error('[Shell] Failed to load user profile', err));
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

  const handleNavScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollPosition(e.currentTarget.scrollTop);
    },
    [setScrollPosition]
  );

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
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border/60 bg-card/50 transition-all duration-200 relative',
          sidebarCollapsed ? 'w-14' : 'w-60'
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

        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 p-1 rounded-full border border-border/50 hover:bg-muted/50 hover:border-border transition-colors hidden lg:block z-10 bg-card/80"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn(
              'w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200',
              sidebarCollapsed && 'rotate-180'
            )}
          />
        </button>
      </aside>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-50"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
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

      <div className="flex flex-col flex-1 min-w-0">
        <TopHeader user={user} unread={unread} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto px-6 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
