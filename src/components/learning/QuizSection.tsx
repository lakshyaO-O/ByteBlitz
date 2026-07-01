'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/data/lessons';

interface QuizSectionProps {
  questions: QuizQuestion[];
  onComplete: (passed: boolean, score: number) => void;
}

export function QuizSection({ questions, onComplete }: QuizSectionProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<{ question: number; correct: boolean }[]>([]);
  const [finished, setFinished] = useState(false);

  const question = questions[currentQ];
  const isLast = currentQ === questions.length - 1;

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelected(index);
  };

  const handleCheck = () => {
    if (selected === null) return;
    const correct = selected === question.correctIndex;
    setAnswers(prev => [...prev, { question: currentQ, correct }]);
    setShowResult(true);
  };

  const handleNext = () => {
    if (isLast) {
      const score = answers.filter(a => a.correct).length;
      const passed = score >= Math.ceil(questions.length * 0.6);
      setFinished(true);
      onComplete(passed, score);
    } else {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setShowResult(false);
    }
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setSelected(null);
    setShowResult(false);
    setAnswers([]);
    setFinished(false);
  };

  if (finished) {
    const score = answers.filter(a => a.correct).length;
    const total = questions.length;
    const passed = score >= Math.ceil(total * 0.6);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-2xl border text-center space-y-4"
      >
        <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto', passed ? 'bg-emerald-500/20' : 'bg-amber-500/20')}>
          {passed ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          ) : (
            <XCircle className="w-8 h-8 text-amber-400" />
          )}
        </div>
        <h3 className="text-xl font-headline font-bold">
          {passed ? 'Quiz Passed!' : 'Keep Trying!'}
        </h3>
        <p className="text-muted-foreground">
          You got {score} of {total} correct ({Math.round((score / total) * 100)}%)
        </p>
        {!passed && (
          <p className="text-xs text-amber-400">You need at least {Math.ceil(total * 0.6)} correct to pass. Review the lesson and try again!</p>
        )}
        <div className="flex justify-center gap-3">
          {!passed && (
            <button onClick={handleRetry} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-muted-foreground/30 text-sm hover:bg-muted/20 transition-colors">
              <RotateCcw className="w-4 h-4" /> Retry Quiz
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Question {currentQ + 1} of {questions.length}
        </p>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={cn(
              'w-2 h-2 rounded-full transition-colors',
              i < currentQ ? (answers[i]?.correct ? 'bg-emerald-400' : 'bg-destructive') : i === currentQ ? 'bg-primary' : 'bg-muted'
            )} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <p className="text-sm font-bold">{question.question}</p>

          <div className="space-y-2">
            {question.options.map((option, idx) => {
              const isSelected = selected === idx;
              const isCorrectAnswer = idx === question.correctIndex;
              let state = 'default';
              if (showResult) {
                if (isSelected && isCorrectAnswer) state = 'correct';
                else if (isSelected && !isCorrectAnswer) state = 'wrong';
                else if (isCorrectAnswer) state = 'correct';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={showResult}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border text-sm transition-all',
                    state === 'default' && isSelected && 'border-primary bg-primary/10 ring-1 ring-primary',
                    state === 'default' && !isSelected && 'border-border/50 hover:border-primary/30 hover:bg-muted/10',
                    state === 'correct' && 'border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30',
                    state === 'wrong' && 'border-destructive/50 bg-destructive/10 ring-1 ring-destructive/30',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-[11px] font-bold',
                      state === 'correct' && 'border-emerald-400 text-emerald-400',
                      state === 'wrong' && 'border-destructive text-destructive',
                      state === 'default' && isSelected && 'border-primary text-primary',
                      state === 'default' && !isSelected && 'border-muted-foreground/30 text-muted-foreground',
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className={cn(
                      state === 'correct' && 'text-emerald-200',
                      state === 'wrong' && 'text-destructive',
                    )}>{option}</span>
                    {state === 'correct' && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />}
                    {state === 'wrong' && <XCircle className="w-4 h-4 text-destructive ml-auto shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'p-3 rounded-xl border text-sm',
                selected === question.correctIndex
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
              )}
            >
              {question.explanation}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-end gap-3">
        {!showResult ? (
          <button
            onClick={handleCheck}
            disabled={selected === null}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            {isLast ? 'See Results' : 'Next Question'} <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
