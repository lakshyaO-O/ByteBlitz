'use client';

import Link from 'next/link';
import { Search, ExternalLink } from 'lucide-react';
import { UsersManager } from '@/components/admin/UsersManager';

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-headline font-black uppercase tracking-tighter">User Management</h2>
          <span className="text-[10px] text-muted-foreground font-mono">Manage all platform users</span>
        </div>
        <Link
          href="/admin/users/inspector"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md border border-border hover:bg-foreground/[0.02]"
        >
          <Search className="w-3 h-3" />
          Inspector
          <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </div>
      <UsersManager />
    </div>
  );
}
