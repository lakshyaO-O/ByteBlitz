'use client';

import { Crown, X, Zap, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { AiFeature } from '@/config/ai-limits';
import { AI_FEATURE_LABELS } from '@/config/ai-limits';

interface PremiumUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: AiFeature;
}

export function PremiumUpgradeModal({ open, onClose, feature }: PremiumUpgradeModalProps) {
  const router = useRouter();

  if (!open) return null;

  const featureLabel = AI_FEATURE_LABELS[feature];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-lg max-w-md w-full mx-4 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Crown className="w-7 h-7 text-amber-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-headline font-bold">Daily Limit Reached</h3>
            <p className="text-sm text-muted-foreground">
              You've used all your free <span className="font-bold text-foreground">{featureLabel}</span> queries for today.
            </p>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-left">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-sm">
                <span className="font-bold text-foreground">Pro Plan</span>
                <p className="text-xs text-muted-foreground">Unlimited access to all AI features</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-sm">
                <span className="font-bold text-foreground">Priority AI</span>
                <p className="text-xs text-muted-foreground">Faster responses and higher quality</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-sm">
                <span className="font-bold text-foreground">Premium Features</span>
                <p className="text-xs text-muted-foreground">Monaco editor, analytics, custom themes</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold"
              onClick={() => { onClose(); router.push('/monetization'); }}
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </Button>
            <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={onClose}>
              Maybe later
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground/60">
            Your usage resets at midnight UTC. Pro plan starts at $9.99/month.
          </p>
        </div>
      </div>
    </div>
  );
}
