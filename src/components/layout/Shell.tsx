'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Swords,
  Trophy,
  BookOpen,
  Settings,
  Zap,
  Menu,
  LogOut,
  Users,
  Target,
  Calendar,
  BarChart3,
  UserCircle,
  Bell,
  Search,
  Gamepad2,
  Medal,
  ChevronLeft,
  Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { getAuth, signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { getTier, getTierColor } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/arena', label: 'Arena', icon: Swords },
  { href: '/practice', label: 'Practice', icon: Code2 },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/contests', label: 'Contests', icon: Calendar },
  { href: '/challenges', label: 'Challenges', icon: Target },
  { href: '/rooms', label: 'Rooms', icon: Gamepad2 },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/achievements', label: 'Achievements', icon: Medal },
  { href: '/profile', label: 'Profile', icon: UserCircle },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { data: profile } = useDoc(user ? `users/${user.uid}` : null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const profileData = profile as any;

  const handleLogout = async () => {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('mock_user') !== null;
    if (isDemo) {
      localStorage.removeItem('mock_user');
      window.dispatchEvent(new Event('mock-auth-change'));
    } else {
      await getAuth().signOut();
    }
    router.push('/auth');
  };

  const initials = (profileData?.username || user?.displayName || user?.email || '?')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const tier = profileData ? getTier(profileData.rating) : 'Beginner';

  const NavLink = ({ item }: { item: typeof NAV_ITEMS[number] }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
          isActive
            ? 'bg-primary/10 text-primary border-l-2 border-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent'
        )}
      >
        <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-primary')} />
        {!sidebarCollapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary fill-primary" />
          {!sidebarCollapsed && (
            <span className="text-lg font-headline font-bold tracking-tight">
              CODEZ<span className="text-primary">ARENA</span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        {!sidebarCollapsed && profileData && (
          <div className="px-3 py-2 mb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-primary/30">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">
                  {profileData?.username || user?.displayName || 'Player'}
                </p>
                <p className={cn('text-[10px] font-bold uppercase tracking-widest', getTierColor(tier))}>
                  {tier}
                </p>
              </div>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          {!sidebarCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 p-1 rounded-full border border-border hover:bg-muted transition-colors hidden lg:block"
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
