'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Construction } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JudgeStatusInfo } from '@/hooks/use-judge-status';

interface JudgeMaintenanceOverlayProps {
  judge: JudgeStatusInfo;
  className?: string;
}

export function JudgeMaintenanceOverlay({ judge, className }: JudgeMaintenanceOverlayProps) {
  const show = judge.status !== 'ONLINE' && judge.status !== 'LOADING';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex flex-col items-center justify-center gap-3 py-8 px-4 text-center',
            className,
          )}
        >
          <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Construction className="w-7 h-7 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-amber-300">
              Coming Soon
            </h3>
            <p className="text-xs text-amber-400/60">
              Infrastructure Upgrade in Progress
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground/60 max-w-md leading-relaxed">
            Code execution will be available once our dedicated judge infrastructure is deployed.
            In the meantime, explore problem statements, use AI Mentor, and engage with the community.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
