'use client';

import React, { useState, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShoppingBag, Coins, Sparkles, Palette, Award, User, Zap,
  Gem, Star, Shield, Sword, Heart, Eye, Filter, Loader2,
  CheckCircle2, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const types = [
  { id: 'themes', label: 'Themes', icon: Palette, color: 'text-purple-400' },
  { id: 'badges', label: 'Badges', icon: Award, color: 'text-yellow-400' },
  { id: 'titles', label: 'Titles', icon: User, color: 'text-blue-400' },
  { id: 'avatars', label: 'Avatars', icon: Eye, color: 'text-emerald-400' },
  { id: 'boosts', label: 'Boosts', icon: Zap, color: 'text-red-400' },
  { id: 'cosmetics', label: 'Cosmetics', icon: Sparkles, color: 'text-pink-400' },
];

const rarities = [
  { id: 'common', label: 'Common', color: 'text-muted-foreground border-muted-foreground/30', bg: 'bg-muted/30' },
  { id: 'rare', label: 'Rare', color: 'text-blue-400 border-blue-400/30', bg: 'bg-blue-500/10' },
  { id: 'epic', label: 'Epic', color: 'text-purple-400 border-purple-400/30', bg: 'bg-purple-500/10' },
  { id: 'legendary', label: 'Legendary', color: 'text-orange-400 border-orange-400/30', bg: 'bg-orange-500/10' },
];

const mockShopItems = [
  { id: '1', name: 'Dark Nebula Theme', description: 'A premium dark theme with neon accents.', price: 500, rarity: 'epic', type: 'themes', featured: true },
  { id: '2', name: 'Cyberpunk Badge', description: 'Show off your futuristic style.', price: 200, rarity: 'rare', type: 'badges', featured: false },
  { id: '3', name: 'Code Master Title', description: 'Equip the "Code Master" title on your profile.', price: 1000, rarity: 'legendary', type: 'titles', featured: true },
  { id: '4', name: 'Pixel Bot Avatar', description: 'Retro pixel art bot avatar.', price: 150, rarity: 'common', type: 'avatars', featured: false },
  { id: '5', name: '2x XP Boost (1 hour)', description: 'Double XP for all activities for 1 hour.', price: 300, rarity: 'rare', type: 'boosts', featured: false },
  { id: '6', name: 'Neon Trail Effect', description: 'Animated neon trail following your cursor.', price: 750, rarity: 'epic', type: 'cosmetics', featured: true },
  { id: '7', name: 'Ocean Breeze Theme', description: 'Calming ocean-inspired color scheme.', price: 300, rarity: 'rare', type: 'themes', featured: false },
  { id: '8', name: '100 Days Badge', description: 'For the dedicated coders with 100-day streaks.', price: 5000, rarity: 'legendary', type: 'badges', featured: false },
  { id: '9', name: 'Golden Sword Avatar', description: 'Premium golden sword avatar frame.', price: 1200, rarity: 'legendary', type: 'avatars', featured: true },
  { id: '10', name: 'Speed Boost (30 min)', description: '30 minutes of 1.5x speed on practice problems.', price: 200, rarity: 'common', type: 'boosts', featured: false },
  { id: '11', name: 'Arena Gladiator Title', description: 'Equip the "Arena Gladiator" title.', price: 2000, rarity: 'legendary', type: 'titles', featured: false },
  { id: '12', name: 'Matrix Rain Effect', description: 'Digital rain effect on your profile background.', price: 600, rarity: 'epic', type: 'cosmetics', featured: false },
];

const mockInventory = [
  { id: '1', name: 'Dark Nebula Theme', type: 'themes', rarity: 'epic', equipped: true },
  { id: '4', name: 'Pixel Bot Avatar', type: 'avatars', rarity: 'common', equipped: false },
  { id: '7', name: 'Ocean Breeze Theme', type: 'themes', rarity: 'rare', equipped: false },
  { id: '10', name: 'Speed Boost (30 min)', type: 'boosts', rarity: 'common', equipped: false },
];

export default function ShopPage() {
  const [tab, setTab] = useState('shop');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'price' | 'rarity'>('price');
  const userCoins = 1250;

  const filtered = useMemo(() => {
    let items = [...mockShopItems];
    if (typeFilter !== 'All') items = items.filter(i => i.type === typeFilter);
    if (sortBy === 'price') items.sort((a, b) => a.price - b.price);
    else {
      const rarityOrder = ['common', 'rare', 'epic', 'legendary'];
      items.sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity));
    }
    return items;
  }, [typeFilter, sortBy]);

  const featured = mockShopItems.filter(i => i.featured);
  const ownedIds = new Set(mockInventory.map(i => i.id));
  const equippedIds = new Set(mockInventory.filter(i => i.equipped).map(i => i.id));

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
              REWARDS <span className="text-primary neon-text">SHOP</span>
            </h1>
            <p className="text-muted-foreground">Spend your coins on themes, badges, boosts, and more.</p>
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="px-5 py-3 flex items-center gap-3">
              <Coins className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-xs text-muted-foreground">Your Balance</p>
                <p className="text-xl font-headline font-bold text-yellow-400">{userCoins.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {featured.length > 0 && (
          <div>
            <h2 className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-yellow-400" /> Featured & Limited
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-yellow-500/5">
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[8px] uppercase tracking-widest">
                        <Sparkles className="w-2.5 h-2.5 mr-1" /> Featured
                      </Badge>
                    </div>
                    <CardContent className="p-5 text-center space-y-3">
                      {React.createElement(types.find(t => t.id === item.type)?.icon || ShoppingBag, { className: 'w-10 h-10 mx-auto text-primary' })}
                      <h3 className="font-headline font-bold">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <Badge variant="outline" className={cn('text-[9px] uppercase tracking-widest', rarities.find(r => r.id === item.rarity)?.color)}>
                        {item.rarity}
                      </Badge>
                      <div className="flex items-center justify-center gap-1 text-sm font-bold">
                        <Coins className="w-4 h-4 text-yellow-400" /> {item.price.toLocaleString()}
                      </div>
                      <Button className="w-full gap-2" size="sm" disabled={userCoins < item.price}>
                        <ShoppingBag className="w-3 h-3" /> {userCoins >= item.price ? 'Buy Now' : 'Not Enough Coins'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="shop" onValueChange={setTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="shop" className="gap-2"><ShoppingBag className="w-3 h-3" /> Shop</TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2"><Award className="w-3 h-3" /> My Inventory ({mockInventory.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <Button key="All" variant={typeFilter === 'All' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('All')} className="text-xs font-bold uppercase tracking-widest">All</Button>
              {types.map(t => (
                <Button key={t.id} variant={typeFilter === t.id ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter(t.id)} className="text-xs font-bold uppercase tracking-widest gap-1.5">
                  {React.createElement(t.icon, { className: 'w-3 h-3' })} {t.label}
                </Button>
              ))}
              <div className="ml-auto flex gap-2">
                <Button variant={sortBy === 'price' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSortBy('price')} className="text-xs">Price</Button>
                <Button variant={sortBy === 'rarity' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSortBy('rarity')} className="text-xs">Rarity</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((item, i) => {
                const owned = ownedIds.has(item.id);
                const rarity = rarities.find(r => r.id === item.rarity);
                const TypeIcon = types.find(t => t.id === item.type)?.icon || ShoppingBag;
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className={cn('bg-card/50 border-border hover:border-primary/30 transition-all h-full', owned && 'border-emerald-500/30')}>
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-2">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-muted/30')}>
                            <TypeIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <Badge variant="outline" className={cn('text-[8px] uppercase tracking-widest', rarity?.color)}>
                            {item.rarity}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-sm">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 flex-1">{item.description}</p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                          <span className="flex items-center gap-1 text-sm font-bold">
                            <Coins className="w-3.5 h-3.5 text-yellow-400" /> {item.price.toLocaleString()}
                          </span>
                          {owned ? (
                            <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-emerald-400 border-emerald-400/30">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Owned
                            </Badge>
                          ) : (
                            <Button size="sm" className="text-xs h-8" disabled={userCoins < item.price}>
                              {userCoins >= item.price ? 'Buy' : '—'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mockInventory.map((item, i) => {
                const rarity = rarities.find(r => r.id === item.rarity);
                const TypeIcon = types.find(t => t.id === item.type)?.icon || ShoppingBag;
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className={cn('bg-card/50 border-border hover:border-primary/30 transition-all', item.equipped && 'border-primary/30 bg-primary/5')}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="font-bold text-sm">{item.name}</span>
                          </div>
                          <Badge variant="outline" className={cn('text-[8px] uppercase tracking-widest', rarity?.color)}>
                            {item.rarity}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-muted/50">{item.type}</Badge>
                          {item.equipped ? (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] uppercase tracking-widest">Equipped</Badge>
                          ) : (
                            <Button variant="outline" size="sm" className="text-xs h-8">Equip</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
