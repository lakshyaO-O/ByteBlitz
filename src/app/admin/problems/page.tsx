'use client';

import { ProblemsManager } from '@/components/admin/ProblemsManager';

export default function AdminProblemsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-headline font-black uppercase tracking-tighter">Problem Management</h2>
        <span className="text-[10px] text-muted-foreground font-mono">Create, edit, and manage problems</span>
      </div>
      <ProblemsManager />
    </div>
  );
}
