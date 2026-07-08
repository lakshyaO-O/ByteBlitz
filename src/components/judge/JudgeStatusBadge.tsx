'use client';

import { motion } from 'framer-motion';
import { Wrench, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JudgeStatusType } from '@/hooks/use-judge-status';

interface JudgeStatusBadgeProps {
  status: JudgeStatusType;
  className?: string;
}

const BADGE_CONFIG: Record<JudgeStatusType, { icon: typeof Wrench; label: string; className: string }> = {
  ONLINE: { icon: CheckCircle, label: 'Online', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  MAINTENANCE: { icon: Wrench, label: 'Maintenance', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  OFFLINE: { icon: AlertTriangle, label: 'Offline', className: 'text-red-400 bg-red-500/10 border-red-500/20' },
  LOADING: { icon: Loader2, label: 'Checking...', className: 'text-muted-foreground bg-muted/20 border-border/50' },
};

export function JudgeStatusBadge({ status, className }: JudgeStatusBadgeProps) {
  const config = BADGE_CONFIG[status];
  const Icon = config.icon;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
        config.className,
        className,
      )}
    >
      <Icon className={cn('w-3 h-3', status === 'LOADING' && 'animate-spin')} />
      {config.label}
    </motion.span>
  );
}
