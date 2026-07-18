'use client';

import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('flex flex-col items-center justify-center py-16 px-6', className)}
    >
      <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center mb-4">
        <div className="text-muted-foreground/60">
          {icon || <MessageSquare className="w-6 h-6" />}
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-5">{description}</p>
      )}
      {action && (
        <Button size="sm" onClick={action.onClick} className="gap-1.5">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
