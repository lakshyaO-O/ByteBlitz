'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Search, X, Trash2, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAuth } from 'firebase/auth';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

export default function CommunityPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getToken = useCallback(async () => {
    const auth = getAuth();
    return await auth.currentUser?.getIdToken();
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/admin/community?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [typeFilter, getToken]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/admin/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'delete',
          targetId: deleteTarget.id,
          targetType: deleteTarget.type,
        }),
      });

      if (res.ok) {
        setItems(prev => prev.filter(p => p.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const filtered = items.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.content?.toLowerCase().includes(q) ||
      item.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Community</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage community posts and forum threads</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
          <Input
            placeholder="Search posts and threads..."
            className="pl-8 h-8 text-xs"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="h-8 px-2 text-xs bg-background border border-border rounded"
        >
          <option value="all">All Types</option>
          <option value="post">Posts</option>
          <option value="thread">Threads</option>
        </select>
        <span className="text-[10px] text-muted-foreground">{filtered.length} items</span>
      </div>

      <div className="rounded-lg border border-border divide-y divide-border">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-foreground/40" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No community content found</p>
          </div>
        ) : (
          filtered.map((item: any) => (
            <div key={item.id} className="flex items-start justify-between px-3 py-3 hover:bg-foreground/[0.02] transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="outline" className="text-[9px] font-medium text-muted-foreground">
                    {item.type === 'post' ? 'Post' : 'Thread'}
                  </Badge>
                  <span className="text-xs font-medium text-foreground truncate">{item.title || 'Untitled'}</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{item.content || ''}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/60">
                  <span>{item.username || 'Unknown'}</span>
                  <span>·</span>
                  <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</span>
                  {item.type === 'post' && item.likes !== undefined && (
                    <>
                      <span>·</span>
                      <span>{item.likes} likes</span>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-foreground/30 hover:text-red-500 hover:bg-red-500/5 h-7 w-7 p-0 ml-2"
                onClick={() => setDeleteTarget({ id: item.id, type: item.type, label: item.title || item.id })}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Content"
        description={`Permanently delete "${deleteTarget?.label || ''}"? This action is irreversible.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
