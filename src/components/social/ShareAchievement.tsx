'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Share2, Check, Copy, Link, Twitter, MessageCircle, Loader2 } from 'lucide-react';

interface ShareAchievementProps {
  title: string;
  description: string;
  icon?: string;
}

export function ShareAchievement({ title, description, icon }: ShareAchievementProps) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `I unlocked "${title}" on CodezArena! ${description}\n\nJoin me at https://codezarena.app`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { console.warn('[Share] Failed to copy:', e); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: 'https://codezarena.app' });
      } catch (e) { console.warn('[Share] Failed to share:', e); }
    } else {
      setShowShare(!showShare);
    }
  };

  return (
    <div>
      <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 text-xs">
        <Share2 className="w-3 h-3" />
        Share
      </Button>
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute mt-2 right-0 z-10"
          >
            <Card className="p-3 bg-card border-border w-64">
              <div className="space-y-2">
                <Input value={shareText} readOnly className="text-xs h-8" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs h-8" onClick={handleCopy}>
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1 text-xs h-8"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank')}
                  >
                    <Twitter className="w-3 h-3" />
                    Tweet
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
