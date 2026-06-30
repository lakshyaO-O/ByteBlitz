'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Zap, Crown, Sparkles, Gift, Coins, Star, Check, Copy, Loader2, Ticket, Users, Briefcase } from 'lucide-react';
import { useMonetization, SUBSCRIPTION_BENEFITS } from '@/hooks/use-monetization';
import { SubscriptionTier } from '@/app/lib/types';

interface MonetizationSectionProps {
  userId: string | null;
}

export function MonetizationSection({ userId }: MonetizationSectionProps) {
  const {
    tier, aiCredits, referralCode, loading,
    generateReferralCode, applyReferral, getBenefits,
  } = useMonetization(userId);
  const [referralInput, setReferralInput] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<'success' | 'error' | null>(null);
  const [generatedCode, setGeneratedCode] = useState(referralCode);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    const code = await generateReferralCode();
    if (code) setGeneratedCode(code);
  };

  const handleApplyReferral = async () => {
    if (!referralInput) return;
    setApplying(true);
    const success = await applyReferral(referralInput);
    setApplyResult(success ? 'success' : 'error');
    setApplying(false);
    setTimeout(() => setApplyResult(null), 3000);
  };

  const handleCopy = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tiers: SubscriptionTier[] = ['free', 'pro', 'elite'];

  if (loading) {
    return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="subscription">
        <TabsList className="grid grid-cols-4 gap-2 h-auto bg-muted/50 p-1">
          <TabsTrigger value="subscription" className="text-xs gap-1"><Crown className="w-3 h-3" /> Plans</TabsTrigger>
          <TabsTrigger value="ai-credits" className="text-xs gap-1"><Sparkles className="w-3 h-3" /> AI Credits</TabsTrigger>
          <TabsTrigger value="referrals" className="text-xs gap-1"><Gift className="w-3 h-3" /> Referrals</TabsTrigger>
          <TabsTrigger value="coupons" className="text-xs gap-1"><Ticket className="w-3 h-3" /> Coupons</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((t) => {
              const isCurrent = t === tier;
              const isPro = t === 'pro';
              const isElite = t === 'elite';
              return (
                <Card key={t} className={cn(
                  'bg-card/50 border-border relative overflow-hidden',
                  isCurrent && 'ring-2 ring-primary',
                  isElite && 'border-yellow-400/50',
                )}>
                  {isElite && (
                    <div className="absolute top-0 right-0">
                      <Badge className="bg-yellow-400 text-black rounded-none rounded-bl-lg text-[10px]">Best Value</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    {isElite ? <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-3" /> :
                     isPro ? <Zap className="w-10 h-10 text-primary mx-auto mb-3" /> :
                     <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />}
                    <h3 className="text-lg font-headline font-bold capitalize mb-1">{t}</h3>
                    <p className="text-2xl font-bold font-headline mb-4">
                      {t === 'free' ? 'Free' : t === 'pro' ? '$9.99' : '$19.99'}
                      {t !== 'free' && <span className="text-sm text-muted-foreground font-normal">/mo</span>}
                    </p>
                    <div className="space-y-2 mb-6 text-left">
                      {getBenefits(t).map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Check className={cn('w-3 h-3 shrink-0', isElite ? 'text-yellow-400' : isPro ? 'text-primary' : 'text-muted-foreground')} />
                          <span className="text-muted-foreground">{benefit}</span>
                        </div>
                      ))}
                    </div>
                    {isCurrent ? (
                      <Badge className="bg-primary/10 text-primary border-primary/30">Current Plan</Badge>
                    ) : (
                      <Button
                        variant={t === 'free' ? 'outline' : 'default'}
                        className="w-full text-xs"
                      >
                        {t === 'free' ? 'Downgrade' : 'Upgrade'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="ai-credits">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-headline font-bold mb-2">AI Credits</h3>
              <p className="text-4xl font-bold font-headline text-primary mb-2">{aiCredits}</p>
              <p className="text-sm text-muted-foreground mb-4">credits remaining this month</p>
              <p className="text-xs text-muted-foreground">Use AI credits for code review, hints, and problem assistance. Upgrade to Pro for more credits.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-headline font-bold">Your Referral Code</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedCode ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input value={generatedCode} readOnly className="font-mono text-sm" />
                      <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Share this code with friends. You both get rewards!</p>
                  </div>
                ) : (
                  <Button onClick={handleGenerateCode} className="gap-2">
                    <Gift className="w-4 h-4" /> Generate Referral Code
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-headline font-bold">Apply Referral Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Enter referral code"
                  value={referralInput}
                  onChange={e => setReferralInput(e.target.value)}
                />
                <Button onClick={handleApplyReferral} disabled={applying || !referralInput} className="w-full gap-2">
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                  Apply Code
                </Button>
                {applyResult === 'success' && <p className="text-xs text-emerald-400 text-center">Rewards claimed! +50 coins, +25 XP</p>}
                {applyResult === 'error' && <p className="text-xs text-destructive text-center">Invalid or expired code</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coupons">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6 text-center">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-headline font-bold mb-2">Coupon Codes</h3>
              <p className="text-sm text-muted-foreground">Enter a coupon code to apply discounts to your subscription.</p>
              <div className="flex gap-2 mt-4 max-w-xs mx-auto">
                <Input placeholder="Enter coupon code" />
                <Button variant="outline">Apply</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
