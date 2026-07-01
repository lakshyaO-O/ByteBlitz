'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, ArrowLeft, Check, Sparkles, Code2, GraduationCap, Heart, Users, Star, BookOpen, Trophy, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

const reasons = [
  { key: 'learn', label: 'Learn Programming', icon: BookOpen, desc: 'Start from zero and build your skills' },
  { key: 'competitive', label: 'Competitive Programming', icon: Swords, desc: 'Compete and climb the ranks' },
  { key: 'interviews', label: 'Interview Preparation', icon: Star, desc: 'Crack coding interviews' },
  { key: 'college', label: 'College', icon: GraduationCap, desc: 'Supplement your coursework' },
  { key: 'school', label: 'School', icon: Users, desc: 'Get ahead in class' },
  { key: 'exploring', label: 'Just Exploring', icon: Heart, desc: 'See what coding is about' },
];

const languages = [
  { key: 'python', label: 'Python', color: 'from-yellow-400 to-blue-500', desc: 'Great for beginners' },
  { key: 'cpp', label: 'C++', color: 'from-blue-400 to-purple-500', desc: 'Fast and powerful' },
  { key: 'java', label: 'Java', color: 'from-red-400 to-orange-500', desc: 'Industry standard' },
  { key: 'javascript', label: 'JavaScript', color: 'from-yellow-300 to-yellow-600', desc: 'For the web' },
  { key: 'other', label: 'Not sure yet', color: 'from-gray-400 to-gray-600', desc: 'We will help you decide' },
];

const experienceLevels = [
  { key: 'complete_beginner', label: 'Complete Beginner', emoji: '🌱', desc: 'Never written a line of code' },
  { key: 'beginner', label: 'Beginner', emoji: '🌿', desc: 'Know a few basics' },
  { key: 'intermediate', label: 'Intermediate', emoji: '🌳', desc: 'Can build simple projects' },
  { key: 'advanced', label: 'Advanced', emoji: '🏆', desc: 'Ready for competitive coding' },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { updateBeginnerState, completeOnboarding } = useAppStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');
    if (step === 0 && !name.trim()) { setError('Please tell us your name'); return; }
    if (step === 2 && !experience) { setError('Please select your experience level'); return; }
    if (step === 3 && !language) { setError('Please pick a language'); return; }
    if (step === 4 && !reason) { setError('Please tell us why you are here'); return; }
    if (step >= 5) {
      updateBeginnerState({
        name: name.trim(),
        education,
        experienceLevel: experience as any,
        preferredLanguage: language,
        reason,
        hasCompletedOnboarding: true,
        isBeginnerMode: experience === 'complete_beginner' || experience === 'beginner',
      });
      completeOnboarding();
      onComplete();
      return;
    }
    setStep(s => s + 1);
  };

  const totalSteps = 6;
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <div className="relative min-h-screen w-full max-w-lg mx-auto px-4 py-6 sm:px-6 flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="flex justify-center mb-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-sm">
              <Zap className="h-8 w-8 text-primary fill-primary" />
            </div>
          </motion.div>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
            Step {step + 1} of {totalSteps}
          </p>
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="min-h-[400px]"
          >
            {step === 0 && (
              <div className="text-center space-y-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}>
                  <span className="text-6xl">👋</span>
                </motion.div>
                <h1 className="text-3xl font-headline font-bold">Welcome to DevRann!</h1>
                <p className="text-muted-foreground">We are excited to have you here. Let us personalize your experience.</p>
                <div className="max-w-xs mx-auto space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block text-left">
                    What is your name?
                  </label>
                  <Input
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-center h-12 text-lg bg-muted/50 border-border"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}>
                    <span className="text-6xl leading-none">🎓</span>
                  </motion.div>
                  <h2 className="text-2xl font-headline font-bold mt-4">Where are you studying?</h2>
                  <p className="text-muted-foreground text-sm mt-1">Optional — helps us tailor content for you</p>
                </div>
                <div className="max-w-xs mx-auto">
                  <Input
                    placeholder="School, college, or anything"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="text-center h-12 bg-muted/50 border-border"
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    autoFocus
                  />
                  <p className="text-[10px] text-muted-foreground text-center mt-2">You can skip this</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}>
                    <span className="text-6xl leading-none">📊</span>
                  </motion.div>
                  <h2 className="text-2xl font-headline font-bold mt-4">How much do you know?</h2>
                  <p className="text-muted-foreground text-sm mt-1">Be honest — this helps us start at the right level</p>
                </div>
                <div className="space-y-2">
                  {experienceLevels.map((level) => (
                    <button
                      key={level.key}
                      onClick={() => setExperience(level.key)}
                      className={cn(
                        'w-full p-4 rounded-xl border text-left transition-all',
                        experience === level.key
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border/50 hover:border-border hover:bg-muted/20'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none">{level.emoji}</span>
                        <div>
                          <p className="font-bold text-sm">{level.label}</p>
                          <p className="text-xs text-muted-foreground">{level.desc}</p>
                        </div>
                        {experience === level.key && (
                          <Check className="w-5 h-5 text-primary ml-auto shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}>
                    <Code2 className="w-12 h-12 text-primary mx-auto" />
                  </motion.div>
                  <h2 className="text-2xl font-headline font-bold mt-4">Choose your language</h2>
                  <p className="text-muted-foreground text-sm mt-1">Pick the language you want to learn first</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.key}
                      onClick={() => setLanguage(lang.key)}
                      className={cn(
                        'w-full rounded-xl border p-4 text-left transition-all',
                        language === lang.key
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border/50 hover:border-border hover:bg-muted/20'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br', lang.color)}>
                          <span className="text-white font-bold text-xs">{lang.key === 'javascript' ? 'JS' : lang.key === 'python' ? 'Py' : lang.key === 'cpp' ? 'C++' : lang.key === 'java' ? 'Ja' : '?'}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm">{lang.label}</p>
                          <p className="text-xs text-muted-foreground">{lang.desc}</p>
                        </div>
                        {language === lang.key && (
                          <Check className="w-5 h-5 text-primary ml-auto shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}>
                    <span className="text-5xl">🎯</span>
                  </motion.div>
                  <h2 className="text-2xl font-headline font-bold mt-4">Why are you here?</h2>
                  <p className="text-muted-foreground text-sm mt-1">What do you want to achieve?</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reasons.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setReason(r.key)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-all',
                        reason === r.key
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border/50 hover:border-border hover:bg-muted/20'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40">
                          <r.icon className={cn('h-5 w-5', reason === r.key ? 'text-primary' : 'text-muted-foreground')} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{r.label}</p>
                          <p className="text-xs text-muted-foreground">{r.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 150 }}
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                </motion.div>
                <h1 className="text-3xl font-headline font-bold">You are all set, {name || 'Coder'}!</h1>
                <p className="text-muted-foreground">
                  We have created a personalized learning path just for you.
                  {experience === 'complete_beginner' && " Let's start from the very beginning — no prior knowledge needed!"}
                  {experience === 'beginner' && " We will help you build on what you already know!"}
                  {experience === 'intermediate' && " We will challenge you with more advanced topics!"}
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <Code2 className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">{languages.find(l => l.key === language)?.label || language}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <BookOpen className="w-5 h-5 text-secondary mx-auto mb-1" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">{reasons.find(r => r.key === reason)?.label || reason}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can change these settings anytime in your profile.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-destructive text-sm text-center mt-4"
          >
            {error}
          </motion.p>
        )}

        <div className="flex flex-wrap justify-between gap-3 mt-8">
          <Button
            variant="ghost"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button onClick={handleNext} className="gap-1">
            {step >= 5 ? (
              <>
                Start Learning <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
