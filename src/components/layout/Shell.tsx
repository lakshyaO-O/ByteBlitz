'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Swords, Trophy, Settings, Menu, LogOut,
  Users, BarChart3, UserCircle, Bell, Search, Gamepad2,
  ChevronLeft, Code2, LogIn, UserPlus, GraduationCap,
  Crown, Sparkles, Bug, Brain, Briefcase, MessageCircle,
  Share2, Globe, Rocket, Store, MessageSquare, Eye,
  ChevronDown, ChevronRight, Lightbulb,
} from 'lucide-react';
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

interface NavSection {
  label?: string;
  items: Array<{
    href: string;
    label: string;
    icon: any;
    badge?: string;
  }>;
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
      { href: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    items: [
      { href: '/profile', label: 'My Profile', icon: UserCircle },
      { href: '/monetization', label: 'Premium', icon: Crown },
      { href: '/search', label: 'Search', icon: Search },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!firestore || !user) return;
    const ref = doc(firestore, 'users', user.uid);
    getDoc(ref).then((snap) => {
      if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
    }).catch(() => {});
  }, [firestore, user]);

  const profileData = profile;

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    router.push('/');
  };

  const displayName = profileData?.username || user?.displayName || user?.email?.split('@')[0] || 'Player';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const tier = profileData ? getTier(profileData.rating) : 'Beginner';

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (label: string) => {
    setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const NavLink = ({ item }: { item: NavSection['items'][number] }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        href={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
          isActive
            ? 'bg-primary/15 text-primary border-l-2 border-primary shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-l-2 border-transparent'
        )}
      >
        <item.icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
        {item.badge && !sidebarCollapsed && (
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">{item.badge}</span>
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={cn('border-b border-border shrink-0', sidebarCollapsed ? 'p-3' : 'p-3')}>
        <Link href="/" className={cn(
          'flex items-center group',
          sidebarCollapsed ? 'justify-center' : 'justify-center'
        )}>
          <img src="/icons/icon.svg" alt="DevRann" className="h-[34px] w-[34px] shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-3deg]" />
        </Link>
      </div>

      {!user && !sidebarCollapsed && (
        <div className="px-4 py-2 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded">
            <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Guest Mode</span>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
        {NAV_SECTIONS.map((section, idx) => {
          const sectionLabel = section.label || `section-${idx}`;
          const isCollapsed = collapsedSections[sectionLabel];
          return (
            <div key={sectionLabel} className="mb-1">
              {section.label && !sidebarCollapsed && (
                <button
                  onClick={() => toggleSection(sectionLabel)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
                >
                  <span>{section.label}</span>
                  {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
              {(!sidebarCollapsed || !section.label) && (!section.label || !isCollapsed) && (
                <div className={cn('space-y-0.5', section.label && !sidebarCollapsed ? 'mt-0' : '')}>
                  {section.items.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </div>
              )}
              {sidebarCollapsed && !section.label && (
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className={cn(
        'border-t border-border shrink-0',
        sidebarCollapsed ? 'p-2' : 'p-3'
      )}>
        {user ? (
          <div className="space-y-2">
            {!sidebarCollapsed && profileData && (
              <div className="px-3 py-2 rounded-lg bg-muted/20">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 shrink-0 border border-primary/30">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-sm font-bold truncate">
                      {displayName}
                    </p>
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
                'w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                sidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-2'
              )}
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </Button>
          </div>
        ) : (
          <div className={cn('space-y-2', sidebarCollapsed && 'flex flex-col items-center')}>
            <Link
              href="/auth?mode=register"
              className={cn(
                'flex items-center justify-center gap-2 w-full h-10 text-sm font-headline font-bold text-background bg-primary hover:bg-primary/90 transition-colors uppercase tracking-wider rounded-lg',
                sidebarCollapsed && 'w-10 h-10 p-0'
              )}
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && 'Create Account'}
            </Link>
            <Link
              href="/auth?mode=login"
              className={cn(
                'flex items-center justify-center gap-2 w-full h-10 text-sm font-headline font-bold text-foreground border border-border hover:bg-muted transition-colors uppercase tracking-wider rounded-lg',
                sidebarCollapsed && 'w-10 h-10 p-0'
              )}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && 'Sign In'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 relative',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 p-1.5 rounded-full border border-border hover:bg-muted transition-colors hidden lg:block z-10 bg-card/80"
        >
          <ChevronLeft
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
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
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
