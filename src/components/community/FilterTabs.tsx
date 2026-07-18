'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Code, FolderKanban, MessageCircle, Lightbulb, Sparkles } from 'lucide-react';

const FILTERS = [
  { value: 'all', label: 'All', icon: Sparkles },
  { value: 'code_share', label: 'Code', icon: Code },
  { value: 'project_showcase', label: 'Projects', icon: FolderKanban },
  { value: 'discussion', label: 'Discussion', icon: MessageCircle },
  { value: 'tip', label: 'Tips', icon: Lightbulb },
];

interface FilterTabsProps {
  value: string;
  onChange: (value: string) => void;
}

export function FilterTabs({ value, onChange }: FilterTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50 w-fit overflow-x-auto scrollbar-thin">
      {FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isActive = value === filter.value;
        return (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80',
            )}
            aria-pressed={isActive}
            role="tab"
          >
            {isActive && (
              <motion.span
                layoutId="filter-bg"
                className="absolute inset-0 bg-background border border-border/60 rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              {filter.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
