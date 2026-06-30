'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonPageProps {
  type?: 'dashboard' | 'profile' | 'list' | 'editor' | 'analytics';
}

export function SkeletonPage({ type = 'dashboard' }: SkeletonPageProps) {
  const variants = {
    dashboard: () => (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 bg-card/50 border-border">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <Card className="p-6 bg-card/50 border-border">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 365 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-3 rounded-sm" />
            ))}
          </div>
        </Card>
      </div>
    ),
    profile: () => (
      <div className="space-y-6">
        <Card className="p-6 bg-card/50 border-border">
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        </Card>
      </div>
    ),
    list: () => (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-4 bg-card/50 border-border">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    ),
    editor: () => (
      <div className="space-y-4">
        <Card className="h-12 bg-card/50 border-border flex items-center px-4">
          <Skeleton className="h-6 w-32" />
        </Card>
        <Card className="h-[400px] bg-card/50 border-border">
          <Skeleton className="h-full w-full" />
        </Card>
      </div>
    ),
    analytics: () => (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-card/50 border-border">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-48 w-full" />
          </Card>
          <Card className="p-6 bg-card/50 border-border">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-48 w-full" />
          </Card>
        </div>
      </div>
    ),
  };

  return variants[type]();
}
