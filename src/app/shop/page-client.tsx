'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  ShoppingBag, Coins, Sparkles, Palette, Award, User, Zap,
  Star, Shield, Sword, Heart, Eye, Filter, Loader2,
  CheckCircle2, Clock, Frame, Sun, Type, Gamepad2, MessageSquare,
  SwordIcon, Image as ImageIcon, Gem, Search, ArrowUpDown, X, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useDevCoins, useShopItems, useFeaturedItems, useInventory, usePurchase } from '@/hooks/use-shop';
import { ShopItemDetail } from '@/components/shop/ShopItemDetail';
import type { ShopItem, ShopItemType } from '@/types';

const CATEGORIES: { id: ShopItemType | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <ShoppingBag className="w-3 h-3" /> },
  { id: 'avatar_frame', label: 'Frames', icon: <Frame className="w-3 h-3" /> },
  { id: 'profile_theme', label: 'Themes', icon: <Palette className="w-3 h-3" /> },
  { id: 'name_color', label: 'Name Colors', icon: <Type className="w-3 h-3" /> },
  { id: 'badge', label: 'Badges', icon: <Award className="w-3 h-3" /> },
  { id: 'title', label: 'Titles', icon: <User className="w-3 h-3" /> },
  { id: 'code_ace_skin', label: 'CodeAce', icon: <Gamepad2 className="w-3 h-3" /> },
  { id: 'loading_theme', label: 'Loaders', icon: <Clock className="w-3 h-3" /> },
  { id: 'chat_emoji', label: 'Emojis', icon: <MessageSquare className="w-3 h-3" /> },
  { id: 'arena_effect', label: 'Effects', icon: <Zap className="w-3 h-3" /> },
  { id: 'profile_background', label: 'Backgrounds', icon: <ImageIcon className="w-3 h-3" /> },
  { id: 'seasonal_collectible', label: 'Seasonal', icon: <Sparkles className="w-3 h-3" /> },
];

const RARITY_ORDER: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
const RARITY_COLORS: Record<string, string> = {
  common: 'text-muted-foreground border-muted-foreground/30',
  rare: 'text-blue-400 border-blue-400/30',
  epic: 'text-purple-400 border-purple-400/30',
  legendary: 'text-orange-400 border-orange-400/30',
  mythic: 'text-red-400 border-red-400/30',
};
const RARITY_BGS: Record<string, string> = {
  common: 'bg-muted/30',
  rare: 'bg-blue-500/10',
  epic: 'bg-purple-500/10',
  legendary: 'bg-orange-500/10',
  mythic: 'bg-red-500/10',
};

export function ShopPageClient() {
  const [activeTab, setActiveTab] = useState('shop');
  const [category, setCategory] = useState<ShopItemType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rarity'>('price-asc');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  const { balance, loading: balanceLoading } = useDevCoins();
  const { items: shopItems, loading: itemsLoading } = useShopItems(category === 'all' ? undefined : category);
  const { items: featuredItems, loading: featuredLoading } = useFeaturedItems();
  const { ownedItems, loading: invLoading, equip, unequip, refresh: refreshInv } = useInventory();
  const { buy, loading: buying, error: buyError, clearError } = usePurchase();

  const ownedIds = useMemo(() => new Set(ownedItems.map(i => i.id)), [ownedItems]);
  const equippedMap = useMemo(() => {
    const inv = ownedItems.reduce((acc, item) => {
      acc[item.id] = false;
      return acc;
    }, {} as Record<string, boolean>);
    return inv;
  }, [ownedItems]);

  const filteredItems = useMemo(() => {
    let items = [...shopItems];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
      );
    }
    if (sortBy === 'price-asc') items.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') items.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rarity') items.sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0));
    return items;
  }, [shopItems, search, sortBy]);

  const handleBuy = useCallback(async (itemId: string) => {
    const ok = await buy(itemId);
    if (ok) {
      await refreshInv();
    }
  }, [buy, refreshInv]);

  const handleEquip = useCallback(async (itemId: string) => {
    await equip(itemId);
  }, [equip]);

  const handleUnequip = useCallback(async (item: ShopItem) => {
    await unequip(item.type);
  }, [unequip]);

  const loading = itemsLoading || balanceLoading || featuredLoading;

  return (
    <Shell>
      <div className="space-y-8 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-xs font-headline font-bold uppercase tracking-widest">
              <Gem className="w-3.5 h-3.5" />
              DevRann Shop
            </div>
            <h1 className="text-4xl font-headline font-bold text-foreground">
              Shop
            </h1>
            <p className="text-muted-foreground">Spend your hard-earned DevCoins on exclusive cosmetics and rewards.</p>
          </div>
          <Card className="bg-yellow-500/10 border-yellow-500/20">
            <CardContent className="px-6 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Gem className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-yellow-400/70 font-bold">Your Balance</p>
                <p className="text-2xl font-headline font-bold text-yellow-400">
                  {balanceLoading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : balance.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {featuredItems.length > 0 && (
          <div>
            <h2 className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-yellow-400" /> Featured & Limited
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredItems.map((item, i) => {
                const owned = ownedIds.has(item.id);
                const rarityColor = RARITY_COLORS[item.rarity] || '';
                const rarityBg = RARITY_BGS[item.rarity] || '';
                const isSeasonal = item.seasonal;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedItem(item)}
                  >
                    <Card className="relative overflow-hidden border-primary/30 bg-primary/5 cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all">
                      <div className="absolute top-2 right-2 flex gap-1">
                        {isSeasonal && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[8px] uppercase tracking-widest">
                            Seasonal
                          </Badge>
                        )}
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[8px] uppercase tracking-widest">
                          <Sparkles className="w-2.5 h-2.5 mr-1" /> Featured
                        </Badge>
                      </div>
                      <CardContent className="p-5 text-center space-y-3">
                        <div className={cn('w-14 h-14 rounded-2xl mx-auto flex items-center justify-center', rarityBg)}>
                          <Gem className="w-7 h-7" style={item.color ? { color: item.color } : {}} />
                        </div>
                        <h3 className="font-headline font-bold text-sm">{item.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                        <Badge variant="outline" className={cn('text-[9px] uppercase tracking-widest', rarityColor)}>
                          {item.rarity}
                        </Badge>
                        <div className="flex items-center justify-center gap-1 text-sm font-bold text-yellow-400">
                          <Gem className="w-3.5 h-3.5" /> {item.price.toLocaleString()}
                        </div>
                        {owned ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] uppercase tracking-widest">
                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Owned
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full gap-2"
                            disabled={balance < item.price}
                            onClick={(e) => { e.stopPropagation(); handleBuy(item.id); }}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            {balance >= item.price ? 'Buy Now' : 'Not Enough'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 gap-1">
            <TabsTrigger value="shop" className="gap-2"><ShoppingBag className="w-3 h-3" /> Shop</TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2"><Award className="w-3 h-3" /> My Inventory ({ownedItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="pl-10 h-10 bg-muted/30 border-border text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                <Button
                  variant={sortBy === 'price-asc' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('price-asc')}
                  className="text-xs"
                >
                  Price ↑
                </Button>
                <Button
                  variant={sortBy === 'price-desc' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('price-desc')}
                  className="text-xs"
                >
                  Price ↓
                </Button>
                <Button
                  variant={sortBy === 'rarity' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('rarity')}
                  className="text-xs"
                >
                  Rarity
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant={category === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat.id)}
                  className="text-xs font-bold uppercase tracking-widest gap-1.5"
                >
                  {cat.icon} {cat.label}
                </Button>
              ))}
            </div>

            {buyError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                {buyError}
                <button onClick={clearError} className="ml-2 hover:underline"><X className="w-3 h-3 inline" /></button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold">No items found</p>
                <p className="text-xs mt-1">Try a different category or search term.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item, i) => {
                  const owned = ownedIds.has(item.id);
                  const rarityColor = RARITY_COLORS[item.rarity] || '';
                  const rarityBg = RARITY_BGS[item.rarity] || '';
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedItem(item)}
                    >
                      <Card className={cn(
                        'bg-card/50 border-border hover:border-primary/30 transition-all h-full cursor-pointer',
                        owned && 'border-emerald-500/30',
                      )}>
                        <CardContent className="p-4 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-3">
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', rarityBg)}>
                              <Gem className="w-5 h-5" style={item.color ? { color: item.color } : {}} />
                            </div>
                            <Badge variant="outline" className={cn('text-[8px] uppercase tracking-widest', rarityColor)}>
                              {item.rarity}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-sm">{item.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1 flex-1 line-clamp-2">{item.description}</p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                            <span className="flex items-center gap-1 text-sm font-bold text-yellow-400">
                              <Gem className="w-3.5 h-3.5" /> {item.price.toLocaleString()}
                            </span>
                            {owned ? (
                              <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-emerald-400 border-emerald-400/30">
                                <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Owned
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="text-xs h-8"
                                disabled={balance < item.price}
                                onClick={(e) => { e.stopPropagation(); handleBuy(item.id); }}
                              >
                                {balance >= item.price ? 'Buy' : '—'}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <InventoryTab
              items={ownedItems}
              loading={invLoading}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
            />
          </TabsContent>
        </Tabs>
      </div>

      {selectedItem && (
        <ShopItemDetail
          item={selectedItem}
          owned={ownedIds.has(selectedItem.id)}
          balance={balance}
          onBuy={handleBuy}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </Shell>
  );
}

function InventoryTab({
  items, loading, onEquip, onUnequip,
}: {
  items: ShopItem[];
  loading: boolean;
  onEquip: (itemId: string) => void;
  onUnequip: (item: ShopItem) => void;
}) {
  const [filter, setFilter] = useState<ShopItemType | 'all'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(i => i.type === filter);
  }, [items, filter]);

  const grouped = useMemo(() => {
    const groups: Record<string, ShopItem[]> = {};
    filtered.forEach(item => {
      const key = item.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filtered]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-bold">No items yet</p>
        <p className="text-xs mt-1">Visit the shop to buy your first cosmetic!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')} className="text-xs uppercase tracking-widest">All</Button>
        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
          <Button key={cat.id} variant={filter === cat.id ? 'default' : 'outline'} size="sm" onClick={() => setFilter(cat.id)} className="text-xs uppercase tracking-widest gap-1.5">
            {cat.icon} {cat.label}
          </Button>
        ))}
      </div>

      {Object.entries(grouped).map(([type, typeItems]) => {
        const cat = CATEGORIES.find(c => c.id === type);
        return (
          <div key={type}>
            <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              {cat?.icon} {cat?.label || type}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {typeItems.map(item => {
                const rarityColor = RARITY_COLORS[item.rarity] || '';
                const isEquipped = false;
                return (
                  <Card key={item.id} className={cn('bg-card/50 border-border', isEquipped && 'border-primary/30 bg-primary/5')}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gem className="w-4 h-4 text-muted-foreground" style={item.color ? { color: item.color } : {}} />
                          <span className="font-bold text-sm">{item.name}</span>
                        </div>
                        <Badge variant="outline" className={cn('text-[8px] uppercase tracking-widest', rarityColor)}>
                          {item.rarity}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-muted/50">
                          {cat?.label || item.type}
                        </Badge>
                        <div className="flex gap-2">
                          {isEquipped ? (
                            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onUnequip(item)}>
                              Unequip
                            </Button>
                          ) : (
                            <Button size="sm" className="text-xs h-7" onClick={() => onEquip(item.id)}>
                              Equip
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
