'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, CheckCircle, BookOpen, Brain, MessageSquare,
  Network, BarChart3, Calendar, BookmarkCheck, TrendingUp,
  Lightbulb, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JudgeStatusInfo, JudgeStatusType } from '@/hooks/use-judge-status';

interface JudgeStatusBannerProps {
  judge: JudgeStatusInfo;
}

const AVAILABLE_FEATURES = [
  { icon: BookOpen, label: 'Read problem statements' },
  { icon: Lightbulb, label: 'View constraints & examples' },
  { icon: Brain, label: 'Study editorials (when unlocked)' },
  { icon: Sparkles, label: 'AI Mentor' },
  { icon: BarChart3, label: 'AI Debugger' },
  { icon: Network, label: 'Learning Roadmaps' },
  { icon: MessageSquare, label: 'Community Discussions' },
  { icon: Calendar, label: 'Daily Challenges' },
  { icon: BookmarkCheck, label: 'Bookmarks' },
  { icon: TrendingUp, label: 'Progress Tracking' },
];

const STATUS_CONFIG: Record<JudgeStatusType, { icon: typeof Cpu; title: string; description: string }> = {
  ONLINE: { icon: CheckCircle, title: 'Code Execution Active', description: 'All systems operational.' },
  MAINTENANCE: {
    icon: Cpu,
    title: 'Online Code Execution Temporarily Unavailable',
    description:
      'We are currently deploying our dedicated execution infrastructure to provide secure, fast, and scalable code execution. Until then, you can continue using every learning feature on DevRann.',
  },
  OFFLINE: {
    icon: Cpu,
    title: 'Code Execution Currently Offline',
    description:
      'Our execution infrastructure is temporarily offline. We are working to restore service. All learning features remain available.',
  },
  LOADING: { icon: Cpu, title: 'Checking service status...', description: '' },
};

export function JudgeStatusBanner({ judge }: JudgeStatusBannerProps) {
  const config = STATUS_CONFIG[judge.status];
  const Icon = config.icon;
  const isOperational = judge.status === 'ONLINE';

  if (isOperational) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={judge.status}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent overflow-hidden"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Icon className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-amber-300">
                {config.title}
              </h3>
              {config.description && (
                <p className="text-xs text-amber-400/70 mt-1 leading-relaxed max-w-xl">
                  {config.description}
                </p>
              )}
              {judge.reason && (
                <p className="text-xs text-amber-500/50 mt-1 font-mono">
                  Reason: {judge.reason}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {AVAILABLE_FEATURES.map(feature => (
              <div
                key={feature.label}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
              >
                <feature.icon className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-emerald-300/90 leading-tight">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-amber-400/40 leading-relaxed">
            Execution will return automatically once our judge infrastructure is online. No action required.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
