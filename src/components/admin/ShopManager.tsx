'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search, X, Plus, Loader2, RefreshCw, Trash2, Edit3, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fetchShopItems, createShopItem, updateShopItem, deleteShopItem } from '@/services/admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { ShopItemType, ShopRarity } from '@/types';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  price: number;
  currency: string;
  rarity: ShopRarity;
  available: boolean;
  limited?: boolean;
  seasonal?: boolean;
  featured?: boolean;
  color?: string;
  imageUrl?: string;
  createdAt?: string;
}

const RARITY_COLORS: Record<ShopRarity, string> = {
  common: 'text-muted-foreground',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
  mythic: 'text-destructive',
};

const ITEM_TYPES: ShopItemType[] = [
  'avatar_frame', 'profile_theme', 'name_color', 'badge', 'title',
  'code_ace_skin', 'loading_theme', 'chat_emoji', 'arena_effect',
  'profile_background', 'seasonal_collectible',
];

export function ShopManager() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [editItem, setEditItem] = useState<ShopItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ShopItem>>({
    name: '', description: '', type: 'badge', price: 100, rarity: 'common', currency: 'devcoins',
  });

  const loadItems = useCallback(async () => {
    setLoading(true);
    const data = await fetchShopItems();
    setItems(data as ShopItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filtered = useMemo(() => {
    let f = items;
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(i => i.name?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') f = f.filter(i => i.type === typeFilter);
    if (rarityFilter !== 'all') f = f.filter(i => i.rarity === rarityFilter);
    return f;
  }, [items, search, typeFilter, rarityFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shop item?')) return;
    await deleteShopItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleCreate = async () => {
    if (!newItem.name || !newItem.price) return;
    const id = await createShopItem({ ...newItem, available: true });
    if (id) {
      await loadItems();
      setIsCreating(false);
      setNewItem({ name: '', description: '', type: 'badge', price: 100, rarity: 'common', currency: 'devcoins' });
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    await updateShopItem(editItem.id, editItem);
    setItems(prev => prev.map(i => i.id === editItem.id ? editItem : i));
    setEditItem(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-8 h-8 text-xs bg-muted/50 border-border"
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
          className="h-8 px-2 text-xs bg-muted/50 border border-border rounded font-mono"
        >
          <option value="all">All Types</option>
          {ITEM_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={rarityFilter}
          onChange={e => setRarityFilter(e.target.value)}
          className="h-8 px-2 text-xs bg-muted/50 border border-border rounded font-mono"
        >
          <option value="all">All Rarities</option>
          {(['common', 'rare', 'epic', 'legendary', 'mythic'] as ShopRarity[]).map(r => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={loadItems} className="h-8 gap-1 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
        <Button variant="default" size="sm" onClick={() => setIsCreating(true)} className="h-8 gap-1 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Item
        </Button>
        <span className="text-[10px] text-muted-foreground font-mono">{filtered.length} items</span>
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-headline">Create Shop Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[10px]">Name</Label>
              <Input className="h-8 text-xs mt-1" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name" />
            </div>
            <div>
              <Label className="text-[10px]">Description</Label>
              <Input className="h-8 text-xs mt-1" value={newItem.description || ''} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[10px]">Type</Label>
                <select
                  value={newItem.type}
                  onChange={e => setNewItem({ ...newItem, type: e.target.value as ShopItemType })}
                  className="w-full mt-1 h-8 px-2 text-xs bg-background border border-border rounded font-mono"
                >
                  {ITEM_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-[10px]">Rarity</Label>
                <select
                  value={newItem.rarity}
                  onChange={e => setNewItem({ ...newItem, rarity: e.target.value as ShopRarity })}
                  className="w-full mt-1 h-8 px-2 text-xs bg-background border border-border rounded font-mono"
                >
                  {(['common', 'rare', 'epic', 'legendary', 'mythic'] as ShopRarity[]).map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[10px]">Price</Label>
                <Input className="h-8 text-xs mt-1" type="number" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label className="text-[10px]">Color (hex)</Label>
              <Input className="h-8 text-xs mt-1" value={newItem.color || ''} onChange={e => setNewItem({ ...newItem, color: e.target.value })} placeholder="#FFFFFF" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)} className="text-xs">Cancel</Button>
              <Button size="sm" onClick={handleCreate} className="text-xs">Create Item</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(item => (
          <Card key={item.id} className={cn('bg-card/50 border-border hover:border-primary/30 transition-colors', !item.available && 'opacity-50')}>
            <CardContent className="p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {item.featured && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                    <h3 className="text-sm font-bold truncate">{item.name}</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setEditItem({ ...item })}>
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-sm font-headline">Edit Item</DialogTitle>
                      </DialogHeader>
                      {editItem && editItem.id === item.id && (
                        <div className="space-y-3 py-2">
                          <div>
                            <Label className="text-[10px]">Name</Label>
                            <Input className="h-8 text-xs mt-1" value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} />
                          </div>
                          <div>
                            <Label className="text-[10px]">Description</Label>
                            <Input className="h-8 text-xs mt-1" value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-[10px]">Type</Label>
                              <select value={editItem.type} onChange={e => setEditItem({ ...editItem, type: e.target.value as ShopItemType })}
                                className="w-full mt-1 h-8 px-2 text-xs bg-background border border-border rounded font-mono">
                                {ITEM_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                              </select>
                            </div>
                            <div>
                              <Label className="text-[10px]">Rarity</Label>
                              <select value={editItem.rarity} onChange={e => setEditItem({ ...editItem, rarity: e.target.value as ShopRarity })}
                                className="w-full mt-1 h-8 px-2 text-xs bg-background border border-border rounded font-mono">
                                {(['common', 'rare', 'epic', 'legendary', 'mythic'] as ShopRarity[]).map(r => (
                                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label className="text-[10px]">Price</Label>
                              <Input className="h-8 text-xs mt-1" type="number" value={editItem.price} onChange={e => setEditItem({ ...editItem, price: parseInt(e.target.value) || 0 })} />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => setEditItem(null)} className="text-xs">Cancel</Button>
                            <Button size="sm" onClick={handleSaveEdit} className="text-xs">Save</Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={cn('text-[8px] font-mono', RARITY_COLORS[item.rarity])}>
                  {item.rarity}
                </Badge>
                <span className="text-xs font-mono font-bold">{item.price} <span className="text-[9px] text-muted-foreground font-normal">DC</span></span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="font-mono uppercase tracking-wider">{item.type.replace(/_/g, ' ')}</span>
                <span>·</span>
                <span>{item.available ? 'Available' : 'Hidden'}</span>
                {item.limited && <><span>·</span><span className="text-yellow-400">Limited</span></>}
              </div>
              {item.color && (
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: item.color }} />
                  <span className="text-[9px] font-mono text-muted-foreground">{item.color}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
