'use client';

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border transition-all duration-200',
          collapsed ? 'w-[52px]' : 'w-[220px]',
        )}
      >
        <AdminSidebar collapsed={collapsed} />
      </aside>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <button className="lg:hidden fixed top-3 left-3 z-50 p-1.5 rounded-md border border-border bg-background hover:bg-foreground/[0.02] transition-colors">
            <Menu className="w-4 h-4 text-foreground/60" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] p-0">
          <AdminSidebar collapsed={false} onNav={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
