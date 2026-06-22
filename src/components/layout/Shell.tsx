import React from 'react';
import Link from 'next/link';
import { Sword, LayoutDashboard, Trophy, BookOpen, User, Settings, Zap } from 'lucide-react';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-md flex flex-col hidden md:flex">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-md neon-glow">
              <Zap className="h-6 w-6 text-background fill-background" />
            </div>
            <span className="text-2xl font-headline font-bold tracking-tight text-primary neon-text">
              BYTEBLITZ
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
          <NavItem href="/arena" icon={<Sword className="w-5 h-5" />} label="Arena" active />
          <NavItem href="/leaderboard" icon={<Trophy className="w-5 h-5" />} label="Leaderboards" />
          <NavItem href="/problems" icon={<BookOpen className="w-5 h-5" />} label="Practice" />
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-secondary neon-glow overflow-hidden">
              <img src="https://picsum.photos/seed/user123/100/100" alt="Avatar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">CodeRunnerX</p>
              <p className="text-xs text-muted-foreground">1642 ELO • Pro</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <h1 className="font-headline text-lg font-semibold uppercase tracking-widest text-muted-foreground">
              Current Environment: <span className="text-foreground">Global Arena</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs font-mono border border-border">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              1,248 CODERS ONLINE
            </div>
            <button className="p-2 hover:bg-muted rounded-md transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
        active 
          ? "bg-primary/10 text-primary neon-border" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <span className={cn(active ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors")}>
        {icon}
      </span>
      {label}
      {active && <div className="ml-auto w-1 h-4 bg-primary rounded-full neon-glow" />}
    </Link>
  );
}

import { cn } from '@/lib/utils';
