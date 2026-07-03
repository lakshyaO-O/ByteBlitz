'use client';

import { UsersManager } from '@/components/admin/UsersManager';

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-headline font-black uppercase tracking-tighter">User Management</h2>
        <span className="text-[10px] text-muted-foreground font-mono">Manage all platform users</span>
      </div>
      <UsersManager />
    </div>
  );
}
