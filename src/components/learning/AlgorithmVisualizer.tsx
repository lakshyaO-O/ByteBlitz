'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipBack, SkipForward, StepForward, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Step {
  description: string;
  array: number[];
  variables?: Record<string, unknown>;
  highlight: number[];
  pointers?: Record<string, number>;
  state?: 'idle' | 'comparing' | 'swapping' | 'selected' | 'found' | 'done' | 'compare';
}

interface VisualizerProps {
  steps: Step[];
  title: string;
  onRequestSteps?: () => void;
  loading?: boolean;
}

export function AlgorithmVisualizer({ steps, title, onRequestSteps, loading }: VisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current !== null) clearInterval(timerRef.current); };
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          if (timerRef.current !== null) clearInterval(timerRef.current);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  }, [steps.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current !== null) clearInterval(timerRef.current);
  }, []);

  const goTo = useCallback((target: number) => {
    setCurrentStep(Math.max(0, Math.min(target, steps.length - 1)));
  }, [steps.length]);

  if (loading || steps.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">No visualization steps available for this algorithm.</p>
          {onRequestSteps && (
            <Button variant="outline" size="sm" onClick={onRequestSteps}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Generate Visualization
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const step = steps[currentStep];
  if (!step) return null;

  const barMax = Math.max(...step.array, 1);
  const pointerNames = Object.keys(step.pointers || {});

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-foreground">{title}</h4>
          <p className="text-[10px] text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => goTo(0)} disabled={currentStep === 0}>
            <SkipBack className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => goTo(currentStep - 1)} disabled={currentStep === 0}>
            <StepForward className="w-3.5 h-3.5 rotate-180" />
          </Button>
          <Button variant="default" size="icon" className="h-7 w-7" onClick={isPlaying ? pause : play}>
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => goTo(currentStep + 1)} disabled={currentStep >= steps.length - 1}>
            <StepForward className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => goTo(steps.length - 1)} disabled={currentStep >= steps.length - 1}>
            <SkipForward className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {step && (
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <p className="text-[11px] text-muted-foreground leading-relaxed">{step.description}</p>

          <div className="flex items-end gap-1 h-32 px-2 py-1 rounded-lg bg-muted/10 border border-border/30">
            {step.array.map((val, i) => {
              const height = Math.max(4, (val / barMax) * 100);
              const isHighlighted = step.highlight?.includes(i);
              const pointer = step.pointers ? pointerNames.find(p => step.pointers![p] === i) : undefined;
              const stateClass =
                step.state === 'compare' ? 'bg-yellow-500' :
                step.state === 'swapping' ? 'bg-red-500' :
                step.state === 'comparing' ? 'bg-amber-500' :
                step.state === 'found' ? 'bg-emerald-500' :
                step.state === 'done' ? 'bg-blue-500' :
                'bg-primary/60';

              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 min-w-0">
                  <span className="text-[8px] font-mono text-muted-foreground">{val}</span>
                  <motion.div
                    layout
                    animate={{ height: `${height}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={cn(
                      'w-full rounded-t-sm transition-colors duration-300',
                      isHighlighted ? stateClass : 'bg-primary/20',
                    )}
                    style={{ height: `${height}%` }}
                  />
                  {pointer && (
                    <span className="text-[8px] font-bold text-amber-400 -mt-0.5">{pointer}</span>
                  )}
                  <span className="text-[7px] font-mono text-muted-foreground/50">{i}</span>
                </div>
              );
            })}
          </div>

          {step.state && (
            <div className="flex justify-center">
              <Badge variant="outline" className={cn(
                'text-[10px] capitalize',
                step.state === 'compare' && 'border-yellow-500/30 text-yellow-400',
                step.state === 'swapping' && 'border-red-500/30 text-red-400',
                step.state === 'found' && 'border-emerald-500/30 text-emerald-400',
                step.state === 'done' && 'border-blue-500/30 text-blue-400',
              )}>
                {step.state}
              </Badge>
            </div>
          )}
        </motion.div>
      )}
    </Card>
  );
}
