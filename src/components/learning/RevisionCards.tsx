'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2, Sparkles, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { RevisionCard as RevisionCardType } from '@/types/learning';

interface Props {
  cards: RevisionCardType[];
  loading?: boolean;
  onGenerate?: () => void;
}

export function RevisionCards({ cards, loading, onGenerate }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const card = cards[currentIndex];
  const totalAnswered = Object.keys(answers).length;
  const totalCorrect = Object.values(answers).filter(Boolean).length;

  const handleAnswer = useCallback((correct: boolean) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: correct }));
    setFlipped(true);
  }, [currentIndex]);

  const next = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      setSelectedOption(null);
    }
  }, [currentIndex, cards.length]);

  const prev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
      setSelectedOption(null);
    }
  }, [currentIndex]);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Generating revision cards...</p>
        </div>
      </Card>
    );
  }

  if (cards.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Brain className="w-6 h-6 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">No revision cards yet.</p>
          {onGenerate && (
            <Button variant="outline" size="sm" onClick={onGenerate}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Generate from this problem
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <h4 className="text-xs font-semibold text-foreground">Revision</h4>
          {totalAnswered > 0 && (
            <Badge variant="outline" className="text-[8px] px-1.5 py-0">
              {totalCorrect}/{totalAnswered} correct
            </Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{currentIndex + 1} / {cards.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <div className="p-3 rounded-lg bg-muted/10 border border-border/30 min-h-[120px]">
            <div className="flex items-center gap-1.5 mb-2">
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 capitalize">
                {card.type.replace('-', ' ')}
              </Badge>
              <Badge variant="outline" className={cn(
                'text-[8px] px-1.5 py-0',
                card.difficulty === 'easy' && 'border-emerald-500/30 text-emerald-400',
                card.difficulty === 'medium' && 'border-amber-500/30 text-amber-400',
                card.difficulty === 'hard' && 'border-red-500/30 text-red-400',
              )}>
                {card.difficulty}
              </Badge>
              <Badge variant="secondary" className="text-[8px] px-1.5 py-0 ml-auto">{card.topic}</Badge>
            </div>

            <p className="text-[12px] text-foreground font-medium">{card.question}</p>

            {card.type === 'mcq' && card.options && (
              <div className="mt-2 space-y-1">
                {card.options.map((opt, i) => {
                  const isCorrect = opt === card.answer;
                  const isSelected = selectedOption === i;
                  const showResult = flipped || answers[currentIndex] !== undefined;

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (!flipped && !answers[currentIndex]) {
                          setSelectedOption(i);
                          handleAnswer(isCorrect);
                        }
                      }}
                      disabled={flipped || answers[currentIndex] !== undefined}
                      className={cn(
                        'w-full text-left px-2.5 py-1.5 rounded-md text-[11px] transition-all border',
                        !showResult && 'bg-muted/5 border-border/30 hover:bg-muted/20 hover:border-border/60',
                        showResult && isCorrect && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                        showResult && isSelected && !isCorrect && 'bg-red-500/10 border-red-500/30 text-red-400',
                        showResult && !isSelected && !isCorrect && 'bg-muted/5 border-border/20 text-muted-foreground',
                      )}
                    >
                      <span className="text-muted-foreground/50 mr-1.5">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                      {showResult && isCorrect && <CheckCircle2 className="w-3 h-3 text-emerald-400 inline ml-1.5" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-3 h-3 text-red-400 inline ml-1.5" />}
                    </button>
                  );
                })}
              </div>
            )}

            {card.type === 'true-false' && !flipped && !answers[currentIndex] && (
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleAnswer(card.answer === 'True')}>
                  True
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleAnswer(card.answer === 'False')}>
                  False
                </Button>
              </div>
            )}

            {card.type === 'fill-blank' && !flipped && !answers[currentIndex] && (
              <div className="mt-2">
                <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setFlipped(true)}>
                  Show Answer
                </Button>
              </div>
            )}

            {card.type === 'flashcard' && (
              <div className="mt-2">
                {!flipped ? (
                  <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setFlipped(true)}>
                    Flip to Reveal
                  </Button>
                ) : (
                  <div className="mt-2 p-2 rounded-md bg-muted/20 border border-border/20">
                    <p className="text-[11px] text-foreground">{card.answer}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {flipped && (
            <div className="p-2.5 rounded-md bg-blue-500/5 border border-blue-500/20">
              <p className="text-[10px] text-blue-300">{card.explanation}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prev} disabled={currentIndex === 0}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        <div className="flex gap-1">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setFlipped(false); setSelectedOption(null); }}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                i === currentIndex ? 'bg-primary w-3' : 'bg-muted-foreground/30',
                answers[i] !== undefined && (answers[i] ? 'bg-emerald-500' : 'bg-red-500'),
              )}
            />
          ))}
        </div>

        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={next} disabled={currentIndex >= cards.length - 1}>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}
