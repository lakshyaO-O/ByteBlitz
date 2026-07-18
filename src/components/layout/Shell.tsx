'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Swords, Trophy, Settings, Menu, LogOut,
  Users, BarChart3, UserCircle, Bell, Search,
  ChevronLeft, Code2, LogIn, UserPlus, GraduationCap,
  Crown, Sparkles, Bug, Target, MessageCircle, MessageSquare,
  Share2, Globe, BookOpen, Gem, X, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase/provider';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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

// ---- Page Transition Wrapper ----

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ---- Top Header ----

function TopHeader({ user, unread }: { user: any; unread: number }) {
  const [devCoinBalance, setDevCoinBalance] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    import('@/services/shop').then(({ getDevCoinBalance }) => {
      getDevCoinBalance(user.uid).then(setDevCoinBalance);
    });
  }, [user?.uid]);

  return (
    <div className="sticky top-0 z-40 flex items-center justify-end gap-2 px-6 h-11 border-b border-border/40 bg-background/70 backdrop-blur-lg shrink-0">
      {user && (
        <Link
          href="/shop"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/30 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all hover-lift"
        >
          <Gem className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{devCoinBalance.toLocaleString()}</span>
        </Link>
      )}
      <Link
        href="/notifications"
        className="relative p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary ring-2 ring-background animate-pulse-soft" />
        )}
      </Link>
    </div>
  );
}

// ---- Sidebar Search ----

function SidebarSearch({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query.trim() || '')}`);
  };

  if (collapsed) {
    return (
      <Link
        href="/search"
        className="flex items-center justify-center h-9 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all mx-2"
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
          'flex items-center gap-2 px-2.5 h-9 rounded-lg border transition-all duration-200',
          focused
            ? 'border-primary/30 bg-muted/20 shadow-sm shadow-primary/5'
            : 'border-border/50 bg-muted/10 hover:border-border/70 hover:bg-muted/20'
        )}
      >
        <Search className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search..."
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none min-w-0"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </form>
  );
}

// ---- Nav Link ----

function NavLink({
  item, collapsed, onNav, isActive, index,
}: {
  item: NavItem;
  collapsed: boolean;
  onNav: () => void;
  isActive: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2, ease: 'easeOut' }}
    >
      <Link
        href={item.href}
        onClick={onNav}
        className={cn(
          'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 group',
          isActive
            ? 'text-foreground bg-primary/10 font-medium'
            : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/50'
        )}
      >
        {isActive && (
          <motion.span
            layoutId="sidebar-active-pill"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary shadow-sm shadow-primary/50"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <item.icon className={cn(
          'w-4 h-4 shrink-0 transition-all duration-200',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground/60 group-hover:text-foreground/80 group-hover:scale-110 group-hover:-rotate-3'
        )} />
        {!collapsed && (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <Badge variant="default" className="ml-auto text-[10px] px-1.5 py-0">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    </motion.div>
  );
}

// ---- Sidebar Content ----

function SidebarContent({
  collapsed, collapsedSections, onToggleSection, pathname,
  user, profileData, initials, tier, onNav, onLogout,
  navRef, onNavScroll, isMobile,
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
  navRef?: React.Ref<HTMLDivElement>;
  onNavScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  isMobile?: boolean;
}) {
  const displayName = profileData?.username || user?.displayName || user?.email?.split('@')[0] || 'Player';

  const sectionHasActive = useCallback((section: NavSection) => {
    return section.items.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/')
    );
  }, [pathname]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-3 py-4 border-b border-border/40">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <img src="/logo.svg" alt="DevRann" className="h-5 w-5" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-bold tracking-tight text-foreground"
            >
              DevRann
            </motion.span>
          )}
        </Link>
      </div>

      <div className="shrink-0 pt-3">
        <SidebarSearch collapsed={collapsed} />
      </div>

      {!user && !collapsed && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse-soft" />
            <span className="text-[11px] font-medium text-muted-foreground/70">Guest Mode</span>
          </div>
        </div>
      )}

      <nav ref={navRef} onScroll={onNavScroll} className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-thin">
        {NAV_SECTIONS.map((section, idx) => {
          const sectionLabel = section.label || `section-${idx}`;
          const isCollapsed = collapsedSections[sectionLabel];
          const hasActive = sectionHasActive(section);
          const showItems = !section.label || !isCollapsed || collapsed;

          return (
            <motion.div
              key={sectionLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.2 }}
              className="mb-0.5"
            >
              {section.label && !collapsed && (
                <button
                  onClick={() => onToggleSection(sectionLabel)}
                  className={cn(
                    'flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-widest transition-all',
                    hasActive
                      ? 'text-primary/70'
                      : 'text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-muted/30'
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
                    initial={false}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                  >
                    <div className="space-y-0.5">
                      {section.items.map((item, itemIdx) => (
                        <NavLink
                          key={item.href}
                          item={item}
                          collapsed={collapsed}
                          onNav={onNav}
                          isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                          index={itemIdx}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </nav>

      <div className={cn('border-t border-border/40 shrink-0', collapsed ? 'p-2' : 'p-3')}>
        {user ? (
          <div className="space-y-1.5">
            {!collapsed && profileData && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-gradient-to-b from-muted/30 to-muted/10 border border-border/50"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/15">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate leading-tight">{displayName}</p>
                    <p className={cn('text-[10px] font-medium truncate leading-tight mt-0.5', getTierColor(tier))}>
                      {tier}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'sm'}
              className={cn(
                'w-full text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all',
                collapsed ? 'h-9' : 'justify-start gap-2'
              )}
              onClick={onLogout}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span className="text-xs">Logout</span>}
            </Button>
          </div>
        ) : (
          <div className={cn('space-y-1.5', collapsed && 'flex flex-col items-center gap-1')}>
            <Link
              href="/auth?mode=register"
              className={cn(
                'flex items-center justify-center gap-2 w-full h-9 text-xs font-semibold text-background bg-primary hover:bg-primary/85 transition-all rounded-lg shadow-sm shadow-primary/10',
                collapsed && 'w-9 h-9 rounded-lg p-0'
              )}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && 'Create Account'}
            </Link>
            <Link
              href="/auth?mode=login"
              className={cn(
                'flex items-center justify-center gap-2 w-full h-9 text-xs font-semibold text-foreground border border-border/70 hover:bg-muted/50 hover:border-border transition-all rounded-lg',
                collapsed && 'w-9 h-9 rounded-lg p-0'
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

// ---- Collapse Toggle ----

function CollapseToggle({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-border/40 bg-card shadow-sm hover:bg-muted hover:shadow-md hover:border-border/60 transition-all z-10 hidden lg:flex items-center justify-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <ChevronLeft
        className={cn(
          'w-3 h-3 text-muted-foreground/60 transition-transform duration-200',
          collapsed && 'rotate-180'
        )}
      />
    </motion.button>
  );
}

// ---- Shell Main ----

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
  const initialsStr = initials
    .split(' ')
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
      {/* Desktop Sidebar */}
      <motion.aside
        layout
        className={cn(
          'hidden lg:flex flex-col border-r border-border/40 bg-card/30 transition-all duration-200 relative',
          sidebarCollapsed ? 'w-[57px]' : 'w-60'
        )}
        animate={{ width: sidebarCollapsed ? 57 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
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
          navRef={navRef}
          onNavScroll={handleNavScroll}
        />

        <CollapseToggle
          collapsed={sidebarCollapsed}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </motion.aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-2.5 left-3 z-50 h-8 w-8"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 border-r border-border/40">
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
            isMobile
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopHeader user={user} unread={unread} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto px-6 py-6 lg:py-8 max-w-7xl">
            <PageTransition key={pathname}>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
