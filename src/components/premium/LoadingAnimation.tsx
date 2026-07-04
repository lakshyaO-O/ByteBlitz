'use client';

import React from 'react';
import { Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingAnimationProps {
  text?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingAnimation({ text = 'Loading...', fullScreen = false, size = 'md' }: LoadingAnimationProps) {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-xs' },
    md: { icon: 'w-10 h-10', text: 'text-sm' },
    lg: { icon: 'w-16 h-16', text: 'text-lg' },
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4',
      fullScreen && 'fixed inset-0 bg-background/80 z-50'
    )}>
      <div className="relative">
        <Loader2 className={cn('animate-spin text-primary', sizeMap[size].icon)} />
        <Zap className={cn('absolute inset-0 m-auto text-primary animate-pulse', size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-5 h-5' : 'w-8 h-8')} />
      </div>
      <p className={cn('text-muted-foreground font-medium', sizeMap[size].text)}>{text}</p>
    </div>
  );
}
