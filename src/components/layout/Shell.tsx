'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Sword, 
  LayoutDashboard, 
  Trophy, 
  BookOpen, 
  Settings, 
  Zap, 
  Menu,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useDoc } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { data: profile } = useDoc(user ? `/users/${user.uid}` : null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const stats = profile || {
    username: user?.displayName || 'Architect',
    rating: 1000,
    tier: 'Beginner'
  };

  const handleLogout = async () => {
    try {
      const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('mock_user') !== null;
      if (isDemoMode) {
        localStorage.removeItem('mock_user');
        window.dispatchEvent(new Event('mock-auth-change'));
        router.push('/auth');
        return;
      }
      const auth = getAuth();
      await signOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { href: '/arena', icon: <Sword className="w-5 h-5" />, label: 'Arena' },
    { href: '/leaderboard', icon: <Trophy className="w-5 h-5" />, label: 'Leaderboards' },
    { href: '/problems', icon: <BookOpen className="w-5 h-5" />, label: 'Practice' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <aside className="w-64 border-r border-border bg-card/30 backdrop-blur-md flex flex-col hidden md:flex">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-md">
              <Zap className="h-6 w-6 text-background fill-background" />
            </div>
            <span className="text-2xl font-headline font-bold tracking-tight text-primary">
              CODEZARENA
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavItem 
              key={item.href} 
              href={item.href} 
              icon={item.icon} 
              label={item.label} 
              active={pathname === item.href} 
            />
          ))}
        </nav>

        <div className="p-4 border-t border-border mt-auto space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
              <img 
                src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/100/100`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{stats.username}</p>
              <p className="text-xs text-muted-foreground">{stats.rating} ELO</p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Logout</span>
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-background border-r border-border p-0 w-72">
                <SheetHeader className="p-6 border-b border-border text-left">
                  <SheetTitle className="flex items-center gap-2">
                    <Zap className="h-6 w-6 text-primary" />
                    <span className="text-xl font-headline font-bold text-primary">CODEZARENA</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="p-4 space-y-2">
                  {navItems.map((item) => (
                    <NavItem 
                      key={item.href} 
                      href={item.href} 
                      icon={item.icon} 
                      label={item.label} 
                      active={pathname === item.href} 
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <h1 className="font-headline text-sm md:text-lg font-semibold uppercase tracking-widest text-muted-foreground truncate">
              Global Arena
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-[10px] md:text-xs font-mono border border-border">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              LIVE OPS
            </div>
            <button className="p-2 hover:bg-muted rounded-md transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ 
  href, 
  icon, 
  label, 
  active = false,
  onClick
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
        active 
          ? "bg-primary/10 text-primary border border-primary/20" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <span className={cn(active ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors")}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
