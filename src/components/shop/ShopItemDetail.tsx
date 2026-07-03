'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Gem, ShoppingBag, CheckCircle2, Award, Star, Clock,
  Palette, User, Gamepad2, MessageSquare, Zap, Image,
  Sparkles, Frame, Type, Sword, Loader2, Eye, Info,
} from 'lucide-react';
import type { ShopItem } from '@/types';

const RARITY_COLORS: Record<string, string> = {
  common: 'text-muted-foreground',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-orange-400',
  mythic: 'text-red-400',
};

const RARITY_BGS: Record<string, string> = {
  common: 'bg-muted/20',
  rare: 'bg-blue-500/10',
  epic: 'bg-purple-500/10',
  legendary: 'bg-orange-500/10',
  mythic: 'bg-red-500/10',
};

const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  avatar_frame: { label: 'Avatar Frame', icon: <Frame className="w-4 h-4" /> },
  profile_theme: { label: 'Profile Theme', icon: <Palette className="w-4 h-4" /> },
  name_color: { label: 'Name Color', icon: <Type className="w-4 h-4" /> },
  badge: { label: 'Badge', icon: <Award className="w-4 h-4" /> },
  title: { label: 'Title', icon: <User className="w-4 h-4" /> },
  code_ace_skin: { label: 'CodeAce Skin', icon: <Gamepad2 className="w-4 h-4" /> },
  loading_theme: { label: 'Loading Theme', icon: <Clock className="w-4 h-4" /> },
  chat_emoji: { label: 'Chat Emoji Pack', icon: <MessageSquare className="w-4 h-4" /> },
  arena_effect: { label: 'Arena Effect', icon: <Zap className="w-4 h-4" /> },
  profile_background: { label: 'Profile Background', icon: <Image className="w-4 h-4" /> },
  seasonal_collectible: { label: 'Seasonal Collectible', icon: <Sparkles className="w-4 h-4" /> },
};

interface ShopItemDetailProps {
  item: ShopItem;
  owned: boolean;
  balance: number;
  onBuy: (itemId: string) => void;
  onEquip: (itemId: string) => void;
  onUnequip: (item: ShopItem) => void;
  onClose: () => void;
}

export function ShopItemDetail({ item, owned, balance, onBuy, onEquip, onUnequip, onClose }: ShopItemDetailProps) {
  const typeInfo = TYPE_LABELS[item.type] || { label: item.type, icon: <Gem className="w-4 h-4" /> };
  const rarityColor = RARITY_COLORS[item.rarity] || 'text-muted-foreground';
  const rarityBg = RARITY_BGS[item.rarity] || 'bg-muted/20';
  const canAfford = balance >= item.price;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline font-bold">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className={cn('w-full h-40 rounded-xl flex items-center justify-center', rarityBg)}>
            <div className="text-center">
              <Gem className="w-16 h-16 mx-auto" style={item.color ? { color: item.color } : {}} />
              <p className={cn('text-sm font-bold uppercase tracking-widest mt-2', rarityColor)}>{item.rarity}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{item.description}</p>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest gap-1">
                {typeInfo.icon} {typeInfo.label}
              </Badge>
              <Badge variant="outline" className={cn('text-[10px] uppercase tracking-widest', rarityColor)}>
                <Star className="w-2.5 h-2.5 mr-1" /> {item.rarity}
              </Badge>
              {item.effect && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-primary">
                  <Zap className="w-2.5 h-2.5 mr-1" /> {item.effect.replace('_', ' ')}
                </Badge>
              )}
              {item.seasonal && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] uppercase tracking-widest">
                  <Sparkles className="w-2.5 h-2.5 mr-1" /> Seasonal
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Price</p>
              <p className={cn('text-2xl font-headline font-bold flex items-center gap-2', canAfford ? 'text-yellow-400' : 'text-destructive')}>
                <Gem className="w-5 h-5" /> {item.price.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Your Balance</p>
              <p className="text-lg font-headline font-bold text-yellow-400">{balance.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {owned ? (
              <>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => onUnequip(item)}>
                  <Eye className="w-4 h-4" /> Unequip
                </Button>
                <Button variant="outline" className="flex-1 gap-2" disabled>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Owned
                </Button>
              </>
            ) : (
              <Button
                className="flex-1 gap-2"
                disabled={!canAfford}
                onClick={() => onBuy(item.id)}
              >
                {canAfford ? (
                  <><ShoppingBag className="w-4 h-4" /> Purchase</>
                ) : (
                  <><Gem className="w-4 h-4" /> Not Enough DevCoins</>
                )}
              </Button>
            )}
          </div>

          <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
            <p className="text-[10px] text-muted-foreground flex items-start gap-2">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              Cosmetics are purely visual and provide no competitive advantage. Once purchased, items are permanently added to your inventory and can be equipped/unequipped anytime.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
