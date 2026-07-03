'use client';

import { ShopManager } from '@/components/admin/ShopManager';

export default function AdminShopPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-headline font-black uppercase tracking-tighter">Shop Management</h2>
        <span className="text-[10px] text-muted-foreground font-mono">Manage shop items and inventory</span>
      </div>
      <ShopManager />
    </div>
  );
}
